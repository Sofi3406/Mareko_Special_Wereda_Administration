const express = require('express');
const router = express.Router();
const {
  getResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  downloadResource
} = require('../controllers/resourceController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../utils/upload');

router.use(authenticate);

router.route('/')
  .get(getResources)
  .post(authorize('officer', 'woreda_admin', 'super_admin'), upload.single('file'), createResource);

router.route('/:id')
  .get(getResource)
  .put(authorize('officer', 'woreda_admin', 'super_admin'), upload.single('file'), updateResource)
  .delete(authorize('officer', 'woreda_admin', 'super_admin'), deleteResource);

router.get('/:id/download', downloadResource);

module.exports = router;
