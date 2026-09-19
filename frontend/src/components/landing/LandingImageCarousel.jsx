import React, { useState } from 'react';

const DESC_COLLAPSE_CHARS = 280;

const SlideDescription = ({ text, theme, slideId }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > DESC_COLLAPSE_CHARS;
  const showToggle = isLong && !expanded;

  return (
    <div className="landing-slide__desc-wrap">
      <p
        id={`slide-desc-${slideId}`}
        className={`landing-slide__desc ${showToggle ? 'is-collapsed' : ''}`}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          className={`landing-slide__read-more landing-slide__read-more--${theme}`}
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls={`slide-desc-${slideId}`}
        >
          {expanded ? 'Show less' : 'Read full message'}
        </button>
      )}
    </div>
  );
};

const LandingSlideCard = ({
  item,
  index,
  copyIndex,
  carouselId,
  theme,
  badgeLabel,
  getImageSrc,
  getTitle,
  getDescription,
  getDateLabel,
  getHref,
  getSubtitle,
  totalCount
}) => {
  const imageSrc = getImageSrc(item);
  const description = getDescription(item);
  const subtitle = getSubtitle?.(item);
  const slideId = `${carouselId}-${copyIndex}-${item._id || index}`;
  const typeChip = theme === 'events' ? 'Event' : 'Announcement';
  const displayIndex = (index % totalCount) + 1;

  return (
    <article id={slideId} className="landing-slide">
      <div className="landing-slide__card">
        <div className="landing-slide__visual">
          {imageSrc ? (
            <>
              <img
                src={imageSrc}
                alt=""
                className="landing-slide__media"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="landing-slide__visual-shade" aria-hidden="true" />
            </>
          ) : (
            <div className="landing-slide__placeholder">
              <span className="landing-slide__placeholder-icon" aria-hidden="true">
                {theme === 'events' ? '📅' : '📢'}
              </span>
            </div>
          )}

          <div className="landing-slide__badge">
            <span className="landing-slide__badge-dot" aria-hidden="true" />
            {badgeLabel}
          </div>

          <div className="landing-slide__index" aria-hidden="true">
            {displayIndex} / {totalCount}
          </div>
        </div>

        <div className="landing-slide__body">
          <div className="landing-slide__body-inner">
            <div className="landing-slide__meta">
              <span className="landing-slide__chip">{typeChip}</span>
              {getDateLabel(item) && (
                <span className="landing-slide__chip landing-slide__chip--muted">
                  {getDateLabel(item)}
                </span>
              )}
            </div>

            <a href={getHref(item)} className="landing-slide__title">
              {getTitle(item)}
            </a>

            {subtitle && <p className="landing-slide__subtitle">{subtitle}</p>}

            {description && (
              <SlideDescription text={description} theme={theme} slideId={slideId} />
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

const LandingImageCarousel = ({
  items,
  theme = 'events',
  carouselId = 'carousel',
  emptyMessage = 'Nothing to show yet',
  getImageSrc,
  getTitle,
  getDescription,
  getDateLabel,
  getHref,
  getSubtitle,
  badgeLabel
}) => {
  if (items.length === 0) {
    return <div className="landing-empty">{emptyMessage}</div>;
  }

  const trackClass = theme === 'events' ? 'animate-slide-events' : 'animate-slide-announcements';
  const regionLabel = theme === 'events' ? 'Events showcase' : 'Announcements showcase';
  const loopItems = [...items, ...items];

  return (
    <div className={`landing-showcase landing-showcase--${theme}`}>
      <div className="landing-showcase__glow" aria-hidden="true" />

      <div
        className="landing-marquee hide-scrollbar"
        role="region"
        aria-label={regionLabel}
      >
        <div className={`landing-marquee__track ${trackClass}`}>
          {loopItems.map((item, index) => (
            <LandingSlideCard
              key={`${carouselId}-${index}-${item._id || index}`}
              item={item}
              index={index}
              copyIndex={index < items.length ? 0 : 1}
              carouselId={carouselId}
              theme={theme}
              badgeLabel={badgeLabel}
              getImageSrc={getImageSrc}
              getTitle={getTitle}
              getDescription={getDescription}
              getDateLabel={getDateLabel}
              getHref={getHref}
              getSubtitle={getSubtitle}
              totalCount={items.length}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingImageCarousel;
