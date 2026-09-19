const express = require('express');
const router = express.Router();
const {
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting
} = require('../controllers/meetingController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.route('/')
  .get(getMeetings)
  .post(authorize('woreda_admin', 'super_admin'), createMeeting);

router.route('/:id')
  .put(authorize('woreda_admin', 'super_admin'), updateMeeting)
  .delete(authorize('woreda_admin', 'super_admin'), deleteMeeting);

module.exports = router;
