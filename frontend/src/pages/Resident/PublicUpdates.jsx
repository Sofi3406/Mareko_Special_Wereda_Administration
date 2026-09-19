import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const PublicUpdates = () => {
  const { user } = useAuth();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const fetchUpdates = async () => {
      setLoading(true);
      try {
        const response = await reportsAPI.getPublicUpdates();
        if (!isMounted) return;

        setUpdates(response.data?.data || []);
      } catch (error) {
        if (isMounted) {
          toast.error('Unable to load public updates');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUpdates();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-950 via-amber-900 to-orange-800 px-6 py-8 text-white shadow-xl md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.24),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.18),transparent_30%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
              Public feed
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Public updates</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-amber-50/85 md:text-base">
              Officer updates for reports in your woreda, shown in a cleaner timeline-style view.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:min-w-[280px]">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-100/80">Updates</p>
              <p className="mt-1 text-2xl font-semibold">{updates.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-100/80">Latest</p>
              <p className="mt-1 text-sm font-medium text-amber-100">Community progress</p>
            </div>
          </div>
        </div>
      </div>

      {updates.length === 0 ? (
        <div className="rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-lg shadow-amber-50">
          <p className="text-base font-medium text-slate-900">No public updates are available yet.</p>
          <p className="mt-2 text-sm text-slate-600">When officers publish a new update, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {updates.map((item) => (
            <div key={item._id} className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-lg shadow-amber-50 transition-shadow hover:shadow-xl">
              <div className="border-b border-amber-50 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-5 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-semibold text-slate-900">{item.reportTitle}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                    {item.reportCategory} • {item.reportDepartment || 'General'} • {item.woreda}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {item.reportStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-5 md:p-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span>
                      {item.latestUpdate?.updatedBy?.fullName || 'Officer'}
                      {item.latestUpdate?.updatedBy?.department ? ` • ${item.latestUpdate.updatedBy.department}` : ''}
                    </span>
                    <span>
                      {item.latestUpdate?.timestamp ? new Date(item.latestUpdate.timestamp).toLocaleString() : 'Update'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{item.latestUpdate?.message}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    Linked report: {item.resident?.fullName ? `submitted by ${item.resident.fullName}` : 'community report'}
                  </p>
                  <Link to={`/resident/reports/${item.reportId}`} className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-amber-200 transition-transform hover:-translate-y-0.5 hover:from-amber-500 hover:to-orange-500">
                    Open report
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicUpdates;