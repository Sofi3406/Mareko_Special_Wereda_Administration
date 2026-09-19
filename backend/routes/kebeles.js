const express = require('express');
const router = express.Router();
const {
  getKebeles,
  getKebele,
  createKebele,
  updateKebele,
  getKebeleStats
} = require('../controllers/kebeleController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

router.get('/', optionalAuthenticate, getKebeles);
router.post('/', authenticate, createKebele);
router.get('/:id/stats', authenticate, getKebeleStats);
router.get('/:id', optionalAuthenticate, getKebele);
router.put('/:id', authenticate, updateKebele);

module.exports = router;
