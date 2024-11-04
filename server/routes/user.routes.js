const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth');

router.get('/profile', verifyToken, userController.getProfile);

module.exports = router;