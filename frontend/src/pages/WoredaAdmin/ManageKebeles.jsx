import React, { useEffect, useState } from 'react';
import { kelebesAPI, usersAPI, serviceRequestsAPI, reportsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  PortalPage,
  PortalHero,
  PortalLoading,
  PortalEmpty,
  PortalFormPanel,
  PortalField,
  PortalPrimaryButton,
  PortalPanel
} from '../../components/portal/PortalPageShell';

const EMPTY_FORM = { name: '', code: '', description: '', contactPhone: '', contactEmail: '' };

const KebeleCard = ({ kebele, onEdit, onToggle }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await kelebesAPI.getStats(kebele._id);
        if (mounted) setStats(res.data.data);
      } catch { /* non-fatal */ }
    };
    load();
    return () => { mounted = false; };
  }, [kebele._id]);

  return (
    <div className={`rounded-xl border p-5 ${kebele.isActive ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-70'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{kebele.name}</h3>
          <span className="officer-chip mt-1">{kebele.code}</span>
        </div>
        <span className={`officer-status ${kebele.isActive ? 'officer-status--resolved' : 'officer-status--rejected'}`}>
          {kebele.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {kebele.description && (
        <p className="mt-2 text-xs text-slate-500">{kebele.description}</p>
      )}

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          ['Residents', stats?.residents ?? '…'],
          ['Requests', stats?.serviceRequests ?? '…'],
          ['Issues', stats?.reports ?? '…'],
          ['Complaints', stats?.complaints ?? '…']
        ].map(([label, val]) => (
          <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-lg font-bold text-slate-900">{val}</p>
          </div>
        ))}
      </div>

      {kebele.contactPhone && (
        <p className="mt-3 text-xs text-slate-500">📞 {kebele.contactPhone}</p>
      )}

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => onEdit(kebele)} className="officer-btn officer-btn--outline text-xs flex-1">Edit</button>
        <button type="button" onClick={() => onToggle(kebele)} className="officer-btn officer-btn--outline text-xs flex-1">
          {kebele.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  );
};

const ManageKebeles = () => {
  const { user } = useAuth();
  const [kebeles, setKebeles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchKebeles = async () => {
    setLoading(true);
    try {
      const params = { includeInactive: 'true' };
      if (user?.woreda && user.role !== 'super_admin') params.woreda = user.woreda;
      const res = await kelebesAPI.getAll(params);
      setKebeles(res.data?.data || []);
    } catch {
      toast.error('Unable to load kebeles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKebeles(); }, [user?.woreda]); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and code are required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, woreda: user?.woreda || 'Mareqo Wereda' };
      if (editing) {
        await kelebesAPI.update(editing, payload);
        toast.success('Kebele updated');
      } else {
        await kelebesAPI.create(payload);
        toast.success('Kebele created');
      }
      setForm(EMPTY_FORM);
      setEditing(null);
      fetchKebeles();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to save kebele');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (kebele) => {
    setEditing(kebele._id);
    setForm({
      name: kebele.name || '',
      code: kebele.code || '',
      description: kebele.description || '',
      contactPhone: kebele.contactPhone || '',
      contactEmail: kebele.contactEmail || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleActive = async (kebele) => {
    try {
      await kelebesAPI.update(kebele._id, { isActive: !kebele.isActive });
      toast.success(`Kebele ${kebele.isActive ? 'deactivated' : 'activated'}`);
      fetchKebeles();
    } catch {
      toast.error('Unable to update kebele');
    }
  };

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Administration"
        title="Manage Kebeles"
        description="Create and manage kebeles. Each card shows live resident, request, issue, and complaint counts."
      />

      <PortalFormPanel title={editing ? 'Edit kebele' : 'Add new kebele'} onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <PortalField label="Kebele name *">
            <input className="input mt-0" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kebele 01" />
          </PortalField>
          <PortalField label="Code *">
            <input className="input mt-0" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. KB01" />
          </PortalField>
          <PortalField label="Contact phone">
            <input className="input mt-0" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} />
          </PortalField>
          <PortalField label="Contact email">
            <input type="email" className="input mt-0" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} />
          </PortalField>
          <PortalField label="Description">
            <input className="input mt-0" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </PortalField>
        </div>
        <div className="flex gap-3">
          <PortalPrimaryButton type="submit" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Update kebele' : 'Add kebele'}
          </PortalPrimaryButton>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm(EMPTY_FORM); }} className="officer-btn officer-btn--outline">
              Cancel
            </button>
          )}
        </div>
      </PortalFormPanel>

      {loading ? <PortalLoading /> : kebeles.length === 0 ? (
        <PortalEmpty message="No kebeles yet. Add your first kebele above." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kebeles.map(kebele => (
            <KebeleCard
              key={kebele._id}
              kebele={kebele}
              onEdit={handleEdit}
              onToggle={handleToggleActive}
            />
          ))}
        </div>
      )}
    </PortalPage>
  );
};

export default ManageKebeles;
