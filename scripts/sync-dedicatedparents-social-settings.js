const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const Settings = require('../models/Settings');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SOCIAL_LINKS = {
    socialFacebook: 'https://www.facebook.com/dedicatedparents2018',
    socialInstagram: 'https://www.instagram.com/dedicatedparents/',
    socialTwitter: 'https://twitter.com/Dedicatedparen1',
    socialLinkedIn: 'https://www.linkedin.com/company/dedicated-parents/',
};

async function run() {
    const isDryRun = process.argv.includes('--dry-run');

    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is missing in dp-admin/.env');
    }

    await mongoose.connect(process.env.MONGO_URI);

    try {
        const current = await Settings.findOne({ key: 'main' }).lean();

        console.log('[sync-social] Existing key=main values:');
        console.log(JSON.stringify({
            socialFacebook: current?.socialFacebook || '',
            socialInstagram: current?.socialInstagram || '',
            socialTwitter: current?.socialTwitter || '',
            socialLinkedIn: current?.socialLinkedIn || '',
            socialYouTube: current?.socialYouTube || '',
            socialTikTok: current?.socialTikTok || '',
        }, null, 2));

        if (isDryRun) {
            console.log('[sync-social] Dry run complete. No changes made.');
            return;
        }

        const updated = await Settings.findOneAndUpdate(
            { key: 'main' },
            { $set: SOCIAL_LINKS },
            { upsert: true, new: true }
        ).lean();

        console.log('[sync-social] Updated key=main values:');
        console.log(JSON.stringify({
            socialFacebook: updated.socialFacebook || '',
            socialInstagram: updated.socialInstagram || '',
            socialTwitter: updated.socialTwitter || '',
            socialLinkedIn: updated.socialLinkedIn || '',
            socialYouTube: updated.socialYouTube || '',
            socialTikTok: updated.socialTikTok || '',
        }, null, 2));
        console.log('[sync-social] Done.');
    } finally {
        await mongoose.disconnect();
    }
}

run().catch((error) => {
    console.error('[sync-social] Failed:', error.message);
    process.exit(1);
});
