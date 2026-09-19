import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../../components/Layout/Navbar';
import Footer from '../../components/Layout/Footer';
import LandingImageCarousel from '../../components/landing/LandingImageCarousel';
import { publicAPI } from '../../services/api';
import { getMediaUrl } from '../../utils/media';
import {
  formatEventWoredaLabel
} from '../../utils/woredas';
import {
  BuildingOffice2Icon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import './Home.css';

const publicAsset = (file) => `${process.env.PUBLIC_URL}/${file}`;

const Home = () => {
  const [snapshot, setSnapshot] = useState({
    openRequests: 0,
    resolvedThisWeek: 0,
    upcomingEvents: 0,
    activeServices: 0,
    updatedAt: null
  });
  const [loadingSnapshot, setLoadingSnapshot] = useState(true);
  const [allEvents, setAllEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const location = useLocation();

  const formatEventDate = (event) => {
    const value = event?.date || event?.startDate;
    if (!value) return '';
    return new Date(value).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatAnnouncementDate = (item) => {
    if (!item?.createdAt) return '';
    return new Date(item.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (!location.hash) return undefined;

    const sectionId = location.hash.replace('#', '');
    const animationFrameId = window.requestAnimationFrame(() => {
      scrollToSection(sectionId);
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [location.hash]);

  useEffect(() => {
    if (!showAllEvents) return undefined;

    const animationFrameId = window.requestAnimationFrame(() => {
      scrollToSection('events-section');
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [showAllEvents]);

  useEffect(() => {
    if (!showAllAnnouncements) return undefined;

    const animationFrameId = window.requestAnimationFrame(() => {
      scrollToSection('announcements-section');
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [showAllAnnouncements]);

  useEffect(() => {
    let isMounted = true;

    const fetchSnapshot = async () => {
      setLoadingSnapshot(true);
      try {
        const response = await publicAPI.getLandingStats();
        if (!isMounted) return;

        const data = response.data?.data || {};
        setSnapshot({
          openRequests: Number(data.openRequests ?? data.openReports ?? 0),
          resolvedThisWeek: Number(data.resolvedThisWeek || 0),
          upcomingEvents: Number(data.upcomingEvents || 0),
          activeServices: Number(data.activeServices ?? data.activeResources ?? 0),
          updatedAt: data.updatedAt || null
        });
      } catch (error) {
        if (isMounted) {
          setSnapshot((prev) => ({ ...prev, updatedAt: null }));
        }
      } finally {
        if (isMounted) {
          setLoadingSnapshot(false);
        }
      }
    };

    fetchSnapshot();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCommunity = async () => {
      setLoadingCommunity(true);
      try {

        const [evRes, anRes, serviceRes] = await Promise.all([
          publicAPI.getEvents({ limit: 50 }),
          publicAPI.getAnnouncements({ limit: 50 }),
          publicAPI.getServices({ limit: 6, sort: 'name' })
        ]);

        if (!isMounted) return;

        setAllEvents(evRes.data?.data || []);
        setAnnouncements(anRes.data?.data || []);
        setServices(serviceRes.data?.data || []);
      } catch (err) {
        if (isMounted) {
          setAllEvents([]);
          setAnnouncements([]);
          setServices([]);
        }
      } finally {
        if (isMounted) setLoadingCommunity(false);
      }
    };

    fetchCommunity();

    return () => {
      isMounted = false;
    };
  }, []);

  const events = useMemo(() => allEvents, [allEvents]);

  const stats = useMemo(
    () => [
      { label: 'Open service requests', value: snapshot.openRequests },
      { label: 'Resolved this week', value: snapshot.resolvedThisWeek },
      { label: 'Upcoming events', value: snapshot.upcomingEvents },
      { label: 'Active services', value: snapshot.activeServices }
    ],
    [snapshot]
  );

  const formatNumber = (value) => new Intl.NumberFormat().format(value || 0);

  return (
    <div className="min-h-screen bg-[#ececec]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-8">
        <section className="landing-hero rise-in" aria-label="Mareko Special Woreda Administration">
          <div className="landing-hero__stripe">
            <span>Central Ethiopia Regional State</span>
            <span aria-hidden="true">·</span>
            <span>Mareko Special Woreda</span>
            <span aria-hidden="true">·</span>
            <span>Official Citizen Portal</span>
          </div>

          <div className="landing-hero__body">
            <div className="landing-hero__grid">
              <div className="text-center lg:text-left">
                <p className="landing-hero__eyebrow">
                  <ShieldCheckIcon className="h-4 w-4 text-amber-700" aria-hidden="true" />
                  Local government · Public service
                </p>
                <h1 className="landing-hero__title">Mareko Special Woreda Administration</h1>
                <p className="landing-hero__subtitle">Administrative center: Koshe · Mareko Wereda</p>
                <p className="landing-hero__lead mx-auto lg:mx-0">
                  Transparent, responsive, and participatory governance for residents of Mareko. Use this portal to
                  access woreda services, follow official announcements, report community issues, and stay informed
                  about local events and meetings.
                </p>

                <ul className="landing-hero__meta">
                  <li className="landing-hero__meta-item">
                    <MapPinIcon className="landing-hero__meta-icon" aria-hidden="true" />
                    <div>
                      <strong>Woreda seat</strong>
                      Koshe — Mareko Special Woreda, Central Ethiopia Regional State
                    </div>
                  </li>
                  <li className="landing-hero__meta-item">
                    <BuildingOffice2Icon className="landing-hero__meta-icon" aria-hidden="true" />
                    <div>
                      <strong>Office services</strong>
                      Citizen requests, community reports, kebele coordination, and public information
                    </div>
                  </li>
                  <li className="landing-hero__meta-item">
                    <PhoneIcon className="landing-hero__meta-icon" aria-hidden="true" />
                    <div>
                      <strong>Public contact</strong>
                      Abdul Hamid · +251921426433 · hamidawel06@gmail.com
                    </div>
                  </li>
                  <li className="landing-hero__meta-item">
                    <ShieldCheckIcon className="landing-hero__meta-icon" aria-hidden="true" />
                    <div>
                      <strong>Our commitment</strong>
                      Serving Koshe and Mareko communities with accountable local administration
                    </div>
                  </li>
                </ul>

                <div className="landing-hero__actions">
                  <Link
                    to="/register"
                    className="px-6 py-2.5 rounded-full text-white font-semibold bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600"
                  >
                    Open citizen account
                  </Link>
                  <Link
                    to="/services"
                    className="px-6 py-2.5 rounded-full text-slate-800 font-semibold bg-white border border-amber-200 hover:bg-amber-100/80"
                  >
                    Browse woreda services
                  </Link>
                  <Link
                    to="/#mareko-section"
                    className="px-6 py-2.5 rounded-full text-amber-900 font-semibold border border-amber-300 bg-white hover:bg-amber-100/60"
                  >
                    About Mareko Wereda
                  </Link>
                </div>
              </div>

              <aside className="landing-hero__panel rise-in rise-in-delay">
                <div className="landing-hero__panel-head">
                  <img
                    src={publicAsset('south.jpg')}
                    alt=""
                    className="landing-hero__panel-logo"
                  />
                  <div>
                    <p className="landing-hero__panel-tag">Woreda emblem</p>
                    <p className="landing-hero__panel-title">Mareko Special Woreda Administration Platform</p>
                  </div>
                </div>
                <div className="landing-hero__panel-photo">
                  <img src={publicAsset('Mareko.jpg')} alt="Mareko Special Woreda landscape and community" />
                </div>
                <div className="landing-hero__panel-foot">
                  <div className="landing-hero__panel-stat">
                    <span>Region</span>
                    <strong>Central Ethiopia</strong>
                  </div>
                  <div className="landing-hero__panel-stat">
                    <span>Center</span>
                    <strong>Koshe</strong>
                  </div>
                  <div className="landing-hero__panel-stat">
                    <span>Portal</span>
                    <strong>24/7 online</strong>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          <div className="landing-hero__footer-bar">
            <p>
              Digital front door for Mareko Wereda — report issues, track requests, and read official updates.
            </p>
            <Link to="/login">Staff &amp; resident sign in →</Link>
          </div>
        </section>

        <section id="mareko-section" className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr] scroll-mt-24">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 md:p-8 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">About the woreda</p>
            <h2 className="mt-3 text-3xl font-display text-slate-900">A digital front door for Mareko</h2>
            <p className="mt-4 leading-7 text-slate-700">
              Mareko Special Woreda is a local administration in the Central Ethiopia Regional State, named after the Mareko people. Its administrative center is Koshe.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white p-4"><p className="text-xs uppercase tracking-wider text-slate-500">2007 population</p><p className="mt-1 text-2xl font-semibold text-slate-900">64,512</p></div>
              <div className="rounded-lg bg-white p-4"><p className="text-xs uppercase tracking-wider text-slate-500">Administrative center</p><p className="mt-1 text-2xl font-semibold text-slate-900">Koshe</p></div>
            </div>
            <p className="mt-5 text-sm text-slate-600">Serving residents through transparent information, accessible services, and responsive local government.</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <iframe
              title="Mareko Special Woreda map"
              src="https://www.google.com/maps?q=Koshe,+Mareko,+Ethiopia&output=embed"
              className="h-80 w-full border-0 md:h-full md:min-h-[20rem]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>

        <section id="services-section" className="rounded-xl border border-slate-200 bg-white p-6 md:p-8 scroll-mt-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">Resident services</p>
              <h2 className="mt-2 text-3xl font-display text-slate-900">Services available in Mareko</h2>
              <p className="mt-2 max-w-2xl text-slate-600">Browse public services and start a request from anywhere.</p>
            </div>
            <Link to="/services" className="font-semibold text-amber-700 hover:text-amber-800">Browse all services →</Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.length === 0 ? (
              <p className="text-sm text-slate-500">Services will appear here as departments publish them.</p>
            ) : services.slice(0, 6).map((service) => (
              <article key={service._id} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">{service.department?.name || 'Woreda service'}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{service.name}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{service.description || 'Information and support from the Mareko administration.'}</p>
                <Link to={`/services/${service._id}`} className="mt-4 inline-block text-sm font-semibold text-amber-700 hover:text-amber-800">View service →</Link>
              </article>
            ))}
          </div>
        </section>

        <section
          id="events-section"
          className="landing-community-section relative p-6 md:p-8 scroll-mt-24"
        >
          <div className="relative z-10 text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-cyan-700">Community pulse</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-display text-slate-900">Latest from the community</h2>
            <p className="text-slate-600 mt-2 max-w-lg mx-auto">
              Discover upcoming gatherings and official notices in a rich, sliding showcase.
            </p>
          </div>

          <div className="relative z-10 space-y-10">
            <div className="landing-block landing-block--events">
              <header className="landing-section-head">
                <div className="landing-section-head__text">
                  <p className="landing-section-head__eyebrow landing-section-head__eyebrow--events">Live schedule</p>
                  <h3 className="landing-section-head__title">Upcoming events</h3>
                </div>
                {!loadingCommunity && events.length > 0 && (
                  <span className="landing-section-head__count">{events.length}</span>
                )}
              </header>

              <p className="mb-4 text-sm text-slate-500">Upcoming public events across Mareko Special Woreda.</p>

              {loadingCommunity ? (
                <div className="landing-empty animate-pulse">Loading events…</div>
              ) : (
                <LandingImageCarousel
                  carouselId="home-events"
                  items={events}
                  theme="events"
                  emptyMessage="No upcoming events yet. Check back soon for community gatherings."
                  badgeLabel="Featured event"
                  getImageSrc={(ev) => (ev.images?.[0] ? getMediaUrl(ev.images[0]) : null)}
                  getTitle={(ev) => ev.title}
                  getDescription={(ev) => ev.description?.trim() || ''}
                  getSubtitle={(ev) => {
                    const parts = [ev.location, ev.woreda ? formatEventWoredaLabel(ev.woreda) : null].filter(Boolean);
                    return parts.length ? parts.join(' · ') : null;
                  }}
                  getDateLabel={formatEventDate}
                  getHref={() => '#events-section'}
                />
              )}

              <div className="landing-block__actions">
                <button
                  type="button"
                  onClick={() => setShowAllEvents((prev) => !prev)}
                  className="landing-view-all landing-view-all--events"
                >
                  {showAllEvents ? 'Show less events' : 'View all events'}
                  <span className="landing-view-all__icon" aria-hidden="true">→</span>
                </button>
              </div>

              {showAllEvents && events.length > 0 && (
                <div className="landing-expanded-grid">
                  {events.map((ev) => (
                    <article key={`${ev._id}-full`} className="landing-expanded-card">
                      <div className="h-44 bg-gradient-to-br from-cyan-100 via-white to-slate-100">
                        {ev.images?.[0] ? (
                          <img src={getMediaUrl(ev.images[0])} alt={ev.title} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full items-center justify-center px-6 text-center bg-gradient-to-br from-cyan-800 to-slate-900">
                            <p className="text-xl font-display font-semibold text-white line-clamp-2">{ev.title}</p>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <p className="text-xs uppercase tracking-[0.28em] text-cyan-700">Event</p>
                        <h4 className="mt-2 text-xl font-semibold text-slate-900">{ev.title}</h4>
                        <p className="mt-1 text-sm text-slate-500">{formatEventDate(ev)}</p>
                        <p className="landing-expanded-card__desc">{ev.description || 'No description available.'}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div id="announcements-section" className="landing-block landing-block--announcements scroll-mt-24">
              <header className="landing-section-head">
                <div className="landing-section-head__text">
                  <p className="landing-section-head__eyebrow landing-section-head__eyebrow--announcements">Official notices</p>
                  <h3 className="landing-section-head__title">Announcements</h3>
                </div>
                {!loadingCommunity && announcements.length > 0 && (
                  <span className="landing-section-head__count">{announcements.length}</span>
                )}
              </header>

              {loadingCommunity ? (
                <div className="landing-empty animate-pulse">Loading announcements…</div>
              ) : (
                <LandingImageCarousel
                  carouselId="home-announcements"
                  items={announcements}
                  theme="announcements"
                  emptyMessage="No announcements yet. Important community updates will appear here."
                  badgeLabel="Featured update"
                  getImageSrc={(a) => (a.image ? getMediaUrl(a.image) : null)}
                  getTitle={(a) => a.title}
                  getDescription={(a) => a.message?.trim() || ''}
                  getDateLabel={formatAnnouncementDate}
                  getHref={() => '#announcements-section'}
                />
              )}

              <div className="landing-block__actions">
                <button
                  type="button"
                  onClick={() => setShowAllAnnouncements((prev) => !prev)}
                  className="landing-view-all landing-view-all--announcements"
                >
                  {showAllAnnouncements ? 'Show less announcements' : 'View all announcements'}
                  <span className="landing-view-all__icon" aria-hidden="true">→</span>
                </button>
              </div>

              {showAllAnnouncements && announcements.length > 0 && (
                <div className="mt-4 space-y-3">
                  {announcements.map((a) => (
                    <article key={`${a._id}-full`} className="landing-expanded-card">
                      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
                        <div className="relative min-h-[220px] bg-gradient-to-br from-amber-100 via-white to-slate-100">
                          {a.image ? (
                            <img src={getMediaUrl(a.image)} alt={a.title} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex h-full items-center justify-center px-6 text-center bg-gradient-to-br from-amber-800 to-slate-900">
                              <p className="text-xl font-display font-semibold text-white line-clamp-3">{a.title}</p>
                            </div>
                          )}
                        </div>
                        <div className="p-5 md:p-6">
                          <p className="text-xs uppercase tracking-[0.28em] text-amber-700">Announcement</p>
                          <h4 className="mt-2 text-xl font-semibold text-slate-900">{a.title}</h4>
                          <p className="mt-1 text-sm text-slate-500">{formatAnnouncementDate(a)}</p>
                          <p className="landing-expanded-card__desc">{a.message}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-200">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 font-semibold">Live snapshot</p>
            <h2 className="text-3xl font-display text-slate-900 mt-2">Neighborhood pulse</h2>
            <p className="text-slate-500 text-sm mt-1">
              {loadingSnapshot
                ? 'Syncing with latest data'
                : snapshot.updatedAt
                  ? `Updated ${new Date(snapshot.updatedAt).toLocaleString()}`
                  : 'Updated recently'}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-5 text-center">
                <p className="text-xs uppercase tracking-wider text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{loadingSnapshot ? '...' : formatNumber(stat.value)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#d8d8d8] rounded-xl px-6 md:px-10 py-10">
          <div className="text-center">
            <h2 className="text-4xl font-display text-slate-900">Key features</h2>
            <p className="text-slate-700 mt-2">A connected digital administration for services, participation, communication, and local accountability</p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: 'Access Public Services',
                description: 'Residents can browse Woreda services, review requirements, submit applications, upload documents, and track requests online.'
              },
              {
                title: 'Community Participation',
                description: 'Residents can report infrastructure issues, submit complaints or suggestions, and follow responses from the responsible office.'
              },
              {
                title: 'Transparent Communication',
                description: 'Announcements, public documents, notifications, meetings, and events keep residents informed about Mareko.'
              },
              {
                title: 'Coordinated Administration',
                description: 'Departments and officers receive, assign, process, and resolve requests with clear ownership and workload visibility.'
              },
              {
                title: 'Evidence-Based Decisions',
                description: 'Woreda leaders use live reports, service-request trends, Kebele activity, and audit history to manage operations.'
              },
              {
                title: 'Secure Role-Based Access',
                description: 'Residents, Kebele Admins, Department Officers, Woreda Admins, and System Admins each work within their responsibilities.'
              }
            ].map((item) => (
              <article key={item.title} className="bg-white rounded-lg border border-slate-300 p-5 text-center shadow-sm">
                <h3 className="text-2xl font-display text-slate-900">{item.title}</h3>
                <p className="mt-3 text-slate-700">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl px-6 md:px-10 py-10 border border-slate-200">
          <div className="text-center">
            <h2 className="text-4xl font-display text-slate-900">How The Platform Works</h2>
            <p className="text-slate-700 mt-2">One shared workflow connecting residents, Kebeles, departments, and Woreda leadership</p>
          </div>

          <div className="relative mt-8">
            <div className="hidden md:block absolute left-12 right-12 top-8 h-1 bg-cyan-200 rounded-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 text-center">
              {[
                {
                  step: '1',
                  title: 'Residents Participate',
                  description: 'Residents request services, report issues, submit complaints, give feedback, register for events, and receive public information.'
                },
                {
                  step: '2',
                  title: 'Kebele Admins Connect Locally',
                  description: 'Kebele Admins support residents and coordinate authorized local requests, issues, and announcements.'
                },
                {
                  step: '3',
                  title: 'Departments Process Work',
                  description: 'Department Officers review assigned work, request information, update progress, and provide resolutions.'
                },
                {
                  step: '4',
                  title: 'Woreda Admin Coordinates',
                  description: 'The Woreda Admin manages departments, services, Kebeles, officers, events, announcements, and performance.'
                },
                {
                  step: '5',
                  title: 'System Admin Governs',
                  description: 'The System Admin manages platform users, roles, permissions, configuration, cross-system oversight, and audit access.'
                }
              ].map((item) => (
                <div key={item.step} className="relative">
                  <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-700 text-white text-3xl font-bold flex items-center justify-center shadow-md">
                    {item.step}
                  </div>
                  <h3 className="mt-4 text-2xl font-display text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-slate-700">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#d8d8d8] rounded-xl px-6 md:px-10 py-10">
          <div className="text-center">
            <h2 className="text-4xl font-display text-slate-900">Platform Modules</h2>
            <p className="text-slate-700 mt-2">Tailored workspaces for every stakeholder in Mareko Special Woreda</p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: 'Resident Portal',
                description: 'Browse services, submit requests, track issues and complaints, read announcements, download documents, and join events.'
              },
              {
                title: 'Kebele Admin Workspace',
                description: 'Support Kebele residents and manage authorized local requests, issues, residents, announcements, and events.'
              },
              {
                title: 'Department Officer Workspace',
                description: 'Handle assigned service requests and community issues, communicate updates, and record resolutions.'
              },
              {
                title: 'Woreda Admin Dashboard',
                description: 'Manage departments, services, Kebeles, officers, requests, issues, complaints, events, announcements, documents, analytics, and audit activity.'
              },
              {
                title: 'System Admin Console',
                description: 'Manage platform users, roles, permissions, Woreda configuration, system-wide analytics, and broader audit access.'
              },
              {
                title: 'Public Information Hub',
                description: 'Publish and discover official announcements, public documents, events, meetings, service information, and community updates.'
              }
            ].map((module) => (
              <article key={module.title} className="bg-white rounded-lg border border-slate-300 p-5 text-center shadow-sm">
                <div className="mx-auto h-12 w-12 rounded-full bg-slate-300" />
                <h3 className="mt-3 text-xl font-display text-slate-900">{module.title}</h3>
                <p className="mt-2 text-slate-700 text-sm">{module.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#c8c8c8] rounded-2xl px-6 md:px-10 py-12 text-center">
          <h2 className="text-4xl font-display text-slate-900">Join the Digital Transformation of Community Governance</h2>
          <p className="mt-3 text-slate-800 max-w-3xl mx-auto">
            Be part of the modern solution that bridges the gap between residents and local government through technology and transparency.
          </p>
          <div className="mt-8">
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-3 rounded-full text-white font-semibold bg-gradient-to-r from-amber-500 to-orange-700 hover:brightness-110"
            >
              Create Account
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
