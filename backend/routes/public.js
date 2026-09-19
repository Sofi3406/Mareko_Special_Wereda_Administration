const express = require('express');
const router = express.Router();
const { getLandingStats, askLandingChatbot } = require('../controllers/publicController');

router.get('/landing-stats', getLandingStats);
router.post('/chatbot/ask', askLandingChatbot);

module.exports = router;