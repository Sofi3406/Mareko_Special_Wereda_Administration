/** Canonical woreda names for events and user registration */
export const MAREQO_WEREDA = 'Mareqo Wereda';
export const WOREDA_LIST = [MAREQO_WEREDA];

/** Sub-city-wide events (stored value in the database) */
export const SUBCITY_EVENT_WOREDA = 'All Woredas';

export const EVENT_WOREA_FILTER_ALL = 'all';

export const formatEventWoredaLabel = (woreda) => {
  if (!woreda || woreda === SUBCITY_EVENT_WOREDA) {
    return 'Sub city';
  }
  return woreda;
};

export const formatEventWoredaFilterLabel = (filterValue) => {
  if (!filterValue || filterValue === EVENT_WOREA_FILTER_ALL) {
    return 'All woredas';
  }
  return formatEventWoredaLabel(filterValue);
};

export const normalizeWoredaName = (value = '') =>
  String(value).trim().toLowerCase().replace(/\s+/g, '');

export const isSameWoredaName = (a, b) => normalizeWoredaName(a) === normalizeWoredaName(b);

export const matchesEventWoredaFilter = (event, filterValue) => {
  if (!filterValue || filterValue === EVENT_WOREA_FILTER_ALL) {
    return true;
  }

  const eventWoreda = event?.woreda || '';

  if (filterValue === SUBCITY_EVENT_WOREDA) {
    return eventWoreda === SUBCITY_EVENT_WOREDA;
  }

  return isSameWoredaName(eventWoreda, filterValue);
};

export const filterEventsByWoreda = (events, filterValue) =>
  (events || []).filter((event) => matchesEventWoredaFilter(event, filterValue));

export const buildEventWoredaQueryParams = (filterValue, extra = {}) => {
  const params = { ...extra };
  if (filterValue && filterValue !== EVENT_WOREA_FILTER_ALL) {
    params.woreda = filterValue;
  }
  return params;
};

export const defaultEventWoredaFilterForUser = (user) => {
  if (!user) return EVENT_WOREA_FILTER_ALL;
  if (user.role === 'super_admin') return EVENT_WOREA_FILTER_ALL;
  if (user.woreda && WOREDA_LIST.some((w) => isSameWoredaName(w, user.woreda))) {
    return user.woreda;
  }
  return EVENT_WOREA_FILTER_ALL;
};
