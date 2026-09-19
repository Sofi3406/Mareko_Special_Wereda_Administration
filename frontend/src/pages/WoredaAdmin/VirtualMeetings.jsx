import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { meetingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const VirtualMeetings = () => {
  const { user } = useAuth();
  const canManageMeetings = user?.role === 'woreda_admin' || user?.role === 'super_admin';
  const isSubcityAdmin = user?.role === 'super_admin';
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMeetingId, setEditingMeetingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    date: '',
    woreda: '',
    participants: '',
    roles: [],
    description: '',
    link: ''
  });

  const resetForm = () => {
    setForm({
      title: '',
      date: '',
      woreda: '',
      participants: '',
      roles: [],
      description: '',
      link: ''
    });
    setEditingMeetingId(null);
  };

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const response = await meetingsAPI.getAll();
      setMeetings(response.data.data || []);
    } catch (error) {
      toast.error('Unable to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasEmailParticipants = Boolean(form.participants.trim());
    const hasRoleParticipants = form.roles.length > 0;

    if (!form.title || !form.date || !form.link || (!hasEmailParticipants && !hasRoleParticipants)) {
      toast.error('Please fill in all required fields');
      return;
    }

    const participantEmails = form.participants
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);

    try {
      const payload = {
        title: form.title,
        scheduledAt: form.date,
        woreda: isSubcityAdmin ? (form.woreda || 'All Woredas') : undefined,
        participantEmails,
        participantRoles: form.roles,
        description: form.description,
        meetingLink: form.link
      };

      if (editingMeetingId) {
        await meetingsAPI.update(editingMeetingId, payload);
        toast.success('Virtual meeting updated successfully');
      } else {
        await meetingsAPI.create(payload);
        toast.success('Virtual meeting scheduled successfully');
      }

      resetForm();
      fetchMeetings();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to schedule meeting');
    }
  };

  const handleEditMeeting = (meeting) => {
    setEditingMeetingId(meeting._id);
    setForm({
      title: meeting.title || '',
      date: meeting.scheduledAt ? new Date(meeting.scheduledAt).toISOString().slice(0, 16) : '',
      woreda: meeting.woreda || '',
      participants: meeting.participants
        ?.map((participant) => participant.email)
        .filter(Boolean)
        .join(', ') || '',
      roles: Array.from(new Set(
        (meeting.participants || [])
          .map((participant) => participant.role)
          .filter((role) => role === 'resident' || role === 'officer' || role === 'woreda_admin')
      )),
      description: meeting.description || '',
      link: meeting.meetingLink || ''
    });
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm('Delete this meeting?')) return;

    try {
      await meetingsAPI.delete(meetingId);
      toast.success('Meeting deleted successfully');
      fetchMeetings();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to delete meeting');
    }
  };

  const handleRoleToggle = (role) => {
    setForm((prev) => {
      if (role === 'all') {
        return {
          ...prev,
          roles: prev.roles.includes('all') ? [] : ['all']
        };
      }

      const baseRoles = prev.roles.filter((item) => item !== 'all');

      if (prev.roles.includes(role)) {
        return { ...prev, roles: baseRoles.filter((item) => item !== role) };
      }

      return { ...prev, roles: [...baseRoles, role] };
    });
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const getParticipantLabel = (participant) => participant.email || participant.role || 'Participant';

  const formatMeetingTime = (value) => {
    const date = new Date(value);
    return {
      day: date.toLocaleDateString(undefined, { day: '2-digit' }),
      month: date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
      full: date.toLocaleString()
    };
  };

  const isMeetingOwner = (meeting) => {
    const creatorId = typeof meeting.createdBy === 'object' ? meeting.createdBy?._id : meeting.createdBy;
    return String(creatorId || '') === String(user?._id || '');
  };

  const totalParticipants = meetings.reduce((count, meeting) => count + (meeting.participants?.length || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-950 via-amber-900 to-orange-800 px-6 py-8 text-white shadow-xl md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.24),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.18),transparent_30%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
              Meeting center
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Virtual meetings</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-amber-50/85 md:text-base">
          {canManageMeetings
            ? 'Schedule online discussions, notify participants, and manage existing meetings.'
            : 'Meetings you are invited to will appear here.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:min-w-[320px]">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-100/80">Meetings</p>
              <p className="mt-1 text-2xl font-semibold">{meetings.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-100/80">Participants</p>
              <p className="mt-1 text-2xl font-semibold">{totalParticipants}</p>
            </div>
          </div>
        </div>
      </div>

      {canManageMeetings && (
        <form onSubmit={handleSubmit} className="rounded-3xl border border-amber-100 bg-white p-6 shadow-lg shadow-amber-50 md:p-8">
          <div className="border-b border-slate-100 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Schedule meeting</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              {editingMeetingId ? 'Update an existing meeting' : 'Create a new virtual meeting'}
            </h2>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Meeting title</label>
              <input
                className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Community consultation"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Date & time</label>
              <input
                type="datetime-local"
                className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            {isSubcityAdmin && (
              <div>
                <label className="block text-sm font-semibold text-slate-700">Meeting scope</label>
                <input
                  className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                  placeholder="All Woredas or specific woreda"
                  value={form.woreda}
                  onChange={(e) => setForm({ ...form, woreda: e.target.value })}
                />
                <p className="mt-1 text-xs text-slate-500">Leave blank to create a system-wide meeting.</p>
              </div>
            )}

            <div className={isSubcityAdmin ? '' : 'md:col-span-2'}>
              <label className="block text-sm font-semibold text-slate-700">Participants</label>
              <input
                className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                placeholder="Comma-separated emails (optional if role buttons are selected)"
                value={form.participants}
                onChange={(e) => setForm({ ...form, participants: e.target.value })}
              />
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {[
                  { value: 'resident', label: 'Resident' },
                  { value: 'officer', label: 'Officer' },
                  { value: 'woreda_admin', label: 'Woreda Admin' },
                  { value: 'all', label: 'All' }
                ].map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleRoleToggle(role.value)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${form.roles.includes(role.value)
                      ? 'border-amber-600 bg-amber-600 text-white shadow-sm'
                      : 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Meeting link</label>
              <input
                className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                placeholder="https://meet.google.com/..."
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Description</label>
              <textarea
                rows="4"
                className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                placeholder="Add the agenda, purpose, or key topics to discuss"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-amber-200 transition-transform hover:-translate-y-0.5 hover:from-amber-500 hover:to-orange-500">
                  {editingMeetingId ? 'Update meeting' : 'Schedule meeting'}
                </button>
                {editingMeetingId && (
                  <button type="button" className="rounded-xl border border-amber-200 bg-white px-5 py-3 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-50" onClick={resetForm}>
                    Cancel edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-amber-600"></div>
        </div>
      ) : meetings.length === 0 ? (
        <div className="rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-lg shadow-amber-50">
          <p className="text-base font-medium text-slate-900">No meetings scheduled yet.</p>
          <p className="mt-2 text-sm text-slate-600">Create the first virtual meeting to invite participants and share the link.</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {meetings.map((meeting) => {
            const time = formatMeetingTime(meeting.scheduledAt);

            return (
              <div key={meeting._id} className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-lg shadow-amber-50 transition-shadow hover:shadow-xl">
                <div className="border-b border-amber-50 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-5 md:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600 to-orange-600 text-white shadow-md shadow-amber-200">
                        <span className="text-[11px] font-medium tracking-[0.18em]">{time.month}</span>
                        <span className="text-2xl font-semibold leading-none">{time.day}</span>
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-semibold text-slate-900">{meeting.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">{time.full}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                            Scope: {meeting.woreda || 'All Woredas'}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                            {meeting.participants?.length || 0} participants
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={meeting.meetingLink}
                      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-200 transition-transform hover:-translate-y-0.5 hover:from-amber-500 hover:to-orange-500"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Join meeting
                    </a>
                  </div>
                </div>

                <div className="space-y-5 p-5 md:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Participants</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(meeting.participants || []).length > 0 ? (
                        meeting.participants.map((participant, index) => (
                          <span
                            key={`${meeting._id}-participant-${index}`}
                            className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-medium text-slate-700"
                          >
                            {getParticipantLabel(participant)}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">No participants assigned.</span>
                      )}
                    </div>
                  </div>

                  {meeting.description && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-700">
                      {meeting.description}
                    </div>
                  )}

                  {canManageMeetings && isMeetingOwner(meeting) && (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleEditMeeting(meeting)}
                        className="inline-flex items-center rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-50"
                      >
                        Edit meeting
                      </button>
                      <button
                        onClick={() => handleDeleteMeeting(meeting._id)}
                        className="inline-flex items-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
                      >
                        Delete meeting
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VirtualMeetings;
