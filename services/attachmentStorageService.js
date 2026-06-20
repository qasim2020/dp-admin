const crypto = require('crypto');

function sanitizePathComponent(input) {
    return String(input || '')
        .trim()
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 120);
}

function normalizeR2Config() {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const bucket = process.env.CLOUDFLARE_R2_BUCKET;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

    if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
        throw new Error('Cloudflare R2 credentials are missing');
    }

    const host = `${accountId}.r2.cloudflarestorage.com`;
    return {
        host,
        bucket,
        accessKeyId,
        secretAccessKey,
        region: 'auto',
    };
}

function hmac(key, data) {
    return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

function sha256Hex(data) {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

function toAmzDate(date = new Date()) {
    const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    return {
        long: `${iso.slice(0, 8)}T${iso.slice(9, 15)}Z`,
        short: iso.slice(0, 8),
    };
}

function getSigningKey(secretAccessKey, dateStamp, region, service) {
    const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
    const kRegion = hmac(kDate, region);
    const kService = hmac(kRegion, service);
    return hmac(kService, 'aws4_request');
}

function buildCanonicalQuery(query) {
    return Object.keys(query)
        .sort()
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
        .join('&');
}

function presignUrl({ method, key, expiresInSeconds = 120, contentType = '' }) {
    const cfg = normalizeR2Config();
    const now = new Date();
    const amz = toAmzDate(now);
    const credentialScope = `${amz.short}/${cfg.region}/s3/aws4_request`;
    const canonicalUri = `/${cfg.bucket}/${key}`;

    const query = {
        'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
        'X-Amz-Credential': `${cfg.accessKeyId}/${credentialScope}`,
        'X-Amz-Date': amz.long,
        'X-Amz-Expires': String(Number(expiresInSeconds) || 120),
        'X-Amz-SignedHeaders': contentType ? 'content-type;host' : 'host',
    };

    const canonicalHeaders = contentType
        ? `content-type:${contentType}\nhost:${cfg.host}\n`
        : `host:${cfg.host}\n`;

    const canonicalRequest = [
        method,
        canonicalUri,
        buildCanonicalQuery(query),
        canonicalHeaders,
        contentType ? 'content-type;host' : 'host',
        'UNSIGNED-PAYLOAD',
    ].join('\n');

    const stringToSign = [
        'AWS4-HMAC-SHA256',
        amz.long,
        credentialScope,
        sha256Hex(canonicalRequest),
    ].join('\n');

    const signingKey = getSigningKey(cfg.secretAccessKey, amz.short, cfg.region, 's3');
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');

    const finalQuery = `${buildCanonicalQuery(query)}&X-Amz-Signature=${signature}`;
    return {
        url: `https://${cfg.host}${canonicalUri}?${finalQuery}`,
        expiresAt: new Date(now.getTime() + (Number(query['X-Amz-Expires']) * 1000)).toISOString(),
    };
}

function buildAttachmentStorageKey({ webinarId, fileName }) {
    const safeWebinarId = sanitizePathComponent(webinarId || 'new');
    const safeName = sanitizePathComponent(fileName || 'attachment');
    const nonce = crypto.randomBytes(6).toString('hex');
    return `webinars/${safeWebinarId}/${Date.now()}-${nonce}-${safeName}`;
}

function createSignedDownloadUrl(storageKey, ttlSeconds = 120) {
    return presignUrl({
        method: 'GET',
        key: String(storageKey || ''),
        expiresInSeconds: ttlSeconds,
    });
}

function createSignedUploadUrl(storageKey, contentType, ttlSeconds = 300) {
    return presignUrl({
        method: 'PUT',
        key: String(storageKey || ''),
        expiresInSeconds: ttlSeconds,
        contentType: contentType || 'application/octet-stream',
    });
}

function createSignedDeleteUrl(storageKey, ttlSeconds = 120) {
    return presignUrl({
        method: 'DELETE',
        key: String(storageKey || ''),
        expiresInSeconds: ttlSeconds,
    });
}

module.exports = {
    buildAttachmentStorageKey,
    createSignedDownloadUrl,
    createSignedUploadUrl,
    createSignedDeleteUrl,
    sanitizePathComponent,
};
