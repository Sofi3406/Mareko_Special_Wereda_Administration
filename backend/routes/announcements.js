const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getPublicAnnouncements
} = require('../controllers/announcementController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../utils/upload');

// Public announcements (stricter limits to prevent spam)
const { createPublicLimiter } = require('../middleware/rateLimiter');
router.get('/public', createPublicLimiter({ max: 10 }), getPublicAnnouncements);

router.use(authenticate);

router.route('/')
  .get(getAnnouncements)
  .post(authorize('officer', 'woreda_admin', 'super_admin'), upload.single('image'), createAnnouncement);

router.route('/:id')
  .delete(authorize('officer', 'woreda_admin', 'super_admin'), deleteAnnouncement);

module.exports = router;
