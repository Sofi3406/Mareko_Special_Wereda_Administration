import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { reportsAPI, serviceRequestsAPI, usersAPI, announcementsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DashboardAnnouncementsShowcase from '../../components/portal/DashboardAnnouncementsShowcase';
import {
  PortalPage,
  PortalHero,
  PortalHeroLink,
  PortalPanel,
  PortalLoading,
  PortalEmpty,
  PortalQuickLink,
  statusToClass
} from '../../components/portal/PortalPageShell';

const StatCard = ({ label, value, color = 'amber' }) => {
  const colors = {
    amber: 'border-amber-200 bg-amber-50',
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    red: 'border-red-200 bg-red-50',
    slate: 'border-slate-200 bg-slate-50'
  };
  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">{value ?? '—'}</p>
    </div>
  );
};

const KebeleAdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [requests, setRequests] = useState([]);
  const [residents, setResidents] = useState(0);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [rRes, srRes, uRes, annRes] = await Promise.all([
          reportsAPI.getAll({ limit: 10 }),
          serviceRequestsAPI.getAll({ limit: 10 }),
          usersAPI.getAll({ role: 'resident' }),
          announcementsAPI.getAll()
        ]);
        if (!mounted) return;
        setReports(rRes.data.data || []);
        setRequests(srRes.data.data || []);
        setResidents(uRes.data.count || 0);
        setAnnouncements(annRes.data.data || []);
      } catch {
        if (mounted) toast.error('Unable to load dashboard data');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const pending = reports.filter(r => r.status === 'Pending').length;
  const resolved = reports.filter(r => r.status === 'Resolved').length;
  const pendingReqs = requests.filter(r => r.status === 'SUBMITTED').length;

  return (
    <PortalPage>
      <PortalHero
        eyebrow={`Kebele Administration · ${user?.woreda || ''}`}
        title="Kebele Admin Dashboard"
        description="Overview of community issues and service requests in your kebele."
        actions={
          <>
            <PortalHeroLink to="/kebele-admin/reports">Community Issues</PortalHeroLink>
            <PortalHeroLink to="/kebele-admin/service-requests" variant="ghost">Service Requests</PortalHeroLink>
          </>
        }
      />

      {loading ? (
        <PortalLoading />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Residents" value={residents.toLocaleString()} color="blue" />
            <StatCard label="Community Issues" value={reports.length.toLocaleString()} color="amber" />
            <StatCard label="Pending Issues" value={pending.toLocaleString()} color="red" />
            <StatCard label="Resolved Issues" value={resolved.toLocaleString()} color="green" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard label="Service Requests" value={requests.length.toLocaleString()} color="slate" />
            <StatCard label="Pending Requests" value={pendingReqs.toLocaleString()} color="red" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PortalPanel title="Recent Community Issues" linkTo="/kebele-admin/reports" linkLabel="View all">
                {reports.length === 0 ? (
                  <PortalEmpty message="No community issues yet." />
                ) : (
                  <ul className="space-y-3">
                    {reports.slice(0, 5).map(r => (
                      <li key={r._id} className="officer-list-item">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {r.category} · {new Date(r.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={statusToClass(r.status)}>{r.status}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </PortalPanel>
            </div>

            <PortalPanel title="Quick actions">
              <div className="space-y-3">
                <PortalQuickLink to="/kebele-admin/reports" icon="🚨">Community Issues</PortalQuickLink>
                <PortalQuickLink to="/kebele-admin/service-requests" icon="📋">Service Requests</PortalQuickLink>
                <PortalQuickLink to="/kebele-admin/residents" icon="👥">Residents</PortalQuickLink>
                <PortalQuickLink to="/kebele-admin/announcements" icon="📢">Announcements</PortalQuickLink>
                <PortalQuickLink to="/profile/edit" icon="👤">Edit Profile</PortalQuickLink>
              </div>
            </PortalPanel>
          </div>
        </>
      )}

      <DashboardAnnouncementsShowcase
        announcements={announcements}
        loading={loading}
        manageLink="/kebele-admin/announcements"
      />
    </PortalPage>
  );
};

export default KebeleAdminDashboard;
