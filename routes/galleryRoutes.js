const express = require('express');
const multer = require('multer');
const router = express.Router();
const requireLogin = require('../modules/authenticate');
const galleryController = require('../controllers/galleryController');
const { uploadImageBuffer } = require('../modules/cloudinaryService');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/gallery', requireLogin, galleryController.getGallery);
router.post('/gallery/upload', requireLogin, upload.single('galleryImage'), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'No file uploaded' });
		}

		const result = await uploadImageBuffer(req.file.buffer, { folder: 'dp-admin/gallery' });
		return res.json({ imageUrl: result.secure_url, publicId: result.public_id });
	} catch (error) {
		console.error('Gallery image upload failed:', error);
		return res.status(500).json({ error: 'Failed to upload image' });
	}
});
router.post('/gallery', requireLogin, galleryController.createItem);
router.put('/gallery/reorder', requireLogin, galleryController.reorderItems);
router.delete('/gallery/:id', requireLogin, galleryController.deleteItem);

module.exports = router;
