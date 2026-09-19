import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMediaUrl } from '../../utils/media';
import { PortalLoading, PortalEmpty } from './PortalPageShell';

const formatAnnouncementTime = (value) => {
  const date = new Date(value);
  return {
    day: date.toLocaleDateString(undefined, { day: '2-digit' }),
    month: date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
    full: date.toLocaleString()
  };
};

const truncate = (text, max = 140) => {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trim()}…`;
};

const AnnouncementImage = ({ src, alt, variant = 'featured' }) => {
  const [imageError, setImageError] = useState(false);
  const showPlaceholder = !src || imageError;

  if (showPlaceholder) {
    return (
      <div className={`portal-announce-media portal-announce-media--placeholder portal-announce-media--${variant}`}>
        <div className="portal-announce-media__frame">
          <span className="portal-announce-media__icon" aria-hidden>
            📢
          </span>
          <span className="portal-announce-media__placeholder-label">Community notice</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`portal-announce-media portal-announce-media--${variant}`}>
      <div className="portal-announce-media__frame">
        <img
          src={getMediaUrl(src)}
          alt={alt}
          className="portal-announce-media__img"
          loading="lazy"
          onError={() => setImageError(true)}
        />
        <div className="portal-announce-media__shine" aria-hidden />
      </div>
    </div>
  );
};

const DashboardAnnouncementsShowcase = ({
  announcements = [],
  loading = false,
  manageLink = '/woreda-admin/announcements',
  limit = 4
}) => {
  const items = useMemo(() => announcements.slice(0, limit), [announcements, limit]);

  const { featured, others } = useMemo(() => {
    if (items.length === 0) return { featured: null, others: [] };
    const withImage = items.find((item) => item.image);
    const lead = withImage || items[0];
    return {
      featured: lead,
      others: items.filter((item) => item._id !== lead._id)
    };
  }, [items]);

  if (loading) {
    return (
      <section className="portal-announce-showcase" aria-label="Announcements">
        <div className="portal-announce-showcase__head">
          <div>
            <p className="portal-announce-showcase__eyebrow">Community notices</p>
            <h2 className="portal-announce-showcase__title">Latest announcements</h2>
          </div>
        </div>
        <PortalLoading />
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="portal-announce-showcase" aria-label="Announcements">
        <div className="portal-announce-showcase__head">
          <div>
            <p className="portal-announce-showcase__eyebrow">Community notices</p>
            <h2 className="portal-announce-showcase__title">Latest announcements</h2>
            <p className="portal-announce-showcase__subtitle">
              Share official updates with residents and staff — add an image to make notices stand out.
            </p>
          </div>
          <Link to={manageLink} className="portal-announce-showcase__cta">
            Publish announcement
          </Link>
        </div>
        <PortalEmpty message="No announcements published yet. Create your first notice with a headline and image." />
      </section>
    );
  }

  const featuredTime = formatAnnouncementTime(featured.createdAt);

  return (
    <section className="portal-announce-showcase" aria-label="Announcements">
      <div className="portal-announce-showcase__head">
        <div>
          <p className="portal-announce-showcase__eyebrow">Community notices</p>
          <h2 className="portal-announce-showcase__title">Latest announcements</h2>
          <p className="portal-announce-showcase__subtitle">
            {announcements.length} published · showcase what residents see on the home page
          </p>
        </div>
        <Link to={manageLink} className="portal-announce-showcase__cta">
          Manage all
        </Link>
      </div>

      <article className="portal-announce-featured portal-announce-featured--split">
        <div className="portal-announce-featured__media-col">
          <AnnouncementImage src={featured.image} alt={featured.title} variant="featured" />
        </div>
        <div className="portal-announce-featured__content">
          <div className="portal-announce-featured__top">
            <div className="officer-date-badge">
              <span className="officer-date-badge__month">{featuredTime.month}</span>
              <span className="officer-date-badge__day">{featuredTime.day}</span>
            </div>
            <div className="portal-announce-featured__meta">
              <span className="portal-announce-featured__badge">Featured</span>
              <span className="officer-chip">{featured.category || 'General'}</span>
            </div>
          </div>
          <h3 className="portal-announce-featured__headline">{featured.title}</h3>
          <p className="portal-announce-featured__time">{featuredTime.full}</p>
          <p className="portal-announce-featured__message">{truncate(featured.message, 220)}</p>
          <Link to={manageLink} className="portal-announce-featured__link">
            View & publish announcements →
          </Link>
        </div>
      </article>

      {others.length > 0 && (
        <div className="portal-announce-thumb-grid" role="list">
          {others.map((item) => {
            const time = formatAnnouncementTime(item.createdAt);
            return (
              <article key={item._id} className="portal-announce-thumb" role="listitem">
                <AnnouncementImage src={item.image} alt={item.title} variant="thumb" />
                <div className="portal-announce-thumb__body">
                  <div className="portal-announce-thumb__date">
                    <span>{time.month}</span>
                    <strong>{time.day}</strong>
                  </div>
                  <h4 className="portal-announce-thumb__title">{item.title}</h4>
                  <p className="portal-announce-thumb__excerpt">{truncate(item.message, 72)}</p>
                  <span className="officer-chip officer-chip--muted">{item.category || 'General'}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default DashboardAnnouncementsShowcase;
