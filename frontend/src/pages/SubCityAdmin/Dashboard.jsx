import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { analyticsAPI } from '../../services/api';
import {
  PortalPage,
  PortalHero,
  PortalHeroLink,
  PortalLoading,
  PortalPanel,
  PortalEmpty,
  PortalQuickLink
} from '../../components/portal/PortalPageShell';

const StatCard = ({ label, value, sub, color = 'amber' }) => {
  const colors = {
    amber: 'border-amber-200 bg-amber-50',
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    red: 'border-red-200 bg-red-50',
    slate: 'border-slate-200 bg-slate-50',
    indigo: 'border-indigo-200 bg-indigo-50'
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color] || colors.amber}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-bold text-slate-900">{value ?? '—'}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
};

const SystemAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await analyticsAPI.getSystemStats();
      setStats(res.data.data);
    } catch {
      toast.error('Unable to load system stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const u = stats?.users || {};
  const r = stats?.reports || {};
  const sr = stats?.serviceRequests || {};
  const d = stats?.departments || {};
  const k = stats?.kebeles || {};
  const logs = stats?.recentAuditLogs || [];

  return (
    <PortalPage>
      <PortalHero
        eyebrow="System Administration"
        title="System Admin Dashboard"
        description="Platform-wide overview of users, content, and system health."
        actions={
          <>
            <PortalHeroLink to="/subcity-admin/users">User Management</PortalHeroLink>
            <PortalHeroLink to="/subcity-admin/audit-logs" variant="ghost">Audit Logs</PortalHeroLink>
          </>
        }
      />

      {loading ? (
        <PortalLoading />
      ) : (
        <>
          {/* Users row */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Users</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard label="Total Users" value={u.total?.toLocaleString()} color="blue" />
              <StatCard label="Residents" value={u.residents?.toLocaleString()} color="slate" />
              <StatCard label="Officers" value={u.officers?.toLocaleString()} color="slate" />
              <StatCard label="Woreda Admins" value={u.woredaAdmins?.toLocaleString()} color="amber" />
              <StatCard label="Active Accounts" value={u.active?.toLocaleString()} color="green" sub={`${u.pendingActivation || 0} pending activation`} />
            </div>
          </div>

          {/* Reports + Service Requests */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Community Issues</p>
              <div className="grid grid-cols-3 gap-4">
                <StatCard label="Total" value={r.total?.toLocaleString()} color="amber" />
                <StatCard label="Pending" value={r.pending?.toLocaleString()} color="red" />
                <StatCard label="Resolved" value={r.resolved?.toLocaleString()} color="green" />
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Service Requests</p>
              <div className="grid grid-cols-3 gap-4">
                <StatCard label="Total" value={sr.total?.toLocaleString()} color="indigo" />
                <StatCard label="Pending" value={sr.pending?.toLocaleString()} color="red" />
                <StatCard label="Resolved" value={sr.resolved?.toLocaleString()} color="green" />
              </div>
            </div>
          </div>

          {/* Departments + Kebeles + Events */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Departments" value={d.total?.toLocaleString()} sub={`${d.active || 0} active`} color="amber" />
            <StatCard label="Kebeles" value={k.total?.toLocaleString()} sub={`${k.active || 0} active`} color="amber" />
            <StatCard label="Events" value={stats?.events?.total?.toLocaleString()} color="slate" />
            <StatCard label="Pending Activation" value={u.pendingActivation?.toLocaleString()} color="red" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent Audit Log */}
            <div className="lg:col-span-2">
              <PortalPanel title="Recent Audit Log" linkTo="/subcity-admin/audit-logs" linkLabel="View all">
                {logs.length === 0 ? (
                  <PortalEmpty message="No audit log entries yet." />
                ) : (
                  <div className="officer-table-wrap overflow-x-auto">
                    <table className="officer-table min-w-[520px]">
                      <thead>
                        <tr><th>Actor</th><th>Action</th><th>Entity</th><th>Time</th></tr>
                      </thead>
                      <tbody>
                        {logs.map(log => (
                          <tr key={log._id}>
                            <td>{log.actor?.fullName || '—'}</td>
                            <td>{log.action}</td>
                            <td><span className="officer-chip">{log.entity}</span></td>
                            <td className="text-slate-500 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </PortalPanel>
            </div>

            {/* Quick actions */}
            <PortalPanel title="Quick actions">
              <div className="space-y-3">
                <PortalQuickLink to="/subcity-admin/users" icon="👥">All Users</PortalQuickLink>
                <PortalQuickLink to="/subcity-admin/admins" icon="🛡️">Woreda Admins</PortalQuickLink>
                <PortalQuickLink to="/subcity-admin/departments" icon="🏛️">Departments</PortalQuickLink>
                <PortalQuickLink to="/subcity-admin/kebeles" icon="📍">Kebeles</PortalQuickLink>
                <PortalQuickLink to="/subcity-admin/audit-logs" icon="📋">Audit Logs</PortalQuickLink>
                <PortalQuickLink to="/subcity-admin/system-config" icon="⚙️">System Config</PortalQuickLink>
                <PortalQuickLink to="/subcity-admin/reports" icon="🚨">All Issues</PortalQuickLink>
                <PortalQuickLink to="/subcity-admin/events" icon="📅">Events</PortalQuickLink>
              </div>
            </PortalPanel>
          </div>
        </>
      )}
    </PortalPage>
  );
};

export default SystemAdminDashboard;
