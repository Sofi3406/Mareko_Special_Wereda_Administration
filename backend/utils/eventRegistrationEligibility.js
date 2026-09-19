const { buildWoredaRegex, isSameWoreda } = require('./woreda');

const normalizeId = (value) => {
  if (value == null) return '';
  if (typeof value === 'object' && value._id != null) {
    return String(value._id);
  }
  return String(value);
};

const eventMatchesUserWoreda = (event, userWoreda) => {
  if (!userWoreda) return true;
  if (!event?.woreda || event.woreda === 'All Woredas') return true;

  const woredaRegex = buildWoredaRegex(userWoreda);
  if (woredaRegex) {
    return woredaRegex.test(event.woreda);
  }

  return isSameWoreda(event.woreda, userWoreda);
};

/**
 * Officers may register for events organized by woreda/subcity admins in their woreda.
 * Woreda admins may register for events organized by subcity admins in their woreda.
 */
const validateRegistrationEligibility = (user, event) => {
  if (!user || !event) {
    return { allowed: false, reason: 'Invalid registration request' };
  }

  const userId = normalizeId(user.id || user._id);
  const organizerId = normalizeId(event.organizer?._id || event.organizer);

  if (organizerId && userId && organizerId === userId) {
    return { allowed: false, reason: 'You cannot register for an event you organized' };
  }

  const organizerRole = event.organizer?.role;
  if (!organizerRole) {
    return { allowed: false, reason: 'Unable to verify event organizer' };
  }

  if (user.role === 'officer') {
    if (!['woreda_admin', 'super_admin'].includes(organizerRole)) {
      return {
        allowed: false,
        reason: 'Officers can only register for events organized by Woreda or Sub city administrators'
      };
    }

    if (!eventMatchesUserWoreda(event, user.woreda)) {
      return { allowed: false, reason: 'This event is outside your woreda' };
    }

    return { allowed: true };
  }

  if (user.role === 'woreda_admin') {
    if (organizerRole !== 'super_admin') {
      return {
        allowed: false,
        reason: 'Woreda administrators can only register for events organized by Sub city administrators'
      };
    }

    if (!eventMatchesUserWoreda(event, user.woreda)) {
      return { allowed: false, reason: 'This event is outside your woreda' };
    }

    return { allowed: true };
  }

  if (user.role === 'resident') {
    return { allowed: true };
  }

  return { allowed: false, reason: 'Your role cannot register for this event' };
};

module.exports = {
  normalizeId,
  eventMatchesUserWoreda,
  validateRegistrationEligibility
};
