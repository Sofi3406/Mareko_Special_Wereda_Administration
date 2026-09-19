import React, { useEffect, useMemo, useState } from 'react';
import { eventsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { getMediaUrl } from '../../utils/media';
import EventRegistrationDetails from '../../components/events/EventRegistrationDetails';
import {
  canViewEventRegistrations,
  getRegistrationStatus,
  getSpotsLeft,
  isEventOwner
} from '../../utils/eventRegistrations';
import EventWoredaFilter from '../../components/events/EventWoredaFilter';
import {
  defaultEventWoredaFilterForUser,
  filterEventsByWoreda,
  formatEventWoredaLabel,
  EVENT_WOREA_FILTER_ALL
} from '../../utils/woredas';
import {
  PortalPage,
  PortalHero,
  PortalLoading,
  PortalEmpty,
  PortalFormPanel,
  PortalField,
  PortalPrimaryButton,
  PortalOutlineButton
} from '../../components/portal/PortalPageShell';

const ManageEvents = () => {
  const { user } = useAuth();
  const [allEvents, setAllEvents] = useState([]);
  const [woredaFilter, setWoredaFilter] = useState(EVENT_WOREA_FILTER_ALL);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventLoading, setSelectedEventLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    meetingLink: '',
    images: []
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await eventsAPI.getByWoreda(user?.woreda);
      setAllEvents(response.data.data || []);
    } catch (error) {
      toast.error('Unable to load events');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', date: '', location: '', description: '', meetingLink: '', images: [] });
    setEditing(null);
  };

  const buildEventFormData = (eventForm) => {
    const formData = new FormData();
    Object.entries(eventForm).forEach(([key, value]) => {
      if (key === 'images') return;
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });
    if (eventForm.images?.length > 0) {
      eventForm.images.forEach((file) => formData.append('images', file));
    }
    return formData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.location) {
      toast.error('Please complete all required fields');
      return;
    }

    try {
      const payload = buildEventFormData({ ...form, woreda: user?.woreda });
      if (editing) {
        await eventsAPI.update(editing, payload);
        toast.success('Event updated successfully');
      } else {
        await eventsAPI.create(payload);
        toast.success('Event added successfully');
      }
      resetForm();
      fetchEvents();
    } catch (error) {
      toast.error('Unable to save event');
    }
  };

  const handleEdit = (event) => {
    setEditing(event._id);
    setForm({
      title: event.title || '',
      date: event.date ? event.date.substring(0, 16) : '',
      location: event.location || '',
      description: event.description || '',
      meetingLink: event.meetingLink || '',
      images: []
    });
  };

  const handleViewRegistrations = async (eventId) => {
    setSelectedEventLoading(true);
    try {
      const eventResponse = await eventsAPI.getOne(eventId);
      const event = eventResponse.data?.data || null;
      if (!event) {
        setSelectedEvent(null);
        return;
      }
      try {
        const regResponse = await eventsAPI.getRegistrations(eventId);
        const registrations = regResponse.data?.data;
        setSelectedEvent({
          ...event,
          attendees: registrations?.attendees || [],
          guestAttendees: registrations?.guestAttendees || [],
          registrationTickets: registrations?.registrationTickets || []
        });
      } catch (regError) {
        if (regError.response?.status === 403) {
          setSelectedEvent(event);
        } else {
          throw regError;
        }
      }
    } catch (error) {
      toast.error('Unable to load registrations');
    } finally {
      setSelectedEventLoading(false);
    }
  };

  const handleSelectEvent = (eventId) => {
    handleViewRegistrations(eventId);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await eventsAPI.delete(id);
      toast.success('Event deleted successfully');
      if (selectedEvent?._id === id) setSelectedEvent(null);
      fetchEvents();
    } catch (error) {
      toast.error('Unable to delete event');
    }
  };

  useEffect(() => {
    setWoredaFilter(defaultEventWoredaFilterForUser(user));
  }, [user?.woreda]);

  useEffect(() => {
    fetchEvents();
  }, [user?.woreda]);

  const events = useMemo(
    () => filterEventsByWoreda(allEvents, woredaFilter),
    [allEvents, woredaFilter]
  );

  const woredaFilterOptions = user?.woreda ? [user.woreda] : undefined;

  const formatEventTime = (value) => {
    const date = new Date(value);
    return {
      day: date.toLocaleDateString(undefined, { day: '2-digit' }),
      month: date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
      full: date.toLocaleString()
    };
  };

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Community calendar"
        title="Manage events"
        description="Create, update, and publish community events. Click an event to view registrations."
      />

      <PortalFormPanel title={editing ? 'Edit event' : 'Create new event'} onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PortalField label="Title">
            <input
              className="input mt-0"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </PortalField>
          <PortalField label="Date & time">
            <input
              type="datetime-local"
              className="input mt-0"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </PortalField>
          <PortalField label="Location">
            <input
              className="input mt-0"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </PortalField>
          <PortalField label="Meeting link (optional)">
            <input
              className="input mt-0"
              value={form.meetingLink}
              onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
            />
          </PortalField>
          <div className="md:col-span-2">
            <PortalField label="Event images">
              <div className="officer-file-drop">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="w-full text-sm text-slate-700"
                  onChange={(e) => setForm({ ...form, images: Array.from(e.target.files || []) })}
                />
              </div>
              <p className="mt-1 text-xs text-amber-800">Attach up to 5 images.</p>
            </PortalField>
          </div>
          <div className="md:col-span-2">
            <PortalField label="Description">
              <textarea
                rows={3}
                className="input mt-0"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </PortalField>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <PortalPrimaryButton type="submit">
            {editing ? 'Update event' : 'Add event'}
          </PortalPrimaryButton>
          {editing && (
            <PortalOutlineButton type="button" onClick={resetForm}>
              Cancel
            </PortalOutlineButton>
          )}
        </div>
      </PortalFormPanel>

      <div className="officer-form-panel">
        <div className="grid grid-cols-1 gap-4 sm:max-w-xs">
          <EventWoredaFilter
            value={woredaFilter}
            onChange={(e) => setWoredaFilter(e.target.value)}
            disabled={loading}
            woredaOptions={woredaFilterOptions}
          />
        </div>
      </div>

      {loading ? (
        <PortalLoading />
      ) : events.length === 0 ? (
        <PortalEmpty
          message={
            allEvents.length > 0
              ? 'No events match the selected woreda filter.'
              : 'No events created yet.'
          }
        />
      ) : (
        <>
          {selectedEvent && (
            <EventRegistrationDetails
              event={selectedEvent}
              loading={selectedEventLoading}
              onClose={() => setSelectedEvent(null)}
            />
          )}

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800">
            {events.length} event{events.length === 1 ? '' : 's'}
          </p>

          <div className="space-y-5">
            {events.map((event) => (
              <article
                key={event._id}
                className={`officer-report-card ${selectedEvent?._id === event._id ? '!border-amber-400 ring-2 ring-amber-100' : ''}`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectEvent(event._id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectEvent(event._id);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="officer-event-date">
                        <span className="officer-event-date__month">{formatEventTime(event.date).month}</span>
                        <span className="officer-event-date__day">{formatEventTime(event.date).day}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                          {event.description || 'No description available.'}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 space-y-2 text-sm text-slate-600 md:text-right">
                      <p>{formatEventTime(event.date).full}</p>
                      <p className="font-semibold text-slate-800">{event.location}</p>
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <span className="officer-chip">{getRegistrationStatus(event).label}</span>
                        {getSpotsLeft(event) !== null && (
                          <span className="officer-chip officer-chip--muted">
                            {getSpotsLeft(event)} spot{getSpotsLeft(event) === 1 ? '' : 's'} left
                          </span>
                        )}
                        <span className="officer-chip officer-chip--muted">
                          {formatEventWoredaLabel(event.woreda || user?.woreda)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {(isEventOwner(event, user) || canViewEventRegistrations(event, user)) && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {isEventOwner(event, user) && (
                      <PortalOutlineButton type="button" onClick={() => handleEdit(event)}>
                        Edit
                      </PortalOutlineButton>
                    )}
                    {canViewEventRegistrations(event, user) && (
                      <PortalOutlineButton type="button" onClick={() => handleViewRegistrations(event._id)}>
                        View registrations
                      </PortalOutlineButton>
                    )}
                    {isEventOwner(event, user) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(event._id)}
                        className="officer-btn officer-btn--danger-outline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}

                {event.images?.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {event.images.slice(0, 3).map((image, index) => (
                      <a
                        key={`${event._id}-image-${index}`}
                        href={getMediaUrl(image)}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-xl border border-amber-100 bg-amber-50/50"
                      >
                        <img
                          src={getMediaUrl(image)}
                          alt={`Event ${index + 1}`}
                          className="h-28 w-full object-cover transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </PortalPage>
  );
};

export default ManageEvents;
