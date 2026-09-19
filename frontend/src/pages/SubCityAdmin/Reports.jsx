import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { reportsAPI } from '../../services/api';
import {
  PortalPage,
  PortalHero,
  PortalLoading,
  PortalEmpty,
  statusToClass
} from '../../components/portal/PortalPageShell';

const formatReportTime = (value) => {
  const date = new Date(value);
  return {
    day: date.toLocaleDateString(undefined, { day: '2-digit' }),
    month: date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
    full: date.toLocaleString()
  };
};

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getAll({ sort: '-createdAt', limit: 100 });
      setReports(response.data.data || []);
    } catch (error) {
      toast.error('Unable to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <PortalPage>
        <PortalHero
          eyebrow="Sub city oversight"
          title="All reports"
          description="Review reports submitted across all woredas."
        />
        <PortalLoading />
      </PortalPage>
    );
  }

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Sub city oversight"
        title="All reports"
        description="Review every report across the sub city with status, category, woreda, and resident details."
      />

      {reports.length === 0 ? (
        <PortalEmpty message="No reports found." />
      ) : (
        <div className="space-y-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800">
            {reports.length} report{reports.length === 1 ? '' : 's'}
          </p>
          {reports.map((report) => {
            const time = formatReportTime(report.createdAt);

            return (
              <article key={report._id} className="officer-report-card">
                <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="officer-event-date">
                      <span className="officer-event-date__month">{time.month}</span>
                      <span className="officer-event-date__day">{time.day}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900">{report.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {report.description || 'No description provided.'}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">Submitted: {time.full}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                    <span className={statusToClass(report.status)}>{report.status}</span>
                    <span className="officer-chip">{report.category || 'General'}</span>
                    <span className="officer-chip officer-chip--muted">
                      {report.woreda || 'N/A'}
                    </span>
                    <span className="officer-chip officer-chip--muted">
                      {report.residentId?.fullName || 'Resident'}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PortalPage>
  );
};

export default Reports;
