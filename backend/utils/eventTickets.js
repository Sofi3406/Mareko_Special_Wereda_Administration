const crypto = require('crypto');

const normalizeId = (value) => {
  if (value == null) return '';
  if (typeof value === 'object' && value._id != null) {
    return String(value._id);
  }
  return String(value);
};

const collectEntranceCodes = (event) => {
  const codes = new Set();

  (event?.registrationTickets || []).forEach((ticket) => {
    if (ticket?.entranceCode) {
      codes.add(ticket.entranceCode);
    }
  });

  return codes;
};

const generateEntranceCode = (eventId) => {
  const eventPart = String(eventId).slice(-4).toUpperCase().replace(/[^A-Z0-9]/g, 'X') || 'EVT';
  const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
  const numericPart = String(Math.floor(1000 + Math.random() * 9000));
  return `YEG-${eventPart}-${randomPart}${numericPart}`;
};

const generateUniqueEntranceCode = (event) => {
  const existing = collectEntranceCodes(event);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = generateEntranceCode(event._id);
    if (!existing.has(code)) {
      return code;
    }
  }

  return `YEG-${Date.now().toString(36).toUpperCase()}`;
};

const findUserTicket = (event, userId) => {
  if (!event?.registrationTickets?.length || !userId) return null;

  const normalizedUserId = normalizeId(userId);

  return event.registrationTickets.find(
    (ticket) => ticket.type === 'user' && normalizeId(ticket.user) === normalizedUserId
  ) || null;
};

const findGuestTicket = (event, email) => {
  if (!event?.registrationTickets?.length || !email) return null;

  const normalizedEmail = String(email).trim().toLowerCase();

  return event.registrationTickets.find(
    (ticket) => ticket.type === 'guest' && ticket.email === normalizedEmail
  ) || null;
};

const isUserRegistered = (event, userId) => {
  if (findUserTicket(event, userId)) return true;

  if (!event?.attendees?.length || !userId) return false;

  const normalizedUserId = normalizeId(userId);
  return event.attendees.some((attendee) => normalizeId(attendee) === normalizedUserId);
};

const buildTicketPayload = (event, attendee, entranceCode, registeredAt) => ({
  entranceCode,
  registeredAt: registeredAt || new Date(),
  eventId: event._id,
  eventTitle: event.title,
  eventDate: event.date,
  eventLocation: event.location,
  eventWoreda: event.woreda,
  attendeeName: attendee.fullName || 'Guest',
  attendeeEmail: attendee.email || '',
  attendeeRole: attendee.role || attendee.type || 'guest'
});

module.exports = {
  normalizeId,
  findUserTicket,
  findGuestTicket,
  isUserRegistered,
  generateUniqueEntranceCode,
  buildTicketPayload
};
