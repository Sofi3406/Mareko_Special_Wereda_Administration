import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { getMediaUrl } from '../../utils/media';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatAnnouncementTime = (value) => {
    const date = new Date(value);
    return {
      day: date.toLocaleDateString(undefined, { day: '2-digit' }),
      month: date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
      full: date.toLocaleString()
    };
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await publicAPI.getAnnouncements({ limit: 50 });
      setAnnouncements(response.data.data || []);
    } catch (error) {
      toast.error('Unable to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const announcementCount = announcements.length;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-950 via-amber-900 to-orange-800 px-6 py-8 text-white shadow-xl md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.26),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.20),transparent_30%)]" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
              <p className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">
              Community feed
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Public updates</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
              Latest announcements from your community administrators, presented in a cleaner and easier-to-scan layout.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:min-w-[280px] md:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Available posts</p>
              <p className="mt-1 text-2xl font-semibold">{announcementCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-100/80">Access</p>
              <p className="mt-1 text-sm font-medium text-amber-100">Public announcements</p>
            </div>
          </div>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">No announcements yet</p>
          <p className="mt-2 text-sm text-slate-500">Community updates will appear here when administrators publish them.</p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {announcements.map((item, index) => {
            const time = formatAnnouncementTime(item.createdAt);

            return (
              <article
                key={item._id}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-300" />
                <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-amber-100/50 blur-3xl transition-opacity group-hover:opacity-80" />

                {item.image && (
                  <div className="relative overflow-hidden bg-slate-100 aspect-[16/9]">
                    <img
                      src={getMediaUrl(item.image)}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="p-5 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="shrink-0 rounded-2xl bg-amber-950 px-3 py-2 text-white shadow-md shadow-amber-950/20">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100">{time.month}</span>
                        <span className="block text-2xl font-semibold leading-none">{time.day}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Update {index + 1}</p>
                        <h2 className="mt-1 truncate text-xl font-semibold text-slate-900">{item.title}</h2>
                        <p className="mt-1 text-xs text-slate-500">{time.full}</p>
                      </div>
                    </div>

                    <span className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      {item.category || 'General'}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-slate-600 md:text-[15px]">
                    {item.message}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      Posted by: {item.createdBy?.fullName || 'Admin'}
                    </span>
                    <span className="text-sm font-medium text-primary-600">
                      Community notice
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-slate-600">
          Check this page for official notices, service updates, and community-wide announcements.
        </p>
      </div>
    </div>
  );
};

export default Announcements;