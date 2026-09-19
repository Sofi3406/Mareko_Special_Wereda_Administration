import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const statusStyles = {
  Pending: 'bg-yellow-100 text-yellow-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  Resolved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800'
};

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getMyReports();
      setReports(response.data.data || []);
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Unable to load reports';

      toast.error(message, { id: 'resident-reports-load-error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600"></div>
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
              Report tracker
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">My reports</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-amber-50/85 md:text-base">
              Follow every issue you have submitted and see the progress of each case in one clear view.
            </p>
          </div>

          <Link
            to="/resident/reports/new"
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-950/20 transition-transform hover:-translate-y-0.5 hover:bg-amber-50"
          >
            New report
          </Link>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">No reports yet</p>
          <p className="mt-2 text-sm text-slate-500">Submit your first issue to start tracking updates and responses from the community team.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-lg shadow-amber-50">
          <div className="border-b border-slate-100 px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Submission history</p>
            <p className="mt-1 text-sm text-slate-500">A clean list of your reports, statuses, and direct links to each case.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Created</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
              {reports.map((report) => (
                <tr key={report._id} className="transition-colors hover:bg-amber-50/50">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">{report.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{report.category}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[report.status] || 'bg-slate-100 text-slate-700'}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/resident/reports/${report._id}`} className="text-sm font-medium text-amber-700 hover:text-amber-800">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReports;
