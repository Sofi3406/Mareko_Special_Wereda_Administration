import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebarLayout } from '../../context/SidebarLayoutContext';
import { io } from 'socket.io-client';
import { API_BASE, notificationsAPI } from '../../services/api';
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  BellIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, logout } = useAuth();
  const sidebarLayout = useSidebarLayout();
  const navigate = useNavigate();
  const location = useLocation();
  const profileMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);
  const socketRef = useRef(null);
  const isHomePage = location.pathname === '/';

  const formatWoredaLabel = (woreda) => {
    if (!woreda) return 'Woreda';

    const normalized = String(woreda).replace(/_/g, ' ').trim();
    const woredaMatch = normalized.match(/woreda\s*0*(\d+)/i);

    if (woredaMatch) {
      return `Woreda ${woredaMatch[1]}`;
    }

    return normalized;
  };

  const getProfileRoleLabel = () => {
    if (!user) return '';

    if (user.role === 'super_admin') {
      return 'System Administrator';
    }

    if (user.role === 'woreda_admin') {
      return `${formatWoredaLabel(user.woreda)} Admin`;
    }

    if (user.role === 'officer') {
      const department = user.department === 'Other'
        ? (user.customDepartment || 'General')
        : (user.department || 'General');

      return `${department} Department Officer`;
    }

    if (user.role === 'resident') {
      return 'Resident';
    }

    return user.role;
  };

  const profileRoleLabel = getProfileRoleLabel();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    
    switch(user.role) {
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

  const getHomeLink = () => {
    if (user?.role === 'resident') {
      return '/resident/dashboard';
    }

    return '/';
  };

  const isAdminUser = user?.role === 'woreda_admin' || user?.role === 'super_admin';
  const isOfficerUser = user?.role === 'officer';

  const getEventsLink = () => {
    if (isHomePage) return '/#events-section';

    if (!user) return '/events';

    if (user.role === 'resident') {
      return '/resident/events';
    }

    if (user.role === 'officer') {
      return '/officer/events';
    }

    if (user.role === 'super_admin') {
      return '/subcity-admin/events';
    }

    if (user.role === 'woreda_admin') {
      return '/woreda-admin/events';
    }

    return '/events';
  };

  const getAnnouncementsLink = () => {
    if (isHomePage) return '/#announcements-section';

    if (!user) return '/announcements';

    if (user.role === 'resident') {
      return '/resident/announcements';
    }

    if (user.role === 'officer') {
      return '/officer/announcements';
    }

    if (user.role === 'woreda_admin') {
      return '/woreda-admin/announcements';
    }

    if (user.role === 'super_admin') {
      return '/subcity-admin/announcements';
    }

    return '/announcements';
  };

  const unreadCount = notifications.filter((item) => !item.read).length;

  const socketUrl = API_BASE.replace(/\/api\/?$/, '');

  useEffect(() => {
    if (!user?._id) return;

    const loadNotifications = async () => {
      try {
        const response = await notificationsAPI.getMine({ limit: 20 });
        const savedNotifications = (response.data?.data || []).map((item) => ({
          id: item._id,
          type: item.type,
          message: item.message,
          timestamp: item.createdAt,
          read: item.read
        }));

        setNotifications(savedNotifications);
      } catch (error) {
        // Keep navbar functional even if notification history fetch fails.
      }
    };

    loadNotifications();

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    socketRef.current = socket;
    socket.emit('join', user._id);

    socket.on('notification', (payload) => {
      const notification = {
        id: payload?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: payload?.type || 'update',
        message: payload?.message || 'You have a new notification.',
        timestamp: payload?.createdAt || new Date().toISOString(),
        read: Boolean(payload?.read)
      };

      setNotifications((prev) => {
        const deduped = prev.filter((item) => item.id !== notification.id);
        return [notification, ...deduped].slice(0, 20);
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id, socketUrl]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }

      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleNotifications = async () => {
    const opening = !isNotificationsOpen;
    setIsNotificationsOpen(opening);
    setIsProfileMenuOpen(false);

  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen((prev) => !prev);
    setIsNotificationsOpen(false);
  };

  return (
    <>
      {isHomePage && !user && (
        <div className="bg-amber-50 text-amber-900 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] sm:text-xs font-medium tracking-wide">
            <span>Central Ethiopia Regional State</span>
            <span className="hidden sm:inline opacity-60" aria-hidden="true">|</span>
            <span>Mareko Special Woreda · Koshe</span>
            <span className="hidden md:inline opacity-60" aria-hidden="true">|</span>
            <span className="hidden md:inline">Official public administration portal</span>
          </div>
        </div>
      )}
      <nav className={`bg-white ${isHomePage ? 'shadow-md border-b-4 border-amber-600' : 'shadow-lg'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img
                src={`${process.env.PUBLIC_URL}/south.jpg`}
                alt="Mareko Special Woreda emblem"
                className="h-14 w-14 object-contain rounded-md bg-white p-0.5 shadow-sm ring-1 ring-amber-200/80"
              />
              <span className="ml-2 leading-tight">
                <span className="block text-sm font-bold text-gray-900">Mareko Special Woreda</span>
                <span className="block text-xs text-amber-800/80 font-medium">
                  {isHomePage ? 'Woreda Administration · Koshe' : 'Administration Platform'}
                </span>
              </span>
            </Link>
            
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {!isAdminUser && (
                <Link
                  to={getHomeLink()}
                  className="text-gray-900 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Home
                </Link>
              )}
              
              {user && (
                <Link
                  to={getDashboardLink()}
                  className="text-gray-900 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
              )}
              
              {!isOfficerUser && (
                <button
                  type="button"
                  onClick={() => navigate(getEventsLink())}
                  className="text-gray-900 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Events
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate(getAnnouncementsLink())}
                className="text-gray-900 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Announcements
              </button>

              {/* Resources link removed from header */}
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <div className="relative" ref={notificationMenuRef}>
                  <button className="relative p-1" onClick={toggleNotifications}>
                    <BellIcon className="h-6 w-6 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-semibold">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 max-h-80 overflow-y-auto bg-white rounded-md shadow-lg py-2 z-50 border border-gray-200">
                      <div className="px-4 pb-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">Notifications</p>
                      </div>

                      {notifications.length === 0 ? (
                        <p className="px-4 py-4 text-sm text-gray-600">No new notifications.</p>
                      ) : (
                        notifications.map((item) => (
                          <div key={item.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50">
                            <p className="text-sm text-gray-800">{item.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="relative" ref={profileMenuRef}>
                  <button className="flex items-center space-x-2 text-left" onClick={toggleProfileMenu}>
                    <UserCircleIcon className="h-8 w-8 text-gray-600" />
                    <span className="leading-tight">
                      <span className="block text-sm font-medium text-gray-900">{user.fullName}</span>
                      <span className="block text-xs text-gray-500">{profileRoleLabel}</span>
                    </span>
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <Link
                      to="/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-900 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-amber-600 to-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:from-amber-500 hover:to-orange-600"
                >
                  Register
                </Link>
              </>
            )}
          </div>
          
          <div className="md:hidden flex items-center gap-1">
            {user && sidebarLayout && (
              <>
              <Link
                to="/profile"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                aria-label="Profile"
              >
                <UserCircleIcon className="h-6 w-6" />
              </Link>
              <button
                type="button"
                onClick={sidebarLayout.toggle}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                aria-expanded={sidebarLayout.isOpen}
                aria-label={sidebarLayout.isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                {sidebarLayout.isOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
              </>
            )}
            {!user && (
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                aria-expanded={isOpen}
                aria-label="Open menu"
              >
                {isOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu (guest / public only — signed-in users use sidebar drawer) */}
      {!user && isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user && (
              <div className="px-3 py-2 border-b border-gray-200 mb-2">
                <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{profileRoleLabel}</p>
              </div>
            )}

            {!isAdminUser && (
              <Link
                to={getHomeLink()}
                className="text-gray-900 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
              >
                Home
              </Link>
            )}
            
            {user && (
              <Link
                to={getDashboardLink()}
                className="text-gray-900 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
              >
                Dashboard
              </Link>
            )}
            
            {!isOfficerUser && (
              <button
                type="button"
                onClick={() => { setIsOpen(false); navigate(getEventsLink()); }}
                className="text-gray-900 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
              >
                Events
              </button>
            )}

            <button
              type="button"
              onClick={() => { setIsOpen(false); navigate(getAnnouncementsLink()); }}
              className="text-gray-900 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
            >
              Announcements
            </button>

            {/* Resources link removed from mobile menu */}
            
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="text-gray-900 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-900 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-900 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
    </>
  );
};

export default Navbar;