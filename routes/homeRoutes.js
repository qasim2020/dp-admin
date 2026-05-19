const express = require('express');
const router = express.Router();
const requireLogin = require('../modules/authenticate');
const homeController = require('../controllers/homeController');

router.get("/", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login")
    }
    res.redirect("/dashboard")
});

router.get("/dashboard", requireLogin, homeController.getDashboard);
router.post('/toggleSidebar', requireLogin, homeController.toggleSideBar);

module.exports = router;