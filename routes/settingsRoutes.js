const express = require('express');
const multer = require('multer');

const router = express.Router();
const requireLogin = require('../modules/authenticate');
const settingsController = require('../controllers/settingsController');
const { createLog } = require('../modules/logService');
const { uploadImageBuffer, deleteImageByUrl } = require('../modules/cloudinaryService');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/settings', requireLogin, settingsController.getSettings);
router.post('/settings', requireLogin, settingsController.updateSettings);

router.post('/upload-settings-logo', requireLogin, upload.single('logoFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    uploadImageBuffer(req.file.buffer, { folder: 'dp-admin/settings' })
        .then((result) => {
            createLog({
                req,
                action: 'upload',
                entityType: 'settings-logo',
                message: `Settings logo uploaded by ${req.session?.name || 'system'}`,
                metadata: { publicId: result.public_id, uploadedBy: req.session?.name || 'system' },
            });

            return res.json({ imageUrl: result.secure_url, publicId: result.public_id });
        })
        .catch((error) => {
            console.error('Settings logo upload failed:', error);
            return res.status(500).json({ error: 'Failed to upload logo' });
        });
});

router.post('/delete-settings-logo', requireLogin, (req, res) => {
    const imageUrl = req.body.imageUrl;
    if (!imageUrl) {
        return res.status(400).json({ error: 'No image URL provided' });
    }

    deleteImageByUrl(imageUrl)
        .then(() => res.send({ message: 'Deleted successfully' }))
        .catch((error) => {
            console.error('Settings logo delete failed:', error);
            return res.status(500).json({ error: 'Failed to delete image' });
        });
});

module.exports = router;
