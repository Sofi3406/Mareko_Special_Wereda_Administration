import React, { useEffect, useState } from 'react';
import { resourcesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchResources = async () => {
    setLoading(true);
    try {
      if (!user) {
        setResources([]);
        toast.error('Please log in to view resources');
        return;
      }

      const response = await resourcesAPI.getAll();
      setResources(response.data.data || []);
    } catch (error) {
      toast.error('Unable to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (resource) => {
    try {
      if (!user) {
        toast.error('Please log in to download resources');
        return;
      }

      const response = await resourcesAPI.download(resource._id);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resource.fileName || 'resource';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Unable to download resource');
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-amber-200 bg-white px-4 py-3 shadow-sm">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
          <span className="text-sm font-medium text-slate-700">Loading resources…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 px-6 py-7 shadow-sm sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
              Community resources
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Resources
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Access official documents, guides, and notices in one place.
            </p>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-700">Available now</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{resources.length}</p>
          </div>
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-amber-200 bg-white/80 p-8 text-slate-600 shadow-sm">
          <div className="max-w-md">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h10l4 4v14H3V3h4z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 17h6M9 9h3" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">No resources yet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              New documents, guides, and notices will appear here when they’re published.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {resources.map((resource) => (
            <div
              key={resource._id}
              className="group flex flex-col rounded-3xl border border-amber-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    {resource.category || 'General'}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
                    {resource.title}
                  </h3>
                </div>
                <div className="rounded-2xl bg-amber-50 p-2 text-amber-700 transition-colors group-hover:bg-amber-100">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 17.5V19a2 2 0 002 2h10a2 2 0 002-2v-1.5" />
                  </svg>
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {resource.description || 'No description provided.'}
              </p>

              <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                <span>Official file</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                  Ready to download
                </span>
              </div>

              <button
                onClick={() => handleDownload(resource)}
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-amber-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Resources;
