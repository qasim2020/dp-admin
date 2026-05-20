/* ============================================================
   rename-collections.js
   Phase 2 — Renames dedicated_parents-* collections to clean
   names, all within the "dp-admin" MongoDB database.

   Decisions locked in memoryMap/02-decisions.md:
     - DB          : dp-admin  (single shared DB)
         - staffs      → team
     - galleries   → gallery

   Usage:
     node scripts/rename-collections.js --dry-run          preview only, zero DB writes
     node scripts/rename-collections.js                    live rename all
     node scripts/rename-collections.js --collection blogs rename one collection only
     node scripts/rename-collections.js --rollback         reverse all renames (undo)
   ============================================================ */

const { MongoClient } = require('mongodb');
const fs   = require('fs');
const path = require('path');

const URI     = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'dp-admin';

// ── Rename map (forward direction) ──────────────────────────────────────────
const RENAME_MAP = [
    { from: 'dedicated_parents-blogs',          to: 'blogs'         },
    { from: 'dedicated_parents-causes',         to: 'causes'        },
    { from: 'dedicated_parents-comments',       to: 'comments'      },
    { from: 'dedicated_parents-events',         to: 'events'        },
    { from: 'dedicated_parents-galleries',      to: 'gallery'       },  // decision: gallery
    { from: 'dedicated_parents-logs',           to: 'logs'          },
    { from: 'dedicated_parents-notifications',  to: 'notifications' },
    { from: 'dedicated_parents-staffs',         to: 'team'          },  // decision: team
    { from: 'dedicated_parents-subscribers',    to: 'subscribers'   },
    { from: 'dedicated_parents-tickets',        to: 'tickets'       },
    { from: 'dedicated_parents-users',          to: 'users'         },
    { from: 'dedicated_parents-newsletters',    to: 'newsletters'   },
];

// ── Flags ────────────────────────────────────────────────────────────────────
const isDryRun   = process.argv.includes('--dry-run');
const isRollback = process.argv.includes('--rollback');
const singleIdx  = process.argv.indexOf('--collection');
const singleName = singleIdx !== -1 ? process.argv[singleIdx + 1] : null;

const log  = (...a) => console.log('[migrate]', ...a);
const warn = (...a) => console.warn('[WARN]',    ...a);
const fail = (...a) => console.error('[ERROR]',  ...a);

// ── Helpers ──────────────────────────────────────────────────────────────────
async function colExists(db, name) {
    const list = await db.listCollections({ name }).toArray();
    return list.length > 0;
}

async function getIndexCount(db, name) {
    try {
        const idxs = await db.collection(name).indexes();
        return idxs.length;
    } catch (_) { return 0; }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
    const client = new MongoClient(URI);
    await client.connect();
    const db = client.db(DB_NAME);

    log(`Database   : ${DB_NAME}`);
    log(`Mode       : ${isDryRun ? 'DRY-RUN' : isRollback ? 'ROLLBACK' : 'LIVE'}`);
    if (singleName) log(`Single     : ${singleName}`);
    log('─'.repeat(60));

    const report    = [];
    const startedAt = new Date().toISOString();

    // ── Build active map (forward or reverse) ──
    let activeMap = isRollback
        ? RENAME_MAP.map(({ from, to }) => ({ from: to, to: from }))
        : [...RENAME_MAP];

    if (singleName) {
        activeMap = activeMap.filter(({ from }) => from === singleName);
        if (activeMap.length === 0) {
            fail(`No entry found for --collection "${singleName}"`);
            await client.close();
            process.exit(1);
        }
    }

    // ── Process each entry ──
    for (const { from, to } of activeMap) {
        const srcExists = await colExists(db, from);

        if (!srcExists) {
            warn(`SKIP  "${from}" — collection does not exist`);
            report.push({ from, to, status: 'skipped', reason: 'source not found' });
            continue;
        }

        const fromCount  = await db.collection(from).countDocuments();
        const fromIdxCnt = await getIndexCount(db, from);

        if (isDryRun) {
            log(`DRY   "${from}" (${fromCount} docs, ${fromIdxCnt} indexes) → "${to}"`);
            report.push({ from, to, status: 'dry-run', fromCount, indexCount: fromIdxCnt });
            continue;
        }

        // Target must not already exist
        const tgtExists = await colExists(db, to);
        if (tgtExists) {
            fail(`ABORT "${from}" → "${to}" — target already exists. Drop it first or use --rollback.`);
            report.push({ from, to, status: 'aborted', reason: 'target already exists' });
            await writeReport(report, startedAt);
            await client.close();
            process.exit(1);
        }

        try {
            await db.collection(from).rename(to, { dropTarget: false });

            const afterCount  = await db.collection(to).countDocuments();
            const afterIdxCnt = await getIndexCount(db, to);

            if (fromCount !== afterCount) {
                fail(`COUNT MISMATCH "${to}": before=${fromCount} after=${afterCount}`);
                report.push({ from, to, status: 'count-mismatch', fromCount, afterCount });
                await writeReport(report, startedAt);
                await client.close();
                process.exit(1);
            }

            log(`OK    "${from}" → "${to}"  (docs: ${afterCount}, indexes: ${afterIdxCnt})`);
            report.push({ from, to, status: 'ok', count: afterCount, indexCount: afterIdxCnt });

        } catch (e) {
            fail(`FAIL  "${from}" → "${to}": ${e.message}`);
            report.push({ from, to, status: 'error', message: e.message });
            await writeReport(report, startedAt);
            await client.close();
            process.exit(1);
        }
    }

    log('─'.repeat(60));
    const ok      = report.filter(r => r.status === 'ok').length;
    const skipped = report.filter(r => r.status === 'skipped').length;
    const dryRuns = report.filter(r => r.status === 'dry-run').length;
    log(`Done. ok=${ok}  skipped=${skipped}  dry-run=${dryRuns}`);

    await writeReport(report, startedAt);
    await client.close();
}

async function writeReport(report, startedAt) {
    const logPath = path.join(__dirname, 'migration-log.json');
    const payload = {
        startedAt,
        finishedAt : new Date().toISOString(),
        mode       : isDryRun ? 'dry-run' : isRollback ? 'rollback' : 'live',
        database   : DB_NAME,
        results    : report,
    };
    fs.writeFileSync(logPath, JSON.stringify(payload, null, 2));
    log(`Report written → ${logPath}`);
}

run().catch(e => {
    console.error('[FATAL]', e.message);
    process.exit(1);
});
