import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Footer = ({ compact = false }) => {
  const { user } = useAuth();
  const year = new Date().getFullYear();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const getDashboardLink = () => {
    if (!user) return '/';

    switch (user.role) {
      case 'resident':
        return '/resident/dashboard';
      case 'officer':
        return '/officer/dashboard';
      case 'woreda_admin':
        return '/woreda-admin/dashboard';
      case 'super_admin':
        return '/subcity-admin/dashboard';
      default:
        return '/';
    }
  };

  const getEventsLink = () => {
    if (isHomePage) return '/#events-section';
    if (!user) return '/events';

    switch (user.role) {
      case 'resident':
        return '/resident/events';
      case 'officer':
        return '/officer/events';
      case 'woreda_admin':
        return '/woreda-admin/events';
      case 'super_admin':
        return '/subcity-admin/events';
      default:
        return '/events';
    }
  };

  const getAnnouncementsLink = () => {
    if (isHomePage) return '/#announcements-section';
    if (!user) return '/announcements';

    switch (user.role) {
      case 'officer':
        return '/officer/announcements';
      case 'woreda_admin':
        return '/woreda-admin/announcements';
      case 'super_admin':
        return '/subcity-admin/announcements';
      default:
        return '/announcements';
    }
  };


  return (
    <footer className="relative overflow-hidden border-t border-amber-900/35 bg-stone-900 text-amber-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(245,158,11,0.16),transparent_42%),radial-gradient(circle_at_88%_10%,rgba(251,191,36,0.12),transparent_36%)]" />

      <div className={`relative max-w-7xl mx-auto px-6 ${compact ? 'py-1' : 'py-10'}`}>
        {compact ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <img
                src={`${process.env.PUBLIC_URL}/south.jpg`}
                alt="Yegara logo"
                className="h-8 w-8 rounded-md bg-white object-contain p-0.5"
              />
              <p className="text-[10px] leading-tight font-semibold uppercase tracking-[0.08em] text-amber-100">
                MAREKO SPECIAL WOREDA &amp; CITIZEN SERVICE PLATFORM
              </p>
            </div>
            <p className="text-[10px] leading-tight text-amber-100/65">© {year} Mareko Special Woreda Administration. All rights reserved.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-3">
                  <img
                    src={`${process.env.PUBLIC_URL}/south.jpg`}
                    alt="Mareko Special Woreda"
                    className="h-10 w-10 rounded-md bg-white object-contain p-0.5"
                  />
                  <div>
                    <p className="text-lg font-semibold text-amber-50">Mareko Special Woreda</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Administration Platform</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-amber-100/75 max-w-sm">
                  Serving Koshe and the communities of Mareko through transparent, responsive, and participatory local governance.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">Explore</h4>
                <div className="mt-4 space-y-2 text-sm">
                  <Link to={getEventsLink()} className="block hover:text-amber-50 transition-colors">Events</Link>
                  <Link to={getAnnouncementsLink()} className="block hover:text-amber-50 transition-colors">Announcements</Link>
                  <Link to={getDashboardLink()} className="block hover:text-amber-50 transition-colors">Dashboard</Link>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">Account</h4>
                <div className="mt-4 space-y-2 text-sm">
                  {user ? (
                    <>
                      <Link to="/profile" className="block hover:text-amber-50 transition-colors">Profile</Link>
                      <Link to="/profile/edit" className="block hover:text-amber-50 transition-colors">Edit profile</Link>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="block hover:text-amber-50 transition-colors">Login</Link>
                      <Link to="/register" className="block hover:text-amber-50 transition-colors">Create account</Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 text-xs border-t border-amber-900/30 text-amber-100/65 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p>© {year} Mareko Special Woreda Administration. All rights reserved.</p>
              <p>Connecting residents, officers, and local administrators.</p>
            </div>
          </>
        )}
      </div>
    </footer>
  );
};

export default Footer;