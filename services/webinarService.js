function slugify(text) {
    return String(text || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

async function createUniqueWebinarSlug(WebinarModel, title, excludeId = null) {
    const base = slugify(title) || `webinar-${Date.now()}`;
    let attempt = 0;

    while (attempt < 100) {
        const suffix = attempt === 0 ? '' : `-${attempt + 1}`;
        const slug = `${base}${suffix}`;
        const filter = { slug };
        if (excludeId) {
            filter._id = { $ne: excludeId };
        }

        const exists = await WebinarModel.exists(filter);
        if (!exists) {
            return slug;
        }

        attempt += 1;
    }

    return `${base}-${Date.now()}`;
}

function normalizePlaybackId(value) {
    const raw = String(value || '').trim();
    if (!raw) {
        return '';
    }

    const iframeMatch = raw.match(/cloudflarestream\.com\/([a-zA-Z0-9]+)\/(?:iframe|manifest|watch)/);
    if (iframeMatch) {
        return iframeMatch[1];
    }

    const bareMatch = raw.match(/^[a-zA-Z0-9]+$/);
    if (bareMatch) {
        return raw;
    }

    return raw.split('/').filter(Boolean).pop() || raw;
}

module.exports = {
    slugify,
    createUniqueWebinarSlug,
    normalizePlaybackId,
};
