import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { announcementsAPI, eventsAPI, reportsAPI, resourcesAPI, serviceRequestsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { getMediaUrl } from '../../utils/media';
import EventWoredaFilter from '../../components/events/EventWoredaFilter';
import {
  buildEventWoredaQueryParams,
  defaultEventWoredaFilterForUser,
  formatEventWoredaLabel
} from '../../utils/woredas';

const statusStyles = {
  Pending: 'bg-yellow-100 text-yellow-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  Resolved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800'
};

const Dashboard = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [requests, setRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventWoredaFilter, setEventWoredaFilter] = useState('all');
  const [publicUpdates, setPublicUpdates] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const eventParams = buildEventWoredaQueryParams(eventWoredaFilter, {
          status: 'Upcoming',
          'date[gte]': new Date().toISOString(),
          sort: '-createdAt',
          limit: 20
        });

        const eventsRequest =
          eventWoredaFilter === 'all' && user.woreda
            ? eventsAPI.getByWoreda(user.woreda)
            : eventsAPI.getAll(eventParams);

        const [reportsResponse, requestsResponse, eventsResponse] = await Promise.all([
          reportsAPI.getMyReports(),
          serviceRequestsAPI.getAll({ limit: 20 }),
          eventsRequest
        ]);

        const [publicUpdatesResponse, announcementsResponse, resourcesResponse] = await Promise.all([
          reportsAPI.getPublicUpdates(),
          announcementsAPI.getAll(),
          resourcesAPI.getAll({ sort: '-createdAt', limit: 3 })
        ]);

        if (!isMounted) return;

        setReports(reportsResponse.data?.data || []);
        setRequests(requestsResponse.data?.data || []);
        setEvents(eventsResponse.data?.data || []);
        setPublicUpdates((publicUpdatesResponse.data?.data || []).slice(0, 3));
        setAnnouncements((announcementsResponse.data?.data || []).slice(0, 3));
        setResources(resourcesResponse.data?.data || []);
      } catch (error) {
        if (isMounted) {
          const message =
            error.response?.data?.error ||
            error.response?.data?.message ||
            'Unable to load dashboard data';

          toast.error(message, { id: 'resident-dashboard-load-error' });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user, eventWoredaFilter]);

  useEffect(() => {
    setEventWoredaFilter(defaultEventWoredaFilterForUser(user));
  }, [user?.woreda]);

  const stats = useMemo(() => {
    const resolvedCount = reports.filter((report) => report.status === 'Resolved').length;

    return [
      { label: 'My requests', value: requests.length },
      { label: 'My issues', value: reports.length },
      { label: 'Resolved issues', value: resolvedCount },
      { label: 'Upcoming events', value: events.length }
    ];
  }, [reports, requests, events]);

  const recentReports = useMemo(() => reports.slice(0, 3), [reports]);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-950 via-amber-900 to-orange-800 px-6 py-8 text-white shadow-xl md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.24),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.18),transparent_30%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
              Resident dashboard
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
              Welcome back{user?.fullName ? `, ${user.fullName}` : ''}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-amber-50/85 md:text-base">
              Track your reports, see updates, and move through community services from a more polished dashboard.
            </p>
          </div>

          <Link
            to="/resident/reports/new"
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-950/20 transition-transform hover:-translate-y-0.5 hover:bg-amber-50"
          >
            Report an issue
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={stat.label} className="group rounded-2xl border border-amber-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {loading ? '...' : stat.value}
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                0{index + 1}
              </div>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400" style={{ width: loading ? '0%' : '100%' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-lg shadow-amber-50">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Community pulse</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Public updates</h2>
              <p className="mt-1 text-sm text-slate-500">Officer updates for reports in your woreda.</p>
            </div>
            <Link to="/resident/public-updates" className="text-sm font-medium text-amber-700 hover:text-amber-800">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="flex h-28 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
            </div>
          ) : publicUpdates.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              No public updates available right now.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {publicUpdates.map((item) => (
                <div key={item._id} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-amber-50/50 p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.reportTitle}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.reportCategory} • {item.reportDepartment || 'General'} • {item.woreda}
                      </p>
                    </div>
                    <span className="inline-flex rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      {item.reportStatus}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{item.latestUpdate?.message}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span>
                      {item.latestUpdate?.timestamp ? new Date(item.latestUpdate.timestamp).toLocaleString() : 'Update'}
                    </span>
                    <Link to={`/resident/reports/${item.reportId}`} className="font-medium text-amber-700 hover:text-amber-800">
                      Open report
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-lg shadow-amber-50">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Your activity</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Recent reports</h2>
            </div>
            <Link to="/resident/reports" className="text-sm font-medium text-amber-700 hover:text-amber-800">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="flex h-28 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
            </div>
          ) : recentReports.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              You have no recent reports to show. Create a new report to get started.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {recentReports.map((report) => (
                <div key={report._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:bg-amber-50/60">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <Link
                        to={`/resident/reports/${report._id}`}
                        className="truncate text-sm font-semibold text-slate-900 hover:text-amber-700"
                      >
                        {report.title}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[report.status] || 'bg-slate-100 text-slate-700'}`}
                    >
                      {report.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-lg shadow-amber-50">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Community calendar</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Upcoming events</h2>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px]">
              <EventWoredaFilter
                value={eventWoredaFilter}
                onChange={(e) => setEventWoredaFilter(e.target.value)}
                disabled={loading}
              />
            </div>
            <Link to="/events" className="text-sm font-medium text-amber-700 hover:text-amber-800">
              View all
            </Link>
          </div>
        </div>
        {loading ? (
          <div className="flex h-28 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
          </div>
        ) : events.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            No events match the selected woreda filter.
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {events.slice(0, 4).map((event) => (
              <div key={event._id} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-amber-50/50 p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{event.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(event.date).toLocaleString()} · {formatEventWoredaLabel(event.woreda)}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    {formatEventWoredaLabel(event.woreda)}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{event.description || 'No description provided.'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-lg shadow-amber-50">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Community noticeboard</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Latest announcements</h2>
            </div>
            <Link to="/resident/announcements" className="text-sm font-medium text-amber-700 hover:text-amber-800">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="flex h-28 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              No announcements available right now.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {announcements.map((item) => (
                <div key={item._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-amber-50/60 p-4 shadow-sm">
                  {item.image && (
                    <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 aspect-[4/3] max-h-32">
                      <img
                        src={getMediaUrl(item.image)}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="truncate font-semibold text-slate-900">{item.title}</h3>
                    <span className="inline-flex rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      {item.category || 'General'}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{item.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-lg shadow-amber-50">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Library</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Recent resources</h2>
            </div>
            <Link to="/resident/resources" className="text-sm font-medium text-amber-700 hover:text-amber-800">
              Open library
            </Link>
          </div>
          {loading ? (
            <div className="flex h-28 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
            </div>
          ) : resources.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              No resources available right now.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {resources.map((resource) => (
                <div key={resource._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:bg-amber-50/60">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="truncate font-semibold text-slate-900">{resource.title}</h3>
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {resource.category || 'Other'}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{resource.description || 'No description provided.'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
