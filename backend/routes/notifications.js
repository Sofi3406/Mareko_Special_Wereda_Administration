const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markAllAsRead
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getMyNotifications);
router.put('/read-all', markAllAsRead);

module.exports = router;
