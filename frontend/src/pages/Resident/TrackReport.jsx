import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reportsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const statusStyles = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  'In Progress': 'bg-sky-100 text-sky-800 border-sky-200',
  Resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Rejected: 'bg-rose-100 text-rose-800 border-rose-200'
};

const TrackReport = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getOne(id);
      setReport(response.data.data);
    } catch (error) {
      toast.error('Unable to load report details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-200 bg-white p-6 text-slate-600 shadow-sm">
        Report not found.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-950 via-amber-900 to-orange-800 px-6 py-8 text-white shadow-xl md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.24),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.18),transparent_30%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
              Report details
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Report status</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-amber-50/85 md:text-base">
              Track the current state of your submission and review the complete update history in one place.
            </p>
          </div>
          <Link
            to="/resident/reports"
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-950/20 transition-transform hover:-translate-y-0.5 hover:bg-amber-50"
          >
            Back to reports
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-lg shadow-amber-50">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Submission summary</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">{report.title}</h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">{report.description}</p>
            </div>

            <div className="grid gap-3 sm:min-w-[220px]">
              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Category</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{report.category}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Created</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{new Date(report.createdAt).toLocaleDateString()}</p>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${statusStyles[report.status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{report.status}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[report.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
              {report.status}
            </span>
            <span className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              {report.category}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              Submitted {new Date(report.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-lg shadow-amber-50">
          <div className="border-b border-slate-100 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Activity log</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Update history</h3>
          </div>

          {report.updates && report.updates.length > 0 ? (
            <ul className="mt-5 space-y-4">
              {report.updates.map((update, index) => (
                <li key={index} className="relative pl-6">
                  <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-amber-500 ring-4 ring-amber-100" />
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {update.timestamp ? new Date(update.timestamp).toLocaleString() : 'Update'}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{update.status}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{update.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              There are no updates yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackReport;
