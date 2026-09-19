const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { buildWoredaRegex } = require('../utils/woreda');

// Helper used by other controllers to record an action
exports.logAction = async ({ actor, action, entity, entityId, metadata }) => {
  try {
    await AuditLog.create({ actor, action, entity, entityId, metadata });
  } catch (_) {
    // Non-fatal — never block the main request
  }
};

// @desc  Get audit logs (paginated, filterable)
// @route GET /api/audit-logs
// @access Private (subcity_admin, woreda_admin)
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { entity, action, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (entity) filter.entity = entity;
    if (action) filter.action = { $regex: action, $options: 'i' };

    if (req.user.role === 'woreda_admin') {
      const woredaRegex = buildWoredaRegex(req.user.woreda);
      const actors = await User.find({
        ...(woredaRegex ? { woreda: { $regex: woredaRegex } } : { woreda: req.user.woreda })
      }).distinct('_id');
      filter.actor = { $in: actors };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor', 'fullName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: logs
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get distinct entity types (for filter dropdown)
// @route GET /api/audit-logs/entities
// @access Private (subcity_admin, woreda_admin)
exports.getEntityTypes = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'woreda_admin') {
      const woredaRegex = buildWoredaRegex(req.user.woreda);
      const actors = await User.find({
        ...(woredaRegex ? { woreda: { $regex: woredaRegex } } : { woreda: req.user.woreda })
      }).distinct('_id');
      filter.actor = { $in: actors };
    }
    const entities = await AuditLog.distinct('entity', filter);
    res.status(200).json({ success: true, data: entities });
  } catch (err) {
    next(err);
  }
};
