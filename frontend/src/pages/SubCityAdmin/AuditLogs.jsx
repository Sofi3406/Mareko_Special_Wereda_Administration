import React, { useEffect, useState } from 'react';
import { auditLogsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  PortalPage,
  PortalHero,
  PortalLoading,
  PortalEmpty,
  PortalFormPanel,
  PortalField,
  PortalPrimaryButton,
  PortalOutlineButton,
  PortalPanel
} from '../../components/portal/PortalPageShell';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ entity: '', action: '' });
  const [applied, setApplied] = useState({ entity: '', action: '' });

  const fetchLogs = async (f = applied, p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 50 };
      if (f.entity) params.entity = f.entity;
      if (f.action) params.action = f.action;
      const res = await auditLogsAPI.getAll(params);
      setLogs(res.data.data || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch {
      toast.error('Unable to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntities = async () => {
    try {
      const res = await auditLogsAPI.getEntities();
      setEntities(res.data.data || []);
    } catch { /* non-fatal */ }
  };

  useEffect(() => {
    fetchEntities();
    fetchLogs();
  }, []); // eslint-disable-line

  const handleApply = (e) => {
    e.preventDefault();
    setPage(1);
    setApplied({ ...filters });
    fetchLogs(filters, 1);
  };

  const handlePage = (p) => {
    setPage(p);
    fetchLogs(applied, p);
  };

  return (
    <PortalPage>
      <PortalHero
        eyebrow="System Administration"
        title="Audit Logs"
        description={`${total.toLocaleString()} total log entries. Track all platform actions.`}
      />

      <PortalFormPanel title="Filter logs" onSubmit={handleApply}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PortalField label="Entity type">
            <select
              className="input mt-0"
              value={filters.entity}
              onChange={e => setFilters({ ...filters, entity: e.target.value })}
            >
              <option value="">All entities</option>
              {entities.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </PortalField>
          <PortalField label="Action keyword">
            <input
              className="input mt-0"
              placeholder="e.g. create, update, delete"
              value={filters.action}
              onChange={e => setFilters({ ...filters, action: e.target.value })}
            />
          </PortalField>
          <div className="flex items-end gap-2">
            <PortalPrimaryButton type="submit">Apply</PortalPrimaryButton>
            <PortalOutlineButton type="button" onClick={() => {
              setFilters({ entity: '', action: '' });
              setApplied({ entity: '', action: '' });
              setPage(1);
              fetchLogs({ entity: '', action: '' }, 1);
            }}>
              Clear
            </PortalOutlineButton>
          </div>
        </div>
      </PortalFormPanel>

      <PortalPanel title={`Logs (${total.toLocaleString()})`}>
        {loading ? (
          <PortalLoading />
        ) : logs.length === 0 ? (
          <PortalEmpty message="No audit log entries found." />
        ) : (
          <>
            <div className="officer-table-wrap overflow-x-auto">
              <table className="officer-table min-w-[700px]">
                <thead>
                  <tr>
                    <th>Actor</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log._id}>
                      <td>{log.actor?.fullName || '—'}</td>
                      <td>
                        <span className="officer-chip">{log.actor?.role || '—'}</span>
                      </td>
                      <td>{log.action}</td>
                      <td><span className="officer-chip">{log.entity}</span></td>
                      <td className="text-slate-500 text-xs whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="mt-4 flex items-center gap-2">
                <PortalOutlineButton
                  type="button"
                  disabled={page <= 1}
                  onClick={() => handlePage(page - 1)}
                >
                  ← Prev
                </PortalOutlineButton>
                <span className="text-sm text-slate-600">Page {page} of {pages}</span>
                <PortalOutlineButton
                  type="button"
                  disabled={page >= pages}
                  onClick={() => handlePage(page + 1)}
                >
                  Next →
                </PortalOutlineButton>
              </div>
            )}
          </>
        )}
      </PortalPanel>
    </PortalPage>
  );
};

export default AuditLogs;
