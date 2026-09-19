const express = require('express');
const router = express.Router();
const { getAuditLogs, getEntityTypes } = require('../controllers/auditLogController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('super_admin', 'woreda_admin'));

router.get('/', getAuditLogs);
router.get('/entities', getEntityTypes);

module.exports = router;
