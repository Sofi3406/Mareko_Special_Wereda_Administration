import React, { useEffect, useState } from 'react';
import { eventsAPI, publicAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { getMediaUrl } from '../../utils/media';
import {
  canRegisterForEvent,
  buildTicketFromEvent,
  getRegistrationBlockReason,
  getRegistrationStatus,
  getSpotsLeft,
  isUserRegisteredForEvent
} from '../../utils/eventRegistrations';
import EventRegistrationTicket from '../../components/events/EventRegistrationTicket';
import EventWoredaFilter from '../../components/events/EventWoredaFilter';
import {
  buildEventWoredaQueryParams,
  defaultEventWoredaFilterForUser,
  formatEventWoredaLabel
} from '../../utils/woredas';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [woredaFilter, setWoredaFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [guestForm, setGuestForm] = useState({ fullName: '', email: '', phone: '' });
  const [registering, setRegistering] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const { user } = useAuth();

  const usesRegisterableFeed = user?.role === 'officer' || user?.role === 'woreda_admin';

  const loadEvents = async (filterValue = woredaFilter) => {
    const queryParams = buildEventWoredaQueryParams(filterValue, { limit: 50, sort: '-createdAt' });

    if (!user) {
      const response = await publicAPI.getEvents(queryParams);
      return response.data.data || [];
    }
    if (usesRegisterableFeed) {
      const response = await eventsAPI.getRegisterable(queryParams);
      return response.data.data || [];
    }
    if (user.role === 'resident' && user.woreda && filterValue === 'all') {
      const response = await eventsAPI.getByWoreda(user.woreda);
      return response.data.data || [];
    }
    const response = await eventsAPI.getAll(queryParams);
    return response.data.data || [];
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      setEvents(await loadEvents());
    } catch (error) {
      toast.error('Unable to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    if (!user) {
      toast.error('Please enter your details to register');
      return;
    }

    try {
      const response = await eventsAPI.register(eventId);
      const ticket = response.data?.ticket || null;
      if (ticket) {
        setActiveTicket(ticket);
        toast.success('Registered! Your entrance pass is ready.');
      } else {
        toast.success('Registered for event');
      }
      const data = await loadEvents();
      setEvents(data);
      const updated = data.find((event) => event._id === eventId);
      if (updated) setSelected(updated);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to register');
    }
  };

  const loadTicketForSelected = async (event) => {
    if (!event?._id) return null;
    if (event.myEntranceCode) {
      return buildTicketFromEvent(event, user);
    }
    if (!user) return null;
    try {
      const response = await eventsAPI.getMyTicket(event._id);
      return response.data?.data || null;
    } catch (error) {
      return null;
    }
  };

  const handleShowPass = async () => {
    const ticket = buildTicketFromEvent(selected, user) || (await loadTicketForSelected(selected));
    if (ticket) {
      setActiveTicket(ticket);
    } else {
      toast.error('Entrance pass not found for this registration');
    }
  };

  useEffect(() => {
    setWoredaFilter(defaultEventWoredaFilterForUser(user));
  }, [user?.role, user?.woreda]);

  useEffect(() => {
    fetchEvents();
  }, [user?.role, woredaFilter]);

  useEffect(() => {
    if (!selected || !isUserRegisteredForEvent(selected, user) || !selected.myEntranceCode) {
      return;
    }
    setActiveTicket(buildTicketFromEvent(selected, user));
  }, [selected?._id, selected?.myEntranceCode, user?.fullName, user?.email]);

  const formatOrganizer = (organizer) => {
    if (!organizer) return 'Admin';

    const roleLabel = organizer.role === 'super_admin'
      ? 'Mareqo Wereda Super Admin'
      : organizer.role === 'woreda_admin'
        ? 'Woreda Admin'
        : organizer.role === 'officer'
          ? 'Officer'
          : 'Admin';

    return organizer.fullName ? `${roleLabel} / ${organizer.fullName}` : roleLabel;
  };

  const handleGuestRegister = async () => {
    if (!selected) return;

    if (!guestForm.fullName.trim() || !guestForm.email.trim()) {
      toast.error('Full name and email are required');
      return;
    }

    setRegistering(true);
    try {
      const response = await eventsAPI.register(selected._id, guestForm);
      const ticket = response.data?.ticket || null;
      if (ticket) {
        setActiveTicket(ticket);
        toast.success('Registered! Save your entrance code.');
      } else {
        toast.success('Registered for event');
      }
      setGuestForm({ fullName: '', email: '', phone: '' });
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to register');
    } finally {
      setRegistering(false);
    }
  };

  const formatEventTime = (value) => {
    const date = new Date(value);
    return {
      day: date.toLocaleDateString(undefined, { day: '2-digit' }),
      month: date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
      full: date.toLocaleString()
    };
  };

  const primaryEventImage = (event) => (event.images?.length > 0 ? getMediaUrl(event.images[0]) : '');

  const imageTileClass = 'relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm aspect-[4/3]';

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600"></div>
      </div>
    );
  }

  const selectedTime = selected ? formatEventTime(selected.date) : null;

  const selectedRegistered = selected ? isUserRegisteredForEvent(selected, user) : false;
  const selectedCanRegister = selected && user ? canRegisterForEvent(selected, user) : false;
  const selectedBlockReason = selected ? getRegistrationBlockReason(selected, user) : null;
  const selectedSpotsLeft = selected ? getSpotsLeft(selected) : null;
  const selectedFull = selectedSpotsLeft === 0;

  const pageSubtitle = usesRegisterableFeed
    ? user?.role === 'officer'
      ? 'Register for community events published by your Woreda or Mareqo Wereda administrators.'
      : 'Register for Mareqo Wereda administrator events that apply to your woreda.'
    : 'Explore meetings, gatherings, and civic activities in a cleaner layout built to make each event easy to scan.';

  const emptyMessage = usesRegisterableFeed
    ? user?.role === 'officer'
      ? 'No registrable events from Woreda or Mareqo Wereda administrators in your woreda yet.'
      : 'No registrable Mareqo Wereda administrator events for your woreda yet.'
    : 'When administrators publish new events, they will appear here with full details and registration options.';

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-950 via-amber-900 to-orange-800 px-6 py-8 text-white shadow-xl md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.26),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.20),transparent_30%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
              Community calendar
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Community events</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-amber-50/85 md:text-base">
              {pageSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:min-w-[300px] md:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-100/80">Available events</p>
              <p className="mt-1 text-2xl font-semibold">{events.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-100/80">Selection</p>
              <p className="mt-1 text-sm font-medium text-amber-100">{selected ? 'Event details open' : 'Pick an event to view'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm sm:max-w-xs">
        <EventWoredaFilter
          value={woredaFilter}
          onChange={(e) => setWoredaFilter(e.target.value)}
          disabled={loading}
        />
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">No upcoming events yet</p>
          <p className="mt-2 text-sm text-slate-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.45fr_0.95fr]">
          <div className="space-y-4">
            {events.map((event) => (
              <button
                key={event._id}
                className={`group relative w-full overflow-hidden rounded-3xl border p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${selected?._id === event._id ? 'border-amber-300 bg-amber-50 ring-2 ring-amber-200 shadow-amber-100' : 'border-slate-200 bg-white hover:border-amber-200'}`}
                onClick={() => setSelected(event)}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-300" />
                <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-amber-100/50 blur-3xl transition-opacity group-hover:opacity-80" />

                {primaryEventImage(event) && (
                  <div className="relative mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 aspect-[16/9] shadow-sm">
                    <img
                      src={primaryEventImage(event)}
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="shrink-0 rounded-2xl bg-amber-950 px-3 py-2 text-white shadow-md shadow-amber-950/20">
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100">{formatEventTime(event.date).month}</span>
                      <span className="block text-2xl font-semibold leading-none">{formatEventTime(event.date).day}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-slate-900">{event.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{formatEventTime(event.date).full}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      {formatEventWoredaLabel(event.woreda)}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getRegistrationStatus(event).className}`}>
                      {getRegistrationStatus(event).label}
                    </span>
                    {isUserRegisteredForEvent(event, user) && (
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        You are registered
                      </span>
                    )}
                    {getSpotsLeft(event) !== null && (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                        {getSpotsLeft(event)} spot{getSpotsLeft(event) === 1 ? '' : 's'} left
                      </span>
                    )}
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-600">{event.description?.slice(0, 140) || 'No description available.'}</p>
                <p className="mt-3 text-sm font-medium text-slate-700">{event.location}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Created by: {formatOrganizer(event.organizer)}
                </p>
              </button>
            ))}
          </div>

          <div className="h-fit rounded-3xl border border-amber-100 bg-white p-6 shadow-lg shadow-amber-50 lg:sticky lg:top-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Event details</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">{selected ? 'Selected event' : 'No event selected'}</h2>
              </div>
              {selected && selected.woreda && (
                <span className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  {selected.woreda}
                </span>
              )}
            </div>

            {selected ? (
              <div className="mt-5 space-y-5 text-sm text-slate-700">
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{selected.title}</p>
                  <p className="mt-1 text-slate-600">{selectedTime?.full}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    Scope: {formatEventWoredaLabel(selected.woreda)}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    Organizer: {formatOrganizer(selected.organizer)}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    {getRegistrationStatus(selected).label}
                  </span>
                  {getSpotsLeft(selected) !== null && (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {getSpotsLeft(selected)} spot{getSpotsLeft(selected) === 1 ? '' : 's'} left
                    </span>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Location</p>
                  <p className="mt-1 text-sm text-slate-800">{selected.location}</p>
                </div>

                {selected.meetingLink && (
                  <a
                    href={selected.meetingLink}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-amber-200 transition-transform hover:-translate-y-0.5 hover:from-amber-500 hover:to-orange-500"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Join online meeting
                  </a>
                )}

                {selected.images?.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Event images</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selected.images.map((image, index) => {
                        const imageUrl = getMediaUrl(image);

                        return (
                          <a
                            key={`${selected._id}-image-${index}`}
                            href={imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={imageTileClass}
                          >
                            <img
                              src={imageUrl}
                              alt={`Event image ${index + 1} for ${selected.title}`}
                              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-amber-950/10 via-transparent to-transparent" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="leading-relaxed text-slate-600">{selected.description || 'No description available.'}</p>

                {activeTicket?.eventId === selected._id && (
                  <EventRegistrationTicket
                    ticket={activeTicket}
                    onClose={() => setActiveTicket(null)}
                    compact
                  />
                )}

                {user ? (
                  <div className="space-y-2">
                    {selectedRegistered ? (
                      <>
                        <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-800">
                          You are registered for this event
                        </div>
                        {!activeTicket && (
                          <button
                            type="button"
                            onClick={handleShowPass}
                            className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                          >
                            View entrance pass
                          </button>
                        )}
                      </>
                    ) : selectedFull ? (
                      <div className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-800">
                        This event is full
                      </div>
                    ) : selectedCanRegister ? (
                      <button
                        type="button"
                        onClick={() => handleRegister(selected._id)}
                        className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-amber-200 transition-transform hover:-translate-y-0.5 hover:from-amber-500 hover:to-orange-500"
                      >
                        Register for event
                      </button>
                    ) : (
                      <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
                        {selectedBlockReason || 'Registration is not available for this event'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                    <p className="text-sm font-semibold text-slate-900">Register without login</p>
                    <input
                      className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                      placeholder="Full name"
                      value={guestForm.fullName}
                      onChange={(e) => setGuestForm({ ...guestForm, fullName: e.target.value })}
                    />
                    <input
                      className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                      placeholder="Email address"
                      type="email"
                      value={guestForm.email}
                      onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                    />
                    <input
                      className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                      placeholder="Phone number (optional)"
                      value={guestForm.phone}
                      onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                    />
                    <button
                      onClick={handleGuestRegister}
                      disabled={registering}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-amber-200 transition-transform hover:-translate-y-0.5 hover:from-amber-500 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {registering ? 'Registering...' : 'Register'}
                    </button>
                    {activeTicket?.eventId === selected._id && (
                      <EventRegistrationTicket ticket={activeTicket} compact />
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-5 text-slate-600">
                <p className="text-sm font-semibold text-slate-900">Select an event to view details.</p>
                <p className="mt-2 text-sm leading-6">Tap any event on the left to see the description, location, images, and registration options here.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
