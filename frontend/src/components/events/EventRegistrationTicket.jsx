import React from 'react';
import '../../styles/officerPages.css';

const formatTicketDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const EventRegistrationTicket = ({ ticket, onClose, compact = false }) => {
  if (!ticket?.entranceCode) return null;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(ticket.entranceCode);
    } catch (error) {
      // Clipboard may be unavailable in some browsers.
    }
  };

  return (
    <div className={`event-ticket ${compact ? 'event-ticket--compact' : ''}`}>
      <div className="event-ticket__glow" aria-hidden />
      <div className="event-ticket__header">
        <div>
          <p className="event-ticket__eyebrow">Event entrance pass</p>
          <h3 className="event-ticket__title">{ticket.eventTitle}</h3>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="event-ticket__close">
            Close
          </button>
        )}
      </div>

      <div className="event-ticket__body">
        <div className="event-ticket__code-wrap">
          <p className="event-ticket__code-label">Entrance code</p>
          <p className="event-ticket__code">{ticket.entranceCode}</p>
          <button type="button" onClick={copyCode} className="event-ticket__copy">
            Copy code
          </button>
        </div>

        <div className="event-ticket__meta">
          <div>
            <p className="event-ticket__meta-label">Attendee</p>
            <p className="event-ticket__meta-value">{ticket.attendeeName}</p>
          </div>
          <div>
            <p className="event-ticket__meta-label">Event date</p>
            <p className="event-ticket__meta-value">{formatTicketDate(ticket.eventDate)}</p>
          </div>
          <div>
            <p className="event-ticket__meta-label">Location</p>
            <p className="event-ticket__meta-value">{ticket.eventLocation || '—'}</p>
          </div>
          <div>
            <p className="event-ticket__meta-label">Registered</p>
            <p className="event-ticket__meta-value">{formatTicketDate(ticket.registeredAt)}</p>
          </div>
        </div>
      </div>

      <p className="event-ticket__footer">
        Present this code at the event entrance for verification.
      </p>
    </div>
  );
};

export default EventRegistrationTicket;
