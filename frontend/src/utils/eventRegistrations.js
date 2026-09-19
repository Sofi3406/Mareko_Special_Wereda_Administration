export const normalizeId = (value) => {
  if (value == null) return '';

  if (typeof value === 'object') {
    return String(value._id || value.id || '');
  }

  return String(value);
};

export const getCurrentUserId = (user) => normalizeId(user);

export const getOrganizerId = (event) => normalizeId(event?.organizer);

export const isEventOwner = (event, user) => {
  const organizerId = getOrganizerId(event);
  const userId = getCurrentUserId(user);

  return Boolean(organizerId && userId && organizerId === userId);
};

export const isEventsAdmin = (user) =>
  ['woreda_admin', 'super_admin'].includes(user?.role);

export const canViewEventRegistrations = (event, user) =>
  isEventOwner(event, user) || isEventsAdmin(user);

const HIGHER_ORGANIZER_ROLES = {
  officer: ['woreda_admin', 'super_admin'],
  woreda_admin: ['super_admin']
};

export const canRegisterForEvent = (event, user) => {
  if (!event || !user) return false;
  if (isEventOwner(event, user)) return false;

  if (user.role === 'resident') return true;

  const organizerRole = event.organizer?.role;
  const allowedOrganizers = HIGHER_ORGANIZER_ROLES[user.role];

  if (!allowedOrganizers) return false;

  return allowedOrganizers.includes(organizerRole);
};

export const isUserRegisteredForEvent = (event, user) => {
  if (!event) return false;
  if (typeof event.isRegistered === 'boolean') return event.isRegistered;
  if (event.myEntranceCode) return true;

  const userId = getCurrentUserId(user);
  if (!userId || !Array.isArray(event.attendees)) return false;

  return event.attendees.some((attendee) => normalizeId(attendee) === userId);
};

export const buildTicketFromEvent = (event, user) => {
  if (!event?.myEntranceCode) return null;

  return {
    entranceCode: event.myEntranceCode,
    eventId: event._id,
    eventTitle: event.title,
    eventDate: event.date,
    eventLocation: event.location,
    eventWoreda: event.woreda,
    attendeeName: user?.fullName || 'Guest',
    attendeeEmail: user?.email || '',
    attendeeRole: user?.role || 'guest',
    registeredAt: event.myRegisteredAt || new Date().toISOString()
  };
};

export const getRegistrationBlockReason = (event, user) => {
  if (!event || !user) return null;
  if (isEventOwner(event, user)) return 'You organized this event';
  if (isUserRegisteredForEvent(event, user)) return null;

  if (user.role === 'officer' && !canRegisterForEvent(event, user)) {
    return 'Officers can register only for Woreda or Mareqo Wereda admin events';
  }

  if (user.role === 'woreda_admin' && !canRegisterForEvent(event, user)) {
    return 'Woreda admins can register only for Mareqo Wereda admin events';
  }

  return null;
};

export const countFromRegistrationArrays = (event) => {
  if (!event) return 0;

  const attendees = Array.isArray(event.attendees) ? event.attendees.length : 0;
  const guests = Array.isArray(event.guestAttendees) ? event.guestAttendees.length : 0;

  return attendees + guests;
};

export const getRegistrationCount = (event) => {
  if (!event) return 0;

  const fromArrays = countFromRegistrationArrays(event);

  return Math.max(
    fromArrays,
    Number(event.registrationCount) || 0,
    Number(event.attendeeCount) || 0
  );
};

export const getRegistrationStatus = (event) => {
  const count = getRegistrationCount(event);
  const max = event?.maxAttendees;

  if (!max) {
    return {
      label: `Registered: ${count}`,
      className: 'bg-amber-50 text-amber-700 border-amber-100'
    };
  }

  const ratio = count / max;

  if (count >= max) {
    return {
      label: `Full: ${count}/${max}`,
      className: 'bg-red-50 text-red-700 border-red-200'
    };
  }

  if (ratio >= 0.8) {
    return {
      label: `Almost full: ${count}/${max}`,
      className: 'bg-amber-50 text-amber-800 border-amber-200'
    };
  }

  return {
    label: `Registered: ${count}/${max}`,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };
};

export const getSpotsLeft = (event) => {
  const max = event?.maxAttendees;

  if (!max) return null;

  return Math.max(max - getRegistrationCount(event), 0);
};
