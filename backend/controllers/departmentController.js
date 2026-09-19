const Department = require('../models/Department');
const ErrorResponse = require('../utils/errorResponse');

const adminRoles = ['woreda_admin', 'super_admin'];

exports.getDepartments = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.includeInactive !== 'true') query.isActive = true;
    if (req.query.search) query.name = { $regex: req.query.search.trim(), $options: 'i' };

    const departments = await Department.find(query).sort('name');
    res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (err) {
    next(err);
  }
};

exports.getDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return next(new ErrorResponse('Department not found', 404));
    res.status(200).json({ success: true, data: department });
  } catch (err) {
    next(err);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    if (!adminRoles.includes(req.user.role))
      return next(new ErrorResponse('Not authorized', 403));
    const department = await Department.create(req.body);
    res.status(201).json({ success: true, data: department });
  } catch (err) {
    next(err);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    if (!adminRoles.includes(req.user.role))
      return next(new ErrorResponse('Not authorized', 403));
    const allowed = ['name', 'code', 'description', 'responsibilities', 'contactPhone', 'contactEmail', 'officeLocation', 'isActive'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const department = await Department.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!department) return next(new ErrorResponse('Department not found', 404));
    res.status(200).json({ success: true, data: department });
  } catch (err) {
    next(err);
  }
};
