import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { servicesAPI, serviceRequestsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetch = async () => {
      try {
        const res = await servicesAPI.getOne(id);
        if (isMounted) setService(res.data?.data);
      } catch {
        if (isMounted) toast.error('Service not found');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetch();
    return () => { isMounted = false; };
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('service', id);
      formData.append('formData', JSON.stringify({ notes }));
      files.forEach((f) => formData.append('documents', f));
      const res = await serviceRequestsAPI.create(formData);
      const tracking = res.data?.data?.trackingNumber;
      toast.success(`Request submitted! Tracking: ${tracking}`);
      navigate('/resident/my-requests');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-10 text-center">
        <p className="text-lg font-semibold text-red-800">Service not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-950 via-amber-900 to-orange-800 px-6 py-8 text-white shadow-xl md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.24),transparent_38%)]" />
        <div className="relative">
          <p className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
            {service.department?.name || 'Citizen service'}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{service.name}</h1>
          {service.estimatedProcessingDays != null && (
            <p className="mt-2 text-sm text-amber-100/80">
              Estimated processing time: {service.estimatedProcessingDays} day{service.estimatedProcessingDays !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.1fr]">
        {/* Service info */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4">About this service</h2>
            <p className="text-sm leading-6 text-slate-600">{service.description}</p>
          </div>

          {service.requirements?.length > 0 && (
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900 mb-3">Requirements</h2>
              <ul className="space-y-2">
                {service.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {service.requiredDocuments?.length > 0 && (
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900 mb-3">Required documents</h2>
              <ul className="space-y-2">
                {service.requiredDocuments.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {service.procedure?.length > 0 && (
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900 mb-3">Process steps</h2>
              <ol className="space-y-3">
                {service.procedure.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {(service.officeLocation || service.contactPhone || service.contactEmail) && (
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900 mb-3">Contact & location</h2>
              <div className="space-y-2 text-sm text-slate-600">
                {service.officeLocation && <p>📍 {service.officeLocation}</p>}
                {service.contactPhone && <p>📞 {service.contactPhone}</p>}
                {service.contactEmail && <p>✉️ {service.contactEmail}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Request form */}
        <form onSubmit={handleSubmit} className="h-fit rounded-2xl border border-amber-100 bg-white p-6 shadow-lg shadow-amber-50">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Submit request</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Apply for this service</h2>
            <p className="mt-1 text-sm text-slate-500">You will receive a tracking number after submission.</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Additional notes (optional)</label>
              <textarea
                rows={4}
                className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                placeholder="Any additional information relevant to your request..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-4">
              <label className="block text-sm font-semibold text-slate-700">Attach documents (optional)</label>
              <input
                type="file"
                multiple
                className="mt-3 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-amber-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-amber-500"
                onChange={(e) => setFiles(Array.from(e.target.files))}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-amber-200 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Submitting...' : 'Submit request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceDetail;
