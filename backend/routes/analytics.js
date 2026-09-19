const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getRealtimeData,
  exportAnalytics,
  getSystemStats,
  getWoredaStats,
  getWoredaDashboardAnalytics
} = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/system-stats', authorize('super_admin'), getSystemStats);
router.get('/woreda-stats', authorize('woreda_admin', 'super_admin'), getWoredaStats);
router.get('/woreda-dashboard', authorize('woreda_admin', 'super_admin'), getWoredaDashboardAnalytics);
router.get('/', authorize('super_admin'), getAnalytics);
router.get('/realtime', authorize('super_admin'), getRealtimeData);
router.get('/export', authorize('super_admin'), exportAnalytics);

module.exports = router;