const Event = require('../models/Event');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const { buildWoredaRegex } = require('../utils/woreda');
const { validateRegistrationEligibility } = require('../utils/eventRegistrationEligibility');
const {
  findUserTicket,
  findGuestTicket,
  isUserRegistered,
  generateUniqueEntranceCode,
  buildTicketPayload
} = require('../utils/eventTickets');

const toWebPath = (filePath = '') => filePath.replace(/\\/g, '/');
const SUBCITY_EVENT_WOREDA = 'All Woredas';

const applyEventWoredaFilter = (filter, woredaQuery) => {
  if (!woredaQuery || woredaQuery === 'all') {
    return filter;
  }

  const next = { ...filter };

  if (woredaQuery === SUBCITY_EVENT_WOREDA || woredaQuery === 'subcity') {
    next.woreda = SUBCITY_EVENT_WOREDA;
    return next;
  }

  const woredaRegex = buildWoredaRegex(woredaQuery);
  next.woreda = woredaRegex ? { $regex: woredaRegex } : woredaQuery;
  return next;
};
const countEventRegistrations = (event) => {
  if (!event) return 0;

  const ticketCount = Array.isArray(event.registrationTickets) ? event.registrationTickets.length : 0;
  const attendeeCount = Array.isArray(event.attendees) ? event.attendees.length : 0;
  const guestCount = Array.isArray(event.guestAttendees) ? event.guestAttendees.length : 0;

  return Math.max(ticketCount, attendeeCount + guestCount);
};

const getRegistrationCount = (event) => {
  if (!event) return 0;

  const fromArrays = countEventRegistrations(event);

  return Math.max(
    fromArrays,
    Number(event.registrationCount) || 0,
    Number(event.attendeeCount) || 0
  );
};

const serializeEvent = (event) => {
  const eventObject = typeof event.toObject === 'function' ? event.toObject() : event;
  return {
    ...eventObject,
    registrationCount: getRegistrationCount(eventObject)
  };
};

const serializeEventSummary = (event, userId) => {
  const serialized = serializeEvent(event);

  if (userId) {
    const ticket = findUserTicket(event, userId);
    serialized.isRegistered = isUserRegistered(event, userId);
    if (ticket?.entranceCode) {
      serialized.myEntranceCode = ticket.entranceCode;
    }
  }

  delete serialized.attendees;
  delete serialized.guestAttendees;
  delete serialized.registrationTickets;
  return serialized;
};

const normalizeId = (value) => {
  if (value == null) return '';

  if (typeof value === 'object' && value._id != null) {
    return String(value._id);
  }

  return String(value);
};

const canViewEventRegistrations = (user, event) => {
  if (!user || !event) return false;

  const organizerId = normalizeId(event.organizer?._id || event.organizer);
  const userId = normalizeId(user._id || user.id);

  if (organizerId && userId && organizerId === userId) {
    return true;
  }

  return ['woreda_admin', 'super_admin'].includes(user.role);
};

const serializeEventForUser = (event, user) => {
  const serialized = serializeEvent(event);

  if (!canViewEventRegistrations(user, event)) {
    delete serialized.attendees;
    delete serialized.guestAttendees;
    delete serialized.registrationTickets;
  }

  return serialized;
};

// @desc    Get all events
// @route   GET /api/events
// @access  Private
exports.getEvents = async (req, res, next) => {
  try {
    let query;
    const reqQuery = { ...req.query };
    const woredaQuery = reqQuery.woreda;

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'woreda'];
    removeFields.forEach(param => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    let mongoFilter = Object.keys(reqQuery).length ? JSON.parse(queryStr) : {};
    mongoFilter = applyEventWoredaFilter(mongoFilter, woredaQuery);

    query = Event.find(mongoFilter).populate('organizer', 'fullName email role');

    // Select fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Event.countDocuments(mongoFilter);

    query = query.skip(startIndex).limit(limit);

    const events = await query;

    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: events.length,
      pagination,
      data: events.map((event) => serializeEventSummary(event, req.user?.id))
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get events the current user can register for (officer / woreda admin)
// @route   GET /api/events/registerable
// @access  Private (Officer, Woreda Admin)
exports.getRegisterableEvents = async (req, res, next) => {
  try {
    if (!['officer', 'woreda_admin'].includes(req.user.role)) {
      return next(new ErrorResponse('Only officers and woreda administrators can use this endpoint', 403));
    }

    const woredaRegex = buildWoredaRegex(req.user.woreda);
    const woredaFilter = woredaRegex
      ? { $or: [{ woreda: { $regex: woredaRegex } }, { woreda: SUBCITY_EVENT_WOREDA }] }
      : { $or: [{ woreda: req.user.woreda }, { woreda: SUBCITY_EVENT_WOREDA }] };

    let registerableFilter = {
      ...woredaFilter,
      status: { $nin: ['Cancelled', 'Completed'] }
    };

    if (req.query.woreda && req.query.woreda !== 'all') {
      registerableFilter = applyEventWoredaFilter(
        { status: { $nin: ['Cancelled', 'Completed'] } },
        req.query.woreda
      );

      if (req.query.woreda !== SUBCITY_EVENT_WOREDA && req.query.woreda !== 'subcity') {
        registerableFilter = {
          $and: [woredaFilter, registerableFilter]
        };
      }
    }

    const events = await Event.find(registerableFilter)
      .populate('organizer', 'fullName email role')
      .sort('-createdAt');

    const data = events
      .filter((event) => validateRegistrationEligibility(req.user, event).allowed)
      .map((event) => serializeEventSummary(event, req.user.id));

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get events organized by current user
// @route   GET /api/events/organizer/me
// @access  Private (Woreda/Subcity Admin)
exports.getMyOrganizedEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ organizer: req.user.id })
      .populate('organizer', 'fullName email role')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: events.length,
      data: events.map((event) => serializeEventSummary(event, req.user?.id))
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get public events (read-only)
// @route   GET /api/events/public
// @access  Public
exports.getPublicEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    let baseFilter = { status: { $ne: 'Draft' }, isPublic: { $ne: false } };
    baseFilter = applyEventWoredaFilter(baseFilter, req.query.woreda);

    const total = await Event.countDocuments(baseFilter);

    const events = await Event.find(baseFilter)
      .select('title description date endDate location images woreda status createdAt attendees guestAttendees attendeeCount')
      .populate('organizer', 'fullName role')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);

    const pagination = {};
    if (startIndex + events.length < total) pagination.next = { page: page + 1, limit };
    if (startIndex > 0) pagination.prev = { page: page - 1, limit };

    res.status(200).json({
      success: true,
      count: events.length,
      pagination,
      data: events.map((event) => {
        const serialized = serializeEvent(event);
        delete serialized.attendees;
        delete serialized.guestAttendees;
        return serialized;
      })
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single public event (read-only)
// @route   GET /api/events/public/:id
// @access  Public
exports.getPublicEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .select('-attendees')
      .populate('organizer', 'fullName role');

    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    if (event.isPublic === false) {
      return next(new ErrorResponse('Event is not public', 403));
    }

    res.status(200).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
exports.getEvent = async (req, res, next) => {
  try {
    let eventQuery = Event.findById(req.params.id).populate('organizer', 'fullName email role');
    const event = await eventQuery;

    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    if (canViewEventRegistrations(req.user, event)) {
      await event.populate('attendees', 'fullName email phone');
    }

    res.status(200).json({
      success: true,
      data: serializeEventForUser(event, req.user)
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Woreda/Subcity Admin)
exports.createEvent = async (req, res, next) => {
  try {
    req.body.organizer = req.user.id;

    if (req.user.role === 'super_admin' && !req.body.woreda) {
      req.body.woreda = 'All Woredas';
    }

    if (!req.body.woreda && req.user.woreda) {
      req.body.woreda = req.user.woreda;
    }

    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map(file => toWebPath(file.path));
    }

    const event = await Event.create(req.body);

    const io = req.app.get('io');
    if (io) {
      let recipientQuery = {
        _id: { $ne: req.user.id },
        isActive: true
      };

      if (event.woreda && event.woreda !== 'All Woredas') {
        const woredaRegex = buildWoredaRegex(event.woreda);
        recipientQuery = {
          ...recipientQuery,
          $or: [
            woredaRegex ? { woreda: { $regex: woredaRegex } } : { woreda: event.woreda },
            { role: 'super_admin' }
          ]
        };
      }

      const recipients = await User.find(recipientQuery).select('_id');
      if (recipients.length > 0) {
        const notificationDocs = recipients.map((recipient) => ({
          recipient: recipient._id,
          actor: req.user.id,
          type: 'event_created',
          message: `New event published: ${event.title}`,
          metadata: {
            eventId: event._id,
            woreda: event.woreda
          }
        }));

        const createdNotifications = await Notification.insertMany(notificationDocs);

        createdNotifications.forEach((notification) => {
          io.to(`user-${notification.recipient.toString()}`).emit('notification', {
            id: notification._id,
            type: notification.type,
            message: notification.message,
            read: notification.read,
            createdAt: notification.createdAt,
            metadata: notification.metadata
          });
        });
      }
    }

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Woreda/Subcity Admin)
exports.updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    if (event.organizer.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to update this event', 403));
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => toWebPath(file.path));
      req.body.images = [...event.images, ...newImages];
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Woreda/Subcity Admin)
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    if (event.organizer.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to delete this event', 403));
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get events by woreda
// @route   GET /api/events/woreda/:woreda
// @access  Private
exports.getEventsByWoreda = async (req, res, next) => {
  try {
    const woredaRegex = buildWoredaRegex(req.params.woreda);
    const woredaFilter = woredaRegex
      ? { $or: [{ woreda: { $regex: woredaRegex } }, { woreda: SUBCITY_EVENT_WOREDA }] }
      : { $or: [{ woreda: req.params.woreda }, { woreda: SUBCITY_EVENT_WOREDA }] };

    const residentFilter = req.user?.role === 'resident'
      ? { status: 'Upcoming', date: { $gte: new Date() } }
      : {};
    const events = await Event.find({ ...woredaFilter, ...residentFilter })
      .populate('organizer', 'fullName email role')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: events.length,
      data: events.map((event) => serializeEventSummary(event, req.user?.id))
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get event registrations (organizer / admins)
// @route   GET /api/events/:id/registrations
// @access  Private (Organizer, Woreda/Subcity Admin)
exports.getEventRegistrations = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'fullName email role')
      .populate('attendees', 'fullName email phone')
      .populate('registrationTickets.user', 'fullName email phone role');

    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    if (!canViewEventRegistrations(req.user, event)) {
      return next(new ErrorResponse('Not authorized to view registrations for this event', 403));
    }

    res.status(200).json({
      success: true,
      data: {
        eventId: event._id,
        title: event.title,
        registrationCount: getRegistrationCount(event),
        attendees: event.attendees || [],
        guestAttendees: event.guestAttendees || [],
        registrationTickets: event.registrationTickets || []
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user's event entrance ticket
// @route   GET /api/events/:id/my-ticket
// @access  Private
exports.getMyEventTicket = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    const ticket = findUserTicket(event, req.user.id);

    if (!ticket) {
      return next(new ErrorResponse('No registration ticket found for this event', 404));
    }

    res.status(200).json({
      success: true,
      data: buildTicketPayload(
        event,
        {
          fullName: req.user.fullName,
          email: req.user.email,
          role: req.user.role,
          type: 'user'
        },
        ticket.entranceCode,
        ticket.registeredAt
      )
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Register for an event
// @route   POST /api/events/:id/register
// @access  Private
exports.registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'fullName email role');

    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    if (event.status === 'Cancelled' || event.status === 'Completed') {
      return next(new ErrorResponse('Event is not open for registration', 400));
    }

    const attendeeCount = countEventRegistrations(event);
    if (event.maxAttendees && attendeeCount >= event.maxAttendees) {
      return next(new ErrorResponse('Event has reached maximum capacity', 400));
    }

    let ticketPayload = null;

    if (req.user) {
      const eligibility = validateRegistrationEligibility(req.user, event);
      if (!eligibility.allowed) {
        return next(new ErrorResponse(eligibility.reason, 403));
      }

      if (isUserRegistered(event, req.user.id)) {
        return next(new ErrorResponse('You are already registered for this event', 400));
      }

      const entranceCode = generateUniqueEntranceCode(event);
      const registeredAt = new Date();

      event.attendees.push(req.user.id);
      event.registrationTickets = event.registrationTickets || [];
      event.registrationTickets.push({
        user: req.user.id,
        fullName: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone,
        type: 'user',
        entranceCode,
        registeredAt
      });

      ticketPayload = buildTicketPayload(
        event,
        {
          fullName: req.user.fullName,
          email: req.user.email,
          role: req.user.role,
          type: 'user'
        },
        entranceCode,
        registeredAt
      );
    } else {
      const fullName = String(req.body.fullName || '').trim();
      const email = String(req.body.email || '').trim().toLowerCase();
      const phone = String(req.body.phone || '').trim();

      if (!fullName || !email) {
        return next(new ErrorResponse('Full name and email are required for public registration', 400));
      }

      const alreadyRegistered =
        (event.guestAttendees || []).some((attendee) => attendee.email === email) ||
        Boolean(findGuestTicket(event, email));

      if (alreadyRegistered) {
        return next(new ErrorResponse('You are already registered for this event', 400));
      }

      const entranceCode = generateUniqueEntranceCode(event);
      const registeredAt = new Date();

      event.guestAttendees = event.guestAttendees || [];
      event.guestAttendees.push({ fullName, email, phone, registeredAt });
      event.registrationTickets = event.registrationTickets || [];
      event.registrationTickets.push({
        fullName,
        email,
        phone,
        type: 'guest',
        entranceCode,
        registeredAt
      });

      ticketPayload = buildTicketPayload(
        event,
        { fullName, email, role: 'guest', type: 'guest' },
        entranceCode,
        registeredAt
      );
    }

    event.attendeeCount = countEventRegistrations(event);

    await event.save();

    res.status(200).json({
      success: true,
      data: serializeEventSummary(event, req.user?.id),
      ticket: ticketPayload
    });
  } catch (err) {
    next(err);
  }
};
