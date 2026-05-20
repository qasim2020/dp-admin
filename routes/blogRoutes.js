const express = require('express');
const multer = require('multer');

const router = express.Router();
const requireLogin = require('../modules/authenticate');
const blogController = require('../controllers/blogController');
const { createLog } = require('../modules/logService');
const { uploadImageBuffer, deleteImageByUrl } = require('../modules/cloudinaryService');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-blog-image', requireLogin, upload.single('blogImage'), (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: 'No file uploaded' });
	}

	uploadImageBuffer(req.file.buffer, { folder: 'dp-admin/blogs' })
		.then((result) => {
			createLog({
				req,
				action: 'upload',
				entityType: 'blog-image',
				message: `Blog image uploaded by ${req.session?.name || 'system'}`,
				metadata: { publicId: result.public_id, uploadedBy: req.session?.name || 'system' },
			});

			return res.json({ imageUrl: result.secure_url, publicId: result.public_id });
		})
		.catch((error) => {
			console.error('Blog image upload failed:', error);
			return res.status(500).json({ error: 'Failed to upload image' });
		});
});

router.post('/delete-blog-image', requireLogin, (req, res) => {
	const imageUrl = req.body.imageUrl;
	if (!imageUrl) {
		return res.status(400).json({ error: 'No image URL provided' });
	}

	deleteImageByUrl(imageUrl)
		.then(() => res.send({ message: 'Deleted successfully' }))
		.catch((error) => {
			console.error('Blog image delete failed:', error);
			return res.status(500).json({ error: 'Failed to delete image' });
		});
});

router.get('/blogs', requireLogin, blogController.blogs);
router.get('/blogs/:id/view', requireLogin, blogController.blogView);
router.post('/blogs', requireLogin, blogController.createBlog);
router.post('/blogs/:id', requireLogin, blogController.updateBlog);
router.post('/blogs/:id/delete', requireLogin, blogController.deleteBlog);

module.exports = router;
