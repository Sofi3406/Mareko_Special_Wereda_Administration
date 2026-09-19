const Meeting = require('../models/Meeting');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/emailService');
const { buildWoredaRegex } = require('../utils/woreda');

const buildParticipants = async (emails = [], roles = [], woreda) => {
  const normalizedEmails = emails
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const emailUsers = normalizedEmails.length
    ? await User.find({ email: { $in: normalizedEmails } })
    : [];

  const woredaRegex = buildWoredaRegex(woreda);
  const roleFilter = {};

  if (woreda && woreda !== 'All Woredas') {
    roleFilter.woreda = woredaRegex ? { $regex: woredaRegex } : woreda;
  }

  const normalizedRoles = roles
    .map((role) => String(role).trim().toLowerCase())
    .filter(Boolean);

  const includeAllRoles = normalizedRoles.includes('all');
  const allowedRoles = ['resident', 'officer', 'woreda_admin', 'super_admin'];
  const selectedRoles = normalizedRoles.filter((role) => allowedRoles.includes(role));

  let roleUsers = [];
  if (includeAllRoles) {
    roleUsers = await User.find({ ...roleFilter });
  } else if (selectedRoles.length) {
    roleUsers = await User.find({
      role: { $in: selectedRoles },
      ...roleFilter
    });
  }

  const userMap = new Map();

  [...emailUsers, ...roleUsers].forEach((user) => {
    userMap.set(user._id.toString(), user);
  });

  return Array.from(userMap.values()).map((user) => ({
    user: user._id,
    email: user.email,
    role: user.role
  }));
};

// @desc    Get meetings
// @route   GET /api/meetings
// @access  Private
exports.getMeetings = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === 'woreda_admin') {
      const woredaRegex = buildWoredaRegex(req.user.woreda);
      filter = woredaRegex
        ? { $or: [{ woreda: { $regex: woredaRegex } }, { woreda: 'All Woredas' }] }
        : { $or: [{ woreda: req.user.woreda }, { woreda: 'All Woredas' }] };
    } else if (req.user.role === 'super_admin') {
      filter = {};
    } else {
      filter = {
        $or: [
          { 'participants.user': req.user.id },
          { 'participants.email': req.user.email }
        ]
      };
    }

    const meetings = await Meeting.find(filter)
      .populate('createdBy', 'fullName email')
      .populate('participants.user', 'fullName email role')
      .sort('scheduledAt');

    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create meeting
// @route   POST /api/meetings
// @access  Private (Woreda Admin / Sub-City Admin)
exports.createMeeting = async (req, res, next) => {
  try {
    if (req.user.role !== 'woreda_admin' && req.user.role !== 'super_admin') {
      return next(new ErrorResponse('Not authorized', 403));
    }

    const {
      title,
      description,
      meetingLink,
      scheduledAt,
      participantEmails,
      participantRoles,
      woreda
    } = req.body;

    if (!title || !meetingLink || !scheduledAt) {
      return next(new ErrorResponse('Please fill in all required fields', 400));
    }

    const emails = Array.isArray(participantEmails)
      ? participantEmails
      : typeof participantEmails === 'string'
        ? participantEmails.split(',')
        : [];

    const roles = Array.isArray(participantRoles)
      ? participantRoles
      : typeof participantRoles === 'string'
        ? participantRoles.split(',')
        : [];

    const meetingScope = req.user.role === 'woreda_admin'
      ? req.user.woreda
      : (woreda || 'All Woredas');

    const participants = await buildParticipants(emails, roles, meetingScope);

    if (!participants.length) {
      return next(new ErrorResponse('No valid participants found', 400));
    }

    const meeting = await Meeting.create({
      title,
      description,
      meetingLink,
      scheduledAt,
      woreda: meetingScope,
      createdBy: req.user.id,
      participants
    });

    const io = req.app.get('io');

    await Promise.all(
      participants.map(async (participant) => {
        if (participant.email) {
          const message = `
            <h2>Virtual Meeting Invitation</h2>
            <p>You have been invited to a virtual meeting.</p>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Date:</strong> ${new Date(scheduledAt).toLocaleString()}</p>
            <p><strong>Link:</strong> <a href="${meetingLink}">Join Meeting</a></p>
            <p>${description || ''}</p>
          `;

          await sendEmail({
            email: participant.email,
            subject: 'Virtual Meeting Invitation - Yegara',
            html: message
          });
        }

        if (io && participant.user) {
          io.to(`user-${participant.user.toString()}`).emit('notification', {
            type: 'meeting_scheduled',
            message: 'You have been invited to a virtual meeting',
            meetingId: meeting._id
          });
        }
      })
    );

    res.status(201).json({
      success: true,
      data: meeting
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update meeting
// @route   PUT /api/meetings/:id
// @access  Private (Woreda Admin / Sub-City Admin)
exports.updateMeeting = async (req, res, next) => {
  try {
    let meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return next(new ErrorResponse('Meeting not found', 404));
    }

    if (req.user.role !== 'woreda_admin' && req.user.role !== 'super_admin') {
      return next(new ErrorResponse('Not authorized', 403));
    }

    if (meeting.createdBy.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to update this meeting', 403));
    }

    const updates = { ...req.body };

    if (req.user.role === 'super_admin' && !updates.woreda) {
      updates.woreda = meeting.woreda;
    }

    if (req.user.role === 'woreda_admin') {
      updates.woreda = req.user.woreda;
    }

    const hasParticipantUpdates = updates.participantEmails !== undefined || updates.participantRoles !== undefined;

    if (hasParticipantUpdates) {
      const emails = Array.isArray(updates.participantEmails)
        ? updates.participantEmails
        : typeof updates.participantEmails === 'string'
          ? updates.participantEmails.split(',')
          : [];

      const roles = Array.isArray(updates.participantRoles)
        ? updates.participantRoles
        : typeof updates.participantRoles === 'string'
          ? updates.participantRoles.split(',')
          : [];

      const participants = await buildParticipants(emails, roles, updates.woreda || meeting.woreda);

      if (!participants.length) {
        return next(new ErrorResponse('No valid participants found', 400));
      }

      updates.participants = participants;
      delete updates.participantEmails;
      delete updates.participantRoles;
    }

    meeting = await Meeting.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: meeting
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete meeting
// @route   DELETE /api/meetings/:id
// @access  Private (Woreda Admin / Sub-City Admin)
exports.deleteMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return next(new ErrorResponse('Meeting not found', 404));
    }

    if (req.user.role !== 'woreda_admin' && req.user.role !== 'super_admin') {
      return next(new ErrorResponse('Not authorized', 403));
    }

    if (meeting.createdBy.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to delete this meeting', 403));
    }

    await meeting.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
