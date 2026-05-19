const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const router = express.Router();
const requireLogin = require('../modules/authenticate');
const settingsController = require('../controllers/settingsController');
const { createLog } = require('../modules/logService');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const originalName = file.originalname;
        const ext = path.extname(originalName);
        const baseName = path.basename(originalName, ext);
        const safeName = baseName.replace(/\s+/g, '-').toLowerCase();

        cb(null, `${safeName}-${Date.now()}${ext}`);
    },
});

const upload = multer({ storage });

router.get('/settings', requireLogin, settingsController.getSettings);
router.post('/settings', requireLogin, settingsController.updateSettings);

router.post('/upload-settings-logo', requireLogin, upload.single('logoFile'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    createLog({
        req,
        action: 'upload',
        entityType: 'settings-logo',
        message: `Settings logo uploaded by ${req.session?.name || 'system'}`,
        metadata: { filename: req.file.filename, uploadedBy: req.session?.name || 'system' },
    });

    return res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

router.post('/delete-settings-logo', requireLogin, (req, res) => {
    const imageUrl = req.body.imageUrl;
    if (!imageUrl) return res.status(400).send('No image URL provided');

    const normalizedPath = imageUrl.replace(/^\//, '');
    const filePath = path.join(__dirname, '..', normalizedPath);
    fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
            console.error(err);
            return res.status(500).send('Failed to delete file');
        }
        return res.send({ message: 'Deleted successfully' });
    });
});

module.exports = router;
