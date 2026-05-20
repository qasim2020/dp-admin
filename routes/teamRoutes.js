const express = require('express');
const multer = require('multer');
const router = express.Router();
const requireLogin = require('../modules/authenticate');
const teamController = require('../controllers/teamController');
const { uploadImageBuffer } = require('../modules/cloudinaryService');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/team', requireLogin, teamController.getTeam);
router.get('/team/:id', requireLogin, teamController.getMember);
router.post('/upload-team-image', requireLogin, upload.single('teamImage'), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'No file uploaded' });
		}

		const result = await uploadImageBuffer(req.file.buffer, { folder: 'dp-admin/team' });
		return res.json({ imageUrl: result.secure_url, publicId: result.public_id });
	} catch (error) {
		console.error('Team image upload failed:', error);
		return res.status(500).json({ error: 'Failed to upload image' });
	}
});
router.post('/team', requireLogin, teamController.createMember);
router.put('/team/reorder', requireLogin, teamController.reorderMembers);
router.post('/team/reorder', requireLogin, teamController.reorderMembers);
router.put('/team/:id', requireLogin, teamController.updateMember);
router.delete('/team/:id', requireLogin, teamController.deleteMember);

module.exports = router;
