import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/officerPages.css';

export const OfficerPage = ({ children, className = '' }) => (
  <div className={`officer-page space-y-8 ${className}`.trim()}>{children}</div>
);

export const OfficerHero = ({ eyebrow, title, description, actions }) => (
  <header className="officer-hero">
    <div className="officer-hero__inner">
      <div>
        {eyebrow && <p className="officer-hero__eyebrow">{eyebrow}</p>}
        <h1 className="officer-hero__title">{title}</h1>
        {description && <p className="officer-hero__desc">{description}</p>}
      </div>
      {actions && <div className="officer-hero__actions">{actions}</div>}
    </div>
  </header>
);

export const OfficerStatGrid = ({ stats, columns = 4 }) => (
  <div className={`officer-stat-grid ${columns === 4 ? 'officer-stat-grid--4' : ''}`}>
    {stats.map((stat) => (
      <div key={stat.label} className="officer-stat-card">
        <p className="officer-stat-card__label">{stat.label}</p>
        <p className="officer-stat-card__value">{stat.value}</p>
        {stat.percent != null && (
          <div className="officer-stat-card__bar">
            <div className="officer-stat-card__bar-fill" style={{ width: `${stat.percent}%` }} />
          </div>
        )}
      </div>
    ))}
  </div>
);

export const OfficerPanel = ({ title, linkTo, linkLabel = 'View all', headExtra, children }) => (
  <section className="officer-panel">
    {title && (
      <div className="officer-panel__head">
        <h2 className="officer-panel__title">{title}</h2>
        <div className="flex items-center gap-3">
          {headExtra}
          {linkTo && (
            <Link to={linkTo} className="officer-panel__link">
              {linkLabel}
            </Link>
          )}
        </div>
      </div>
    )}
    <div className="officer-panel__body">{children}</div>
  </section>
);

export const OfficerLoading = () => (
  <div className="officer-loading">
    <div className="officer-loading__spinner" role="status" aria-label="Loading" />
  </div>
);

export const OfficerEmpty = ({ message }) => (
  <div className="officer-empty">{message}</div>
);

export const OfficerFormPanel = ({ title, children, onSubmit, className = '' }) => {
  const Tag = onSubmit ? 'form' : 'div';
  return (
    <Tag onSubmit={onSubmit} className={`officer-form-panel space-y-4 ${className}`.trim()}>
      {title && <h2 className="officer-form-panel__title">{title}</h2>}
      {children}
    </Tag>
  );
};

export const OfficerField = ({ label, children, error }) => (
  <div className="officer-field">
    {label && <label>{label}</label>}
    {children}
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

export const statusToClass = (status) => {
  switch (status) {
    case 'Pending':
      return 'officer-status officer-status--pending';
    case 'In Progress':
      return 'officer-status officer-status--progress';
    case 'Resolved':
      return 'officer-status officer-status--resolved';
    case 'Rejected':
      return 'officer-status officer-status--rejected';
    default:
      return 'officer-status officer-status--muted';
  }
};

export const OfficerPrimaryButton = ({ type = 'button', disabled, className = '', children, ...props }) => (
  <button
    type={type}
    disabled={disabled}
    className={`officer-btn officer-btn--primary w-full sm:w-auto ${className}`.trim()}
    {...props}
  >
    {children}
  </button>
);

export const OfficerOutlineButton = ({ type = 'button', className = '', children, ...props }) => (
  <button type={type} className={`officer-btn officer-btn--outline ${className}`.trim()} {...props}>
    {children}
  </button>
);

export const OfficerHeroLink = ({ to, variant = 'primary', children }) => (
  <Link
    to={to}
    className={`officer-btn ${variant === 'ghost' ? 'officer-btn--ghost' : 'officer-btn--primary'}`}
  >
    {children}
  </Link>
);

export const OfficerQuickLink = ({ to, icon, children }) => (
  <Link to={to} className="officer-quick-link">
    <span className="officer-quick-link__icon" aria-hidden="true">
      {icon}
    </span>
    {children}
  </Link>
);
