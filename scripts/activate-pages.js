const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const Blog = require('../models/Blog');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PAGE_BLOG_SLUGS = [
    'about-us',
    'faqs',
    'terms-and-policies',
    'privacy-policy',
    'cookies-policy',
    'contact-us',
];

async function run() {
    const isDryRun = process.argv.includes('--dry-run');

    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is missing in dp-admin/.env');
    }

    await mongoose.connect(process.env.MONGO_URI);

    try {
        const blogFilter = {
            $or: [
                { slug: { $in: PAGE_BLOG_SLUGS } },
                { title: { $regex: /about|faq|terms|privacy|cookies|contact/i } },
            ],
        };

        const pageDocsFilter = {
            key: { $in: ['about', 'contact', 'faq', 'terms', 'privacy', 'cookies'] },
        };

        const blogMatches = await Blog.countDocuments(blogFilter);
        const pageMatches = await mongoose.connection.collection('pages').countDocuments(pageDocsFilter);

        console.log('[activate-pages] Blog candidates:', blogMatches);
        console.log('[activate-pages] Page candidates:', pageMatches);

        if (isDryRun) {
            console.log('[activate-pages] Dry run complete. No changes made.');
            return;
        }

        const blogResult = await Blog.updateMany(blogFilter, { $unset: { isActive: '' } });

        // Use native collection updates so legacy documents with loose schema fields are also normalized.
        const pageResult = await mongoose.connection.collection('pages').updateMany(
            pageDocsFilter,
            {
                $unset: { isActive: '', active: '', status: '' },
            }
        );

        console.log('[activate-pages] Blogs matched:', blogResult.matchedCount, 'cleaned:', blogResult.modifiedCount);
        console.log('[activate-pages] Pages matched:', pageResult.matchedCount, 'cleaned:', pageResult.modifiedCount);
        console.log('[activate-pages] Legacy active/status flags cleaned.');
    } finally {
        await mongoose.disconnect();
    }
}

run().catch((error) => {
    console.error('[activate-pages] Failed:', error.message);
    process.exit(1);
});
