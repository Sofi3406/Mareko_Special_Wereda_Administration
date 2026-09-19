import React, { useEffect, useState } from 'react';
import { announcementsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { getMediaUrl } from '../../utils/media';
import {
  OfficerPage,
  OfficerHero,
  OfficerLoading,
  OfficerEmpty,
  OfficerFormPanel,
  OfficerField,
  OfficerPrimaryButton,
  OfficerOutlineButton
} from '../../components/officer/OfficerPageShell';

const AUDIENCE_ROLES = ['resident', 'officer', 'woreda_admin', 'super_admin', 'all'];

const formatAnnouncementTime = (value) => {
  const date = new Date(value);
  return {
    day: date.toLocaleDateString(undefined, { day: '2-digit' }),
    month: date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
    full: date.toLocaleString()
  };
};

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    category: 'General',
    audienceRoles: ['all'],
    image: null
  });

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await announcementsAPI.getAll();
      setAnnouncements(response.data.data || []);
    } catch (error) {
      toast.error('Unable to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('title', form.title.trim());
      payload.append('message', form.message.trim());
      payload.append('category', form.category);
      payload.append('audienceRoles', form.audienceRoles.join(','));
      if (form.image) {
        payload.append('image', form.image);
      }

      await announcementsAPI.create(payload);
      toast.success('Announcement published');
      setForm({ title: '', message: '', category: 'General', audienceRoles: ['all'], image: null });
      fetchAnnouncements();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to publish announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await announcementsAPI.delete(id);
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (error) {
      toast.error('Unable to delete announcement');
    }
  };

  const toggleAudience = (role) => {
    setForm((prev) => {
      if (prev.audienceRoles.includes(role)) {
        return { ...prev, audienceRoles: prev.audienceRoles.filter((item) => item !== role) };
      }
      return { ...prev, audienceRoles: [...prev.audienceRoles, role] };
    });
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <OfficerPage>
      <OfficerHero
        eyebrow="Community notices"
        title="Announcements"
        description="Publish official updates to residents and staff across your selected audience."
      />

      <OfficerFormPanel title="Publish new announcement" onSubmit={handleSubmit}>
        <OfficerField label="Title">
          <input
            className="input mt-0"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Announcement headline"
          />
        </OfficerField>

        <OfficerField label="Message">
          <textarea
            rows={5}
            className="input mt-0"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Write the full announcement message for your audience"
          />
        </OfficerField>

        <OfficerField label="Category">
          <input
            className="input mt-0"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </OfficerField>

        <OfficerField label="Announcement image (optional)">
          <div className="officer-file-drop">
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm text-slate-700"
              onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })}
            />
          </div>
          {form.image && (
            <p className="mt-2 text-xs font-medium text-amber-800">Selected: {form.image.name}</p>
          )}
        </OfficerField>

        <OfficerField label="Audience">
          <div className="mt-1 flex flex-wrap gap-2">
            {AUDIENCE_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => toggleAudience(role)}
                className={`officer-audience-btn ${form.audienceRoles.includes(role) ? 'is-active' : ''}`}
              >
                {role.replace('_', ' ')}
              </button>
            ))}
          </div>
        </OfficerField>

        <OfficerPrimaryButton type="submit" disabled={submitting}>
          {submitting ? 'Publishing…' : 'Publish announcement'}
        </OfficerPrimaryButton>
      </OfficerFormPanel>

      {loading ? (
        <OfficerLoading />
      ) : announcements.length === 0 ? (
        <OfficerEmpty message="No announcements published yet." />
      ) : (
        <div className="space-y-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800">
            Published ({announcements.length})
          </p>
          {announcements.map((item) => {
            const time = formatAnnouncementTime(item.createdAt);

            return (
              <article key={item._id} className="officer-announcement-card p-5 md:p-6">
                {item.image && (
                  <div className="mb-5 overflow-hidden rounded-xl border border-amber-100 bg-amber-50/40">
                    <img
                      src={getMediaUrl(item.image)}
                      alt={item.title}
                      className="max-h-56 w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="officer-date-badge">
                      <span className="officer-date-badge__month">{time.month}</span>
                      <span className="officer-date-badge__day">{time.day}</span>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
                      <p className="mt-1 text-xs text-slate-500">{time.full}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(item._id)}
                    className="officer-btn officer-btn--danger-outline shrink-0"
                  >
                    Delete
                  </button>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{item.message}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="officer-chip">Category: {item.category || 'General'}</span>
                  <span className="officer-chip officer-chip--muted">
                    Audience: {item.audienceRoles?.join(', ') || 'All'}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </OfficerPage>
  );
};

export default Announcements;
