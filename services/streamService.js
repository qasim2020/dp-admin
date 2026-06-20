const axios = require('axios');

function extractPlaybackId(input) {
    return String(input || '')
        .trim()
        .replace(/^https?:\/\/(?:www\.)?iframe\.videodelivery\.net\//, '')
        .replace(/^https?:\/\/(?:www\.)?cloudflarestream\.com\//, '')
        .replace(/\/(iframe|watch|manifest.*)$/i, '')
        .split('?')[0]
        .split('#')[0]
        .replace(/\/$/, '');
}

async function createDirectUploadUrl({ maxDurationSeconds } = {}) {
    const accountId = process.env.CLOUDFLARE_STREAM_ACCOUNT_ID;
    const token = process.env.CLOUDFLARE_STREAM_API_TOKEN;

    if (!accountId || !token) {
        throw new Error('Cloudflare Stream credentials are missing');
    }

    const payload = {};
    if (maxDurationSeconds) {
        payload.maxDurationSeconds = Number(maxDurationSeconds);
    }

    const response = await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
        payload,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        }
    );

    if (!response.data?.success) {
        throw new Error(response.data?.errors?.[0]?.message || 'Failed to create direct upload URL');
    }

    return response.data.result;
}

module.exports = {
    extractPlaybackId,
    createDirectUploadUrl,
};
