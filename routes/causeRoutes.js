const express = require('express');
const multer = require('multer');
const router = express.Router();
const requireLogin = require('../modules/authenticate');
const causeController = require('../controllers/causeController');
const { uploadImageBuffer, deleteImageByUrl } = require('../modules/cloudinaryService');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-cause-image', requireLogin, upload.single('causeImage'), (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: 'No file uploaded' });
	}

	uploadImageBuffer(req.file.buffer, { folder: 'dp-admin/causes' })
		.then((result) => {
			return res.json({ imageUrl: result.secure_url, publicId: result.public_id });
		})
		.catch((error) => {
			console.error('Cause image upload failed:', error);
			return res.status(500).json({ error: 'Failed to upload image' });
		});
});

router.post('/delete-cause-image', requireLogin, (req, res) => {
	const imageUrl = req.body.imageUrl;
	if (!imageUrl) {
		return res.status(400).json({ error: 'No image URL provided' });
	}

	deleteImageByUrl(imageUrl)
		.then(() => res.send({ message: 'Deleted successfully' }))
		.catch((error) => {
			console.error('Cause image delete failed:', error);
			return res.status(500).json({ error: 'Failed to delete image' });
		});
});

router.get('/causes', requireLogin, causeController.getCauses);
router.get('/causes/:id', requireLogin, causeController.getCause);
router.post('/causes', requireLogin, causeController.createCause);
router.put('/causes/:id', requireLogin, causeController.updateCause);
router.delete('/causes/:id', requireLogin, causeController.deleteCause);

module.exports = router;
