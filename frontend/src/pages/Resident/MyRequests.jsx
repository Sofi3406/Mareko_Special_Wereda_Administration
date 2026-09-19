import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { serviceRequestsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const STATUS_STYLES = {
  SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
  UNDER_REVIEW: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  ASSIGNED: 'bg-purple-50 text-purple-700 border-purple-200',
  IN_PROGRESS: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  WAITING_FOR_INFORMATION: 'bg-orange-50 text-orange-700 border-orange-200',
  RESOLVED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  CLOSED: 'bg-slate-50 text-slate-600 border-slate-200'
};

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetch = async () => {
      try {
        const res = await serviceRequestsAPI.getAll();
        if (isMounted) setRequests(res.data?.data || []);
      } catch {
        if (isMounted) toast.error('Unable to load requests');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetch();
    return () => { isMounted = false; };
  }, []);

  const loadDetail = async (id) => {
    try {
      const res = await serviceRequestsAPI.getOne(id);
      setSelected(res.data?.data);
    } catch {
      toast.error('Unable to load request details');
    }
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-950 via-amber-900 to-orange-800 px-6 py-8 text-white shadow-xl md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.24),transparent_38%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
              My requests
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Service request history</h1>
            <p className="mt-3 text-sm leading-6 text-amber-50/85">Track the status of all your submitted service requests.</p>
          </div>
          <Link
            to="/resident/services"
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-amber-950 shadow-lg transition-transform hover:-translate-y-0.5"
          >
            Browse services
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-slate-900">No requests yet</p>
          <p className="mt-2 text-sm text-slate-500">Browse available services and submit your first request.</p>
          <Link to="/resident/services" className="mt-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white">
            Browse services
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            {requests.map((req) => (
              <button
                key={req._id}
                onClick={() => loadDetail(req._id)}
                className={`group w-full rounded-2xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${selected?._id === req._id ? 'border-amber-300 bg-amber-50 ring-2 ring-amber-200' : 'border-slate-200 bg-white hover:border-amber-200'}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{req.service?.name || 'Service request'}</p>
                    <p className="mt-1 font-mono text-xs text-amber-700">{req.trackingNumber}</p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[req.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    {req.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                {req.department?.name && (
                  <p className="mt-2 text-xs text-slate-500">Department: {req.department.name}</p>
                )}
              </button>
            ))}
          </div>

          <div className="h-fit rounded-2xl border border-amber-100 bg-white p-6 shadow-lg shadow-amber-50 lg:sticky lg:top-6">
            <div className="border-b border-slate-100 pb-4 mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Request details</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                {selected ? selected.service?.name : 'Select a request'}
              </h2>
            </div>

            {selected ? (
              <div className="space-y-4 text-sm">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Tracking number</p>
                  <p className="font-mono text-base font-bold text-amber-700">{selected.trackingNumber}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Status</p>
                    <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[selected.status] || ''}`}>
                      {selected.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Department</p>
                    <p className="mt-1 text-xs font-semibold text-slate-800">{selected.department?.name || '—'}</p>
                  </div>
                </div>

                {selected.assignedOfficer && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Assigned officer</p>
                    <p className="mt-1 text-xs font-semibold text-slate-800">{selected.assignedOfficer.fullName}</p>
                  </div>
                )}

                {selected.residentUpdates?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Status updates</p>
                    <div className="space-y-2">
                      {[...selected.residentUpdates].reverse().map((u, i) => (
                        <div key={i} className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[u.status] || ''}`}>
                              {u.status?.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</span>
                          </div>
                          {u.message && <p className="mt-2 text-xs text-slate-600">{u.message}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selected.resolution && (
                  <div className="rounded-xl border border-green-100 bg-green-50 p-3">
                    <p className="text-xs font-semibold text-green-700 mb-1">Resolution</p>
                    <p className="text-xs text-green-800">{selected.resolution}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Click a request on the left to view its full details and status history.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRequests;
