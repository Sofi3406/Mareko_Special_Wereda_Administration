const express = require('express');
const router = express.Router();
const { askChatbot } = require('../controllers/chatbotController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('resident'));

router.post('/ask', askChatbot);

module.exports = router;
