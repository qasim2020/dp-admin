const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ACTIVE_STATUS_REGEX = /^\s*(active|inactive|in-active|true|false)\s*$/i;

const buildFilter = (includeStatus) => {
    const orConditions = [
        { isActive: { $exists: true } },
        { active: { $exists: true } },
    ];

    if (includeStatus) {
        orConditions.push(
            { status: { $in: [true, false, 1, 0, '1', '0'] } },
            { status: { $regex: ACTIVE_STATUS_REGEX } }
        );
    }

    return { $or: orConditions };
};

const buildUpdate = (includeStatus) => ({
    $unset: {
        isActive: '',
        active: '',
        ...(includeStatus ? { status: '' } : {}),
    },
});

async function run() {
    const isDryRun = process.argv.includes('--dry-run');

    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is missing in dp-admin/.env');
    }

    await mongoose.connect(process.env.MONGO_URI);

    try {
        const collections = await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray();
        const summary = [];

        for (const { name } of collections) {
            if (name.startsWith('system.')) {
                continue;
            }

            const collection = mongoose.connection.collection(name);
            const withStatusFilter = buildFilter(true);
            const withoutStatusFilter = buildFilter(false);

            const withStatusCount = await collection.countDocuments(withStatusFilter);
            if (withStatusCount === 0) {
                summary.push({ name, matched: 0, modified: 0, statusRemoved: false });
                continue;
            }

            const withoutStatusCount = await collection.countDocuments(withoutStatusFilter);
            const statusCandidates = Math.max(withStatusCount - withoutStatusCount, 0);
            const includeStatus = statusCandidates > 0;

            if (isDryRun) {
                summary.push({ name, matched: withStatusCount, modified: 0, statusRemoved: includeStatus });
                continue;
            }

            const filter = includeStatus ? withStatusFilter : withoutStatusFilter;
            const update = buildUpdate(includeStatus);
            const result = await collection.updateMany(filter, update);

            summary.push({
                name,
                matched: result.matchedCount,
                modified: result.modifiedCount,
                statusRemoved: includeStatus,
            });
        }

        console.log('[cleanup-active-flags] Collection cleanup summary');
        for (const row of summary) {
            console.log(
                ` - ${row.name}: matched=${row.matched}, modified=${row.modified}, statusRemoved=${row.statusRemoved ? 'yes' : 'no'}`
            );
        }

        const totals = summary.reduce(
            (acc, row) => {
                acc.matched += row.matched;
                acc.modified += row.modified;
                if (row.statusRemoved) acc.statusCollections += 1;
                return acc;
            },
            { matched: 0, modified: 0, statusCollections: 0 }
        );

        if (isDryRun) {
            console.log('[cleanup-active-flags] Dry run complete. No changes made.');
        }

        console.log(
            `[cleanup-active-flags] Totals: matched=${totals.matched}, modified=${totals.modified}, collectionsWithStatusCleanup=${totals.statusCollections}`
        );
    } finally {
        await mongoose.disconnect();
    }
}

run().catch((error) => {
    console.error('[cleanup-active-flags] Failed:', error.message);
    process.exit(1);
});
