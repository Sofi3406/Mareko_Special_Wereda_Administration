const Announcement = require('../models/Announcement');
const Kebele = require('../models/Kebele');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/emailService');
const { buildWoredaRegex } = require('../utils/woreda');
const { logAction } = require('./auditLogController');

const resolveAudienceFilter = (user) => {
  if (!user) return {};
  if (user.role === 'super_admin') return {};

  const roles = ['all', user.role];
  const woredaRegex = buildWoredaRegex(user.woreda);
  const scopeFilters = [
    { scopeType: 'wereda', ...(woredaRegex ? { woreda: { $regex: woredaRegex } } : { woreda: user.woreda }) },
    { scopeType: { $exists: false }, ...(woredaRegex ? { woreda: { $regex: woredaRegex } } : { woreda: user.woreda }) }
  ];
  if (user.kebele) scopeFilters.push({ scopeType: 'kebele', kebele: user.kebele });
  if (user.department) scopeFilters.push({ scopeType: 'department', department: user.department });

  return {
    audienceRoles: { $in: roles },
    $or: scopeFilters
  };
};

// @desc    Get announcements
// @route   GET /api/announcements
// @access  Private
exports.getAnnouncements = async (req, res, next) => {
  try {
    const filter = resolveAudienceFilter(req.user);

    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'fullName role')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get public announcements (read-only)
// @route   GET /api/announcements/public
// @access  Public
exports.getPublicAnnouncements = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const announcements = await Announcement.find({ audienceRoles: { $in: ['all'] } })
      .populate('createdBy', 'fullName role')
      .sort('-createdAt')
      .limit(limit);

    res.status(200).json({ success: true, count: announcements.length, data: announcements });
  } catch (err) {
    next(err);
  }
};

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private (Officer/Admin)
exports.createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, category, audienceRoles, woreda, scopeType = 'wereda', kebele, department } = req.body;

    if (!title || !message) {
      return next(new ErrorResponse('Please fill in all required fields', 400));
    }

    if (!['officer', 'woreda_admin', 'super_admin'].includes(req.user.role)) {
      return next(new ErrorResponse('Not authorized', 403));
    }
    if (!['wereda', 'kebele', 'department'].includes(scopeType)) {
      return next(new ErrorResponse('Invalid announcement scope', 400));
    }
    const announcementWoreda = req.user.woreda || 'Mareqo Wereda';
    if (scopeType === 'kebele') {
      const selectedKebele = await Kebele.findOne({ _id: kebele, woreda: announcementWoreda, isActive: true });
      if (!selectedKebele) return next(new ErrorResponse('Please select a valid kebele in Mareqo Wereda', 400));
    }
    if (scopeType === 'department' && !department) {
      return next(new ErrorResponse('Department is required for a department-wide announcement', 400));
    }

    const normalizedRoles = Array.isArray(audienceRoles)
      ? audienceRoles
      : typeof audienceRoles === 'string'
        ? audienceRoles.split(',')
        : ['all'];

    const announcement = await Announcement.create({
      title,
      message,
      category: category || 'General',
      image: req.file ? req.file.path.replace(/\\/g, '/') : undefined,
      audienceRoles: normalizedRoles.length ? normalizedRoles : ['all'],
      woreda: announcementWoreda,
      scopeType,
      kebele: scopeType === 'kebele' ? kebele : undefined,
      department: scopeType === 'department' ? department : undefined,
      createdBy: req.user.id
    });

    const recipientFilter = {
      role: { $in: normalizedRoles.includes('all') ? ['resident', 'officer', 'woreda_admin', 'super_admin'] : normalizedRoles }
    };

    if (announcement.scopeType === 'kebele') {
      recipientFilter.kebele = announcement.kebele;
    } else if (announcement.scopeType === 'department') {
      recipientFilter.department = announcement.department;
    } else if (announcement.woreda) {
      const woredaRegex = buildWoredaRegex(announcement.woreda);
      recipientFilter.woreda = woredaRegex ? { $regex: woredaRegex } : announcement.woreda;
    }

    const recipients = await User.find(recipientFilter).select('email');

    const io = req.app.get('io');

    await Promise.all(
      recipients.map(async (recipient) => {
        if (recipient.email) {
          const emailBody = `
            <h2>${announcement.title}</h2>
            <p>${announcement.message}</p>
            <p><strong>Category:</strong> ${announcement.category}</p>
          `;
          await sendEmail({
            email: recipient.email,
            subject: `Announcement: ${announcement.title}`,
            html: emailBody
          });
        }

        if (io) {
          io.to(`user-${recipient._id.toString()}`).emit('notification', {
            type: 'announcement',
            message: announcement.title,
            announcementId: announcement._id
          });
        }
      })
    );

    await logAction({ actor: req.user.id, action: 'published announcement', entity: 'Announcement', entityId: announcement._id, metadata: { title: announcement.title } });

    res.status(201).json({
      success: true,
      data: announcement
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Officer/Admin)
exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return next(new ErrorResponse('Announcement not found', 404));
    }

    if (!['officer', 'woreda_admin', 'super_admin'].includes(req.user.role)) {
      return next(new ErrorResponse('Not authorized', 403));
    }

    await announcement.deleteOne();
    await logAction({ actor: req.user.id, action: 'deleted announcement', entity: 'Announcement', entityId: announcement._id, metadata: { title: announcement.title } });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
