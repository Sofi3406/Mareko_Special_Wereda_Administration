import React, { useEffect, useState } from 'react';
import { reportsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  OfficerPage,
  OfficerHero,
  OfficerHeroLink,
  OfficerStatGrid,
  OfficerPanel,
  OfficerLoading,
  OfficerEmpty,
  OfficerQuickLink,
  statusToClass
} from '../../components/officer/OfficerPageShell';

const Dashboard = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getByDepartment(user?.department);
      setReports(response.data.data || []);
    } catch (error) {
      toast.error('Unable to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user?.department]);

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'Pending').length,
    inProgress: reports.filter((r) => r.status === 'In Progress').length,
    resolved: reports.filter((r) => r.status === 'Resolved').length
  };

  const total = Math.max(stats.total, 1);

  return (
    <OfficerPage>
      <OfficerHero
        eyebrow="Department workspace"
        title="Officer dashboard"
        description="Manage department reports, share resources, and keep residents informed with timely updates and announcements."
        actions={
          <>
            <OfficerHeroLink to="/officer/reports">Manage reports</OfficerHeroLink>
            <OfficerHeroLink to="/officer/announcements" variant="ghost">
              Announcements
            </OfficerHeroLink>
          </>
        }
      />

      <OfficerStatGrid
        stats={[
          { label: 'Total reports', value: stats.total, percent: 100 },
          { label: 'Pending', value: stats.pending, percent: (stats.pending / total) * 100 },
          { label: 'In progress', value: stats.inProgress, percent: (stats.inProgress / total) * 100 },
          { label: 'Resolved', value: stats.resolved, percent: (stats.resolved / total) * 100 }
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OfficerPanel title="Recent reports" linkTo="/officer/reports">
            {loading ? (
              <OfficerLoading />
            ) : reports.length === 0 ? (
              <OfficerEmpty message="No reports assigned to your department yet." />
            ) : (
              <ul className="space-y-3">
                {reports.slice(0, 5).map((report) => (
                  <li key={report._id} className="officer-list-item">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{report.title}</p>
                      <span className={statusToClass(report.status)}>{report.status}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      {report.category} · {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </OfficerPanel>
        </div>

        <OfficerPanel title="Quick actions">
          <div className="space-y-3">
            <OfficerQuickLink to="/officer/updates" icon="✎">
              Post report updates
            </OfficerQuickLink>
            <OfficerQuickLink to="/officer/resources" icon="📁">
              Upload resources
            </OfficerQuickLink>
            <OfficerQuickLink to="/officer/announcements" icon="📢">
              Publish announcement
            </OfficerQuickLink>
            <OfficerQuickLink to="/officer/events" icon="📅">
              Register for events
            </OfficerQuickLink>
          </div>
        </OfficerPanel>
      </div>
    </OfficerPage>
  );
};

export default Dashboard;
