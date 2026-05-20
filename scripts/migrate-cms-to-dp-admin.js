/* eslint-disable no-console */
const mongoose = require('mongoose');

const DEFAULT_SOURCE_URI = process.env.CMS_SOURCE_URI || 'mongodb://127.0.0.1:27017/CMS';
const DEFAULT_TARGET_URI = process.env.CMS_TARGET_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dp-admin';
const DEFAULT_BRAND = process.env.CMS_BRAND || 'dedicated_parents';

const FEATURE_COLLECTIONS = [
    { key: 'blogs', candidates: ['dedicated_parents-blogs'] },
    { key: 'causes', candidates: ['dedicated_parents-causes'] },
    { key: 'comments', candidates: ['dedicated_parents-comments'] },
    { key: 'events', candidates: ['dedicated_parents-events'] },
    { key: 'galleries', candidates: ['dedicated_parents-galleries', 'dedicated_parents-gallery'] },
    { key: 'logs', candidates: ['dedicated_parents-logs', 'dedicated_parents-log'] },
    { key: 'newsletters', candidates: ['dedicated_parents-newsletters'] },
    { key: 'notifications', candidates: ['dedicated_parents-notifications'] },
    { key: 'staffs', candidates: ['dedicated_parents-staffs'] },
    { key: 'subscribers', candidates: ['dedicated_parents-subscribers'] },
    { key: 'tickets', candidates: ['dedicated_parents-tickets'] },
    { key: 'users', candidates: ['dedicated_parents-users'] },
];

const parseArgs = () => {
    const args = process.argv.slice(2);
    const options = {
        sourceUri: DEFAULT_SOURCE_URI,
        targetUri: DEFAULT_TARGET_URI,
        brand: DEFAULT_BRAND,
        overwrite: false,
        dryRun: false,
    };

    for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (arg === '--source' && args[i + 1]) options.sourceUri = args[++i];
        else if (arg === '--target' && args[i + 1]) options.targetUri = args[++i];
        else if (arg === '--brand' && args[i + 1]) options.brand = args[++i];
        else if (arg === '--overwrite') options.overwrite = true;
        else if (arg === '--dry-run') options.dryRun = true;
    }

    return options;
};

const getAvailableCollections = async (db) => {
    const list = await db.listCollections({}, { nameOnly: true }).toArray();
    return new Set(list.map((item) => item.name));
};

const pickCollection = (availableSet, candidates) => {
    for (const name of candidates) {
        if (availableSet.has(name)) return name;
    }
    return null;
};

const copyCollection = async ({ sourceDb, targetDb, sourceName, targetName, overwrite, dryRun }) => {
    const sourceCollection = sourceDb.collection(sourceName);
    const targetCollection = targetDb.collection(targetName);

    const sourceCount = await sourceCollection.countDocuments();

    if (dryRun) {
        return { sourceName, targetName, sourceCount, copied: sourceCount, mode: 'dry-run' };
    }

    const docs = await sourceCollection.find({}).toArray();

    if (overwrite) {
        await targetCollection.deleteMany({});
    }

    if (docs.length === 0) {
        return { sourceName, targetName, sourceCount, copied: 0, mode: overwrite ? 'replace' : 'upsert' };
    }

    const operations = docs.map((doc) => ({
        replaceOne: {
            filter: { _id: doc._id },
            replacement: doc,
            upsert: true,
        },
    }));

    await targetCollection.bulkWrite(operations, { ordered: false });

    return {
        sourceName,
        targetName,
        sourceCount,
        copied: docs.length,
        mode: overwrite ? 'replace' : 'upsert',
    };
};

const run = async () => {
    const options = parseArgs();

    console.log('Starting migration:');
    console.log(`- Source DB URI: ${options.sourceUri}`);
    console.log(`- Target DB URI: ${options.targetUri}`);
    console.log(`- Brand: ${options.brand}`);
    console.log(`- Overwrite target: ${options.overwrite}`);
    console.log(`- Dry run: ${options.dryRun}`);

    const sourceConn = await mongoose.createConnection(options.sourceUri).asPromise();
    const targetConn = await mongoose.createConnection(options.targetUri).asPromise();

    try {
        const sourceDb = sourceConn.db;
        const targetDb = targetConn.db;

        const availableSourceCollections = await getAvailableCollections(sourceDb);
        const results = [];
        const migratedCollectionNames = [];

        for (const feature of FEATURE_COLLECTIONS) {
            const sourceName = pickCollection(availableSourceCollections, feature.candidates);
            if (!sourceName) {
                results.push({
                    feature: feature.key,
                    sourceName: feature.candidates[0],
                    targetName: feature.candidates[0],
                    sourceCount: 0,
                    copied: 0,
                    mode: 'missing-source',
                });
                continue;
            }

            const targetName = sourceName;
            const summary = await copyCollection({
                sourceDb,
                targetDb,
                sourceName,
                targetName,
                overwrite: options.overwrite,
                dryRun: options.dryRun,
            });

            migratedCollectionNames.push(targetName);
            results.push({ feature: feature.key, ...summary });
        }

        if (availableSourceCollections.has('collections')) {
            const collectionsFilter = {
                brand: options.brand,
                name: { $in: migratedCollectionNames },
            };

            const sourceCollectionsDocs = await sourceDb.collection('collections').find(collectionsFilter).toArray();

            if (!options.dryRun) {
                if (options.overwrite) {
                    await targetDb.collection('collections').deleteMany(collectionsFilter);
                }

                if (sourceCollectionsDocs.length > 0) {
                    const ops = sourceCollectionsDocs.map((doc) => ({
                        replaceOne: {
                            filter: { _id: doc._id },
                            replacement: doc,
                            upsert: true,
                        },
                    }));
                    await targetDb.collection('collections').bulkWrite(ops, { ordered: false });
                }
            }

            results.push({
                feature: 'collections-schema',
                sourceName: 'collections',
                targetName: 'collections',
                sourceCount: sourceCollectionsDocs.length,
                copied: sourceCollectionsDocs.length,
                mode: options.dryRun ? 'dry-run' : (options.overwrite ? 'replace' : 'upsert'),
            });
        } else {
            results.push({
                feature: 'collections-schema',
                sourceName: 'collections',
                targetName: 'collections',
                sourceCount: 0,
                copied: 0,
                mode: 'missing-source',
            });
        }

        console.log('\nMigration summary');
        console.table(results.map((item) => ({
            feature: item.feature,
            source: item.sourceName,
            target: item.targetName,
            sourceCount: item.sourceCount,
            copied: item.copied,
            mode: item.mode,
        })));

        console.log('Migration completed successfully.');
    } finally {
        await sourceConn.close();
        await targetConn.close();
    }
};

run().catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
});
