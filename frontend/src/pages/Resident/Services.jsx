import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { servicesAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await servicesAPI.getAll({ search: search.trim() || undefined });
        if (isMounted) setServices(res.data?.data || []);
      } catch {
        if (isMounted) toast.error('Unable to load services');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetch();
    return () => { isMounted = false; };
  }, [search]);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-950 via-amber-900 to-orange-800 px-6 py-8 text-white shadow-xl md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.24),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.18),transparent_30%)]" />
        <div className="relative max-w-2xl">
          <p className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
            Citizen services
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Available services</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-amber-50/85">
            Browse all services offered by the Woreda administration. Select a service to view requirements and submit a request.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
        <input
          className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
          placeholder="Search services..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-slate-900">No services found</p>
          <p className="mt-2 text-sm text-slate-500">Try a different search term or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <div key={service._id} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-slate-900">{service.name}</h3>
                <span className="shrink-0 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  {service.department?.name || 'General'}
                </span>
              </div>
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{service.description}</p>
              {service.estimatedProcessingDays != null && (
                <p className="mt-3 text-xs text-slate-500">
                  Est. processing: <span className="font-semibold text-slate-700">{service.estimatedProcessingDays} day{service.estimatedProcessingDays !== 1 ? 's' : ''}</span>
                </p>
              )}
              <Link
                to={`/resident/services/${service._id}`}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
              >
                View & apply
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Services;
