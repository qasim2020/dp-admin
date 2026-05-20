const { MongoClient } = require('mongodb');

async function run() {
    const uri = "mongodb://127.0.0.1:27017/dp-admin";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('dp-admin');
        const collections = await db.listCollections().toArray();
        const regex = /^dedicated_parents-/;
        const targets = collections.filter(c => regex.test(c.name)).map(c => c.name);
        
        console.log('Collections matching /^dedicated_parents-/:', targets);
        
        let droppedCount = 0;
        for (const name of targets) {
            await db.collection(name).drop();
            console.log('Dropped:', name);
            droppedCount++;
        }
        
        console.log('Final dropped count:', droppedCount);
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

run();
