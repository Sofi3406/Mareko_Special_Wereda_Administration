const express = require('express');
const router = express.Router();
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment
} = require('../controllers/departmentController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

router.get('/', optionalAuthenticate, getDepartments);
router.post('/', authenticate, createDepartment);
router.get('/:id', optionalAuthenticate, getDepartment);
router.put('/:id', authenticate, updateDepartment);

module.exports = router;
