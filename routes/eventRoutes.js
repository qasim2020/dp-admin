const express = require('express');
const multer = require('multer');
const router = express.Router();
const requireLogin = require('../modules/authenticate');
const eventController = require('../controllers/eventController');
const { uploadImageBuffer, deleteImageByUrl } = require('../modules/cloudinaryService');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-event-image', requireLogin, upload.single('eventImage'), (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: 'No file uploaded' });
	}

	uploadImageBuffer(req.file.buffer, { folder: 'dp-admin/events' })
		.then((result) => {
			return res.json({ imageUrl: result.secure_url, publicId: result.public_id });
		})
		.catch((error) => {
			console.error('Event image upload failed:', error);
			return res.status(500).json({ error: 'Failed to upload image' });
		});
});

router.post('/delete-event-image', requireLogin, (req, res) => {
	const imageUrl = req.body.imageUrl;
	if (!imageUrl) {
		return res.status(400).json({ error: 'No image URL provided' });
	}

	deleteImageByUrl(imageUrl)
		.then(() => res.send({ message: 'Deleted successfully' }))
		.catch((error) => {
			console.error('Event image delete failed:', error);
			return res.status(500).json({ error: 'Failed to delete image' });
		});
});

router.get('/events', requireLogin, eventController.getEvents);
router.get('/events/:id', requireLogin, eventController.getEvent);
router.post('/events', requireLogin, eventController.createEvent);
router.patch('/events/:id/featured', requireLogin, eventController.toggleFeatured);
router.put('/events/:id', requireLogin, eventController.updateEvent);
router.delete('/events/:id', requireLogin, eventController.deleteEvent);

module.exports = router;
