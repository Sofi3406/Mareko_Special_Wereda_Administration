const express = require('express');
const router = express.Router();
const {
  getServices,
  getService,
  createService,
  updateService,
  getRequests,
  getRequest,
  createRequest,
  updateRequest
} = require('../controllers/serviceController');
const { authenticate, optionalAuthenticate, authorize } = require('../middleware/auth');
const upload = require('../utils/upload');

router.get('/', optionalAuthenticate, getServices);
router.post('/', authenticate, authorize('woreda_admin', 'super_admin'), createService);

router.get('/requests/list', authenticate, getRequests);
router.get('/requests/:id', authenticate, getRequest);
router.post('/requests', authenticate, upload.array('documents', 5), createRequest);
router.put('/requests/:id', authenticate, authorize('officer', 'kebele_admin', 'woreda_admin', 'super_admin'), updateRequest);

router.get('/:id', optionalAuthenticate, getService);
router.put('/:id', authenticate, authorize('woreda_admin', 'super_admin'), updateService);

module.exports = router;
