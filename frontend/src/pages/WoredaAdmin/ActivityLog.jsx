import React, { useEffect, useState } from 'react';
import { auditLogsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  PortalPage,
  PortalHero,
  PortalLoading,
  PortalEmpty,
  PortalPanel
} from '../../components/portal/PortalPageShell';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await auditLogsAPI.getAll({ limit: 50 });
        if (!mounted) return;
        setLogs(response.data.data || []);
      } catch {
        if (mounted) toast.error('Unable to load activity log');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Woreda Administration"
        title="Activity Log"
        description="Recent community issues and service request activity in your woreda."
      />

      {loading ? (
        <PortalLoading />
      ) : (
        <PortalPanel title="Administrative activity">
            {logs.length === 0 ? (
              <PortalEmpty message="No administrative activity recorded yet." />
            ) : (
              <div className="officer-table-wrap overflow-x-auto">
                <table className="officer-table min-w-[640px]">
                  <thead>
                    <tr><th>Action</th><th>Entity</th><th>Actor</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log._id}>
                        <td>{log.action}</td>
                        <td>{log.entity}</td>
                        <td>{log.actor?.fullName || 'System'}</td>
                        <td className="text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PortalPanel>
      )}
    </PortalPage>
  );
};

export default ActivityLog;
