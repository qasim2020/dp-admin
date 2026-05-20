const { v2: cloudinary } = require('cloudinary');

const getCloudinaryConfig = () => ({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
});

const ensureConfigured = () => {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    if (!cloudName || !apiKey || !apiSecret) {
        return false;
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
    });

    return true;
};

const isConfigured = () => {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    return Boolean(cloudName && apiKey && apiSecret);
};

const uploadImageBuffer = (buffer, options = {}) => {
    if (!ensureConfigured()) {
        throw new Error('Cloudinary is not configured');
    }

    return new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
            {
                folder: options.folder || 'dp-admin',
                resource_type: 'image',
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            }
        );

        upload.end(buffer);
    });
};

const extractPublicIdFromUrl = (url) => {
    if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
        return null;
    }

    const marker = '/upload/';
    const markerIndex = url.indexOf(marker);
    if (markerIndex === -1) {
        return null;
    }

    let tail = url.slice(markerIndex + marker.length);
    tail = tail.split('?')[0];

    if (tail.startsWith('v')) {
        const slashIndex = tail.indexOf('/');
        if (slashIndex > 1 && /^v\d+$/.test(tail.slice(0, slashIndex))) {
            tail = tail.slice(slashIndex + 1);
        }
    }

    const lastDot = tail.lastIndexOf('.');
    if (lastDot > 0) {
        tail = tail.slice(0, lastDot);
    }

    return tail || null;
};

const deleteImageByPublicId = async (publicId) => {
    if (!ensureConfigured() || !publicId) {
        return;
    }

    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
};

const deleteImageByUrl = async (url) => {
    const publicId = extractPublicIdFromUrl(url);
    if (!publicId) {
        return;
    }

    await deleteImageByPublicId(publicId);
};

module.exports = {
    isConfigured,
    uploadImageBuffer,
    deleteImageByPublicId,
    deleteImageByUrl,
    extractPublicIdFromUrl,
};
