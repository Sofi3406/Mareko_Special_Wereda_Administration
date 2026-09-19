import React, { useEffect, useMemo, useState } from 'react';
import { reportsAPI, serviceRequestsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const COMPLAINT_TYPES = ['Service complaint', 'Staff/service experience', 'Delay', 'Administrative complaint', 'Other'];
const FEEDBACK_TYPES = ['Suggestion', 'Appreciation', 'General feedback'];

const ComplaintsFeedback = () => {
  const [mode, setMode] = useState('complaint');
  const [type, setType] = useState(COMPLAINT_TYPES[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [relatedRequest, setRelatedRequest] = useState('');
  const [requests, setRequests] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const types = mode === 'complaint' ? COMPLAINT_TYPES : FEEDBACK_TYPES;
  const classifiedSubmissions = useMemo(
    () => submissions.filter((item) => [...COMPLAINT_TYPES, ...FEEDBACK_TYPES].includes(item.customCategory)),
    [submissions]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [reportsResponse, requestsResponse] = await Promise.all([
          reportsAPI.getMyReports(),
          serviceRequestsAPI.getAll({ limit: 100 })
        ]);
        setSubmissions(reportsResponse.data?.data || []);
        setRequests(requestsResponse.data?.data || []);
      } catch {
        toast.error('Unable to load your submissions');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setType(nextMode === 'complaint' ? COMPLAINT_TYPES[0] : FEEDBACK_TYPES[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Please provide a title and description');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', 'Other');
      formData.append('customCategory', type);
      if (relatedRequest) formData.append('relatedRequest', relatedRequest);
      await reportsAPI.create(formData);
      toast.success(`${mode === 'complaint' ? 'Complaint' : 'Feedback'} submitted`);
      setTitle('');
      setDescription('');
      setRelatedRequest('');
      const response = await reportsAPI.getMyReports();
      setSubmissions(response.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-8">
      <div className="rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-950 via-amber-900 to-orange-800 px-6 py-8 text-white shadow-xl md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">Resident Portal</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Complaints and feedback</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-50/85">Share an administrative concern, suggestion, or appreciation with the Woreda.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
          <div className="flex gap-2 border-b border-slate-100 pb-4">
            {['complaint', 'feedback'].map((option) => (
              <button key={option} type="button" onClick={() => handleModeChange(option)} className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize ${mode === option ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:bg-slate-50'}`}>
                {option}
              </button>
            ))}
          </div>
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">Category
              <select value={type} onChange={(event) => setType(event.target.value)} className="mt-2 w-full rounded-xl border border-amber-200 px-4 py-3 font-normal outline-none focus:ring-4 focus:ring-amber-100">
                {types.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-amber-200 px-4 py-3 font-normal outline-none focus:ring-4 focus:ring-amber-100" required />
            </label>
            {mode === 'complaint' && (
              <label className="block text-sm font-semibold text-slate-700">Related request (optional)
                <select value={relatedRequest} onChange={(event) => setRelatedRequest(event.target.value)} className="mt-2 w-full rounded-xl border border-amber-200 px-4 py-3 font-normal outline-none focus:ring-4 focus:ring-amber-100">
                  <option value="">Not related to a request</option>
                  {requests.map((request) => <option key={request._id} value={request._id}>{request.trackingNumber} - {request.service?.name || 'Service request'}</option>)}
                </select>
              </label>
            )}
            <label className="block text-sm font-semibold text-slate-700">Description
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={6} className="mt-2 w-full rounded-xl border border-amber-200 px-4 py-3 font-normal outline-none focus:ring-4 focus:ring-amber-100" required />
            </label>
            <button disabled={submitting} className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {submitting ? 'Submitting...' : `Submit ${mode}`}
            </button>
          </div>
        </form>

        <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">My submissions</h2>
          {loading ? <p className="mt-5 text-sm text-slate-500">Loading...</p> : classifiedSubmissions.length === 0 ? <p className="mt-5 text-sm text-slate-500">You have no complaints or feedback yet.</p> : (
            <div className="mt-5 space-y-3">
              {classifiedSubmissions.map((item) => (
                <div key={item._id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3"><p className="font-semibold text-slate-900">{item.title}</p><span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{item.status}</span></div>
                  <p className="mt-1 text-xs text-slate-500">{item.customCategory} - {new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ComplaintsFeedback;
