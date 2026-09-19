import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { analyticsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  PortalPage,
  PortalHero,
  PortalHeroLink,
  PortalPanel,
  PortalLoading,
  PortalEmpty,
  PortalQuickLink
} from '../../components/portal/PortalPageShell';

const PALETTE = ['#d97706','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#06b6d4','#84cc16'];

const StatCard = ({ label, value, sub, color = 'amber' }) => {
  const colors = {
    amber: 'border-amber-200 bg-amber-50',
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    red: 'border-red-200 bg-red-50',
    slate: 'border-slate-200 bg-slate-50'
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color] || colors.amber}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-bold text-slate-900">{value ?? '—'}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
};

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return new Date(date).toLocaleDateString();
};

const activityIcon = (type) => {
  if (type === 'service_request') return '📋';
  if (type === 'issue') return '🚨';
  if (type === 'announcement') return '📢';
  return '•';
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, chartsRes] = await Promise.all([
          analyticsAPI.getWoredaStats(),
          analyticsAPI.getWoredaDashboard()
        ]);
        if (!mounted) return;
        setStats(statsRes.data.data);
        setCharts(chartsRes.data.data);
      } catch {
        if (mounted) toast.error('Unable to load dashboard data');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const s = stats || {};
  const sr = s.serviceRequests || {};
  const ci = s.communityIssues || {};
  const totalPending = (sr.pending || 0) + (ci.pending || 0);
  const totalResolved = (sr.resolved || 0) + (ci.resolved || 0);

  const deptData = charts?.requestsByDepartment || [];
  const kebeleData = charts?.issuesByKebele || [];
  const activity = charts?.recentActivity || [];

  return (
    <PortalPage>
      <PortalHero
        eyebrow={`Woreda Administration · ${user?.woreda || ''}`}
        title="Woreda Admin Dashboard"
        description="Overview of residents, service requests, community issues, and complaints."
        actions={
          <>
            <PortalHeroLink to="/woreda-admin/service-requests">Service Requests</PortalHeroLink>
            <PortalHeroLink to="/woreda-admin/reports" variant="ghost">Community Issues</PortalHeroLink>
            <PortalHeroLink to="/woreda-admin/announcements" variant="ghost">Announcements</PortalHeroLink>
          </>
        }
      />

      {loading ? <PortalLoading /> : (
        <>
          {/* Row 1: 4 main stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Residents" value={s.residents?.toLocaleString()} color="blue" />
            <StatCard label="Service Requests" value={sr.total?.toLocaleString()} color="amber" />
            <StatCard label="Community Issues" value={ci.total?.toLocaleString()} color="red" />
            <StatCard label="Complaints & Feedback" value={s.complaints?.toLocaleString()} color="slate" />
          </div>

          {/* Row 2: Pending + Resolved */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard label="Pending" value={totalPending.toLocaleString()} sub="Awaiting action across all categories" color="red" />
            <StatCard label="Resolved" value={totalResolved.toLocaleString()} sub="Completed service requests + issues" color="green" />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Requests by Department */}
            <div className="officer-chart-panel">
              <h2 className="officer-chart-panel__title">Requests by Department</h2>
              {deptData.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No data yet.</p>
              ) : (
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptData} layout="vertical" margin={{ left: 16, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="department" tick={{ fontSize: 11 }} width={100} />
                      <Tooltip />
                      <Bar dataKey="count" name="Requests" radius={[0, 4, 4, 0]}>
                        {deptData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Issues by Kebele */}
            <div className="officer-chart-panel">
              <h2 className="officer-chart-panel__title">Issues by Kebele</h2>
              {kebeleData.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No data yet.</p>
              ) : (
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kebeleData} layout="vertical" margin={{ left: 16, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="kebele" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="count" name="Issues" radius={[0, 4, 4, 0]}>
                        {kebeleData.map((_, i) => <Cell key={i} fill={PALETTE[(i + 3) % PALETTE.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Activity + Quick actions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PortalPanel title="Recent Activity">
                {activity.length === 0 ? (
                  <PortalEmpty message="No recent activity." />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {activity.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 py-3">
                        <span className="text-lg shrink-0">{activityIcon(item.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800">{item.label}</p>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0 whitespace-nowrap">{timeAgo(item.time)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </PortalPanel>
            </div>

            <PortalPanel title="Quick Actions">
              <div className="space-y-3">
                <PortalQuickLink to="/woreda-admin/residents" icon="👥">Residents</PortalQuickLink>
                <PortalQuickLink to="/woreda-admin/officers" icon="🏢">Department Officers</PortalQuickLink>
                <PortalQuickLink to="/woreda-admin/service-requests" icon="📋">Service Requests</PortalQuickLink>
                <PortalQuickLink to="/woreda-admin/reports" icon="🚨">Community Issues</PortalQuickLink>
                <PortalQuickLink to="/woreda-admin/complaints" icon="💬">Complaints & Feedback</PortalQuickLink>
                <PortalQuickLink to="/woreda-admin/departments" icon="🏛️">Departments</PortalQuickLink>
                <PortalQuickLink to="/woreda-admin/kebeles" icon="📍">Kebeles</PortalQuickLink>
                <PortalQuickLink to="/woreda-admin/analytics" icon="📊">Reports & Analytics</PortalQuickLink>
              </div>
            </PortalPanel>
          </div>
        </>
      )}
    </PortalPage>
  );
};

export default Dashboard;
