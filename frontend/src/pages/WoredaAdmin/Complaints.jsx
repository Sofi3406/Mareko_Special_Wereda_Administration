import React, { useEffect, useMemo, useState } from 'react';
import { reportsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  PortalPage,
  PortalHero,
  PortalLoading,
  PortalEmpty,
  PortalFormPanel,
  PortalField,
  PortalPrimaryButton,
  PortalOutlineButton,
  PortalPanel,
  statusToClass
} from '../../components/portal/PortalPageShell';

const COMPLAINT_TYPES = ['Service complaint', 'Staff/service experience', 'Delay', 'Administrative complaint', 'Other'];
const FEEDBACK_TYPES = ['Suggestion', 'Appreciation', 'General feedback'];
const ALL_TYPES = [...COMPLAINT_TYPES, ...FEEDBACK_TYPES];
const STATUSES = ['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'];

const typeLabel = (type) => {
  if (COMPLAINT_TYPES.includes(type)) return { label: 'Complaint', cls: 'bg-red-100 text-red-700' };
  if (FEEDBACK_TYPES.includes(type)) return { label: 'Feedback', cls: 'bg-blue-100 text-blue-700' };
  return { label: type, cls: 'bg-slate-100 text-slate-600' };
};

const Complaints = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [updateMsg, setUpdateMsg] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      // Complaints & feedback are reports with customCategory matching our types
      const res = await reportsAPI.getAll({ category: 'Other' });
      setItems(res.data.data || []);
    } catch {
      toast.error('Unable to load complaints & feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter !== 'All') list = list.filter(c => c.status === statusFilter);
    if (typeFilter) list = list.filter(c => c.customCategory === typeFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(c =>
      c.title?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.residentId?.fullName?.toLowerCase().includes(q)
    );
    return list;
  }, [items, statusFilter, typeFilter, search]);

  const handleSelect = (c) => {
    setSelected(c);
    setNewStatus(c.status);
    setUpdateMsg('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await reportsAPI.update(selected._id, { status: newStatus, updateMessage: updateMsg });
      toast.success('Updated successfully');
      setSelected(null);
      fetchItems();
    } catch {
      toast.error('Unable to update');
    } finally {
      setSaving(false);
    }
  };

  const complaints = items.filter(i => COMPLAINT_TYPES.includes(i.customCategory));
  const feedback = items.filter(i => FEEDBACK_TYPES.includes(i.customCategory));

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Woreda Administration"
        title="Complaints & Feedback"
        description={`${complaints.length} complaints · ${feedback.length} feedback items`}
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ['Total', items.length, 'slate'],
          ['Complaints', complaints.length, 'red'],
          ['Feedback', feedback.length, 'blue'],
          ['Pending', items.filter(i => i.status === 'Pending').length, 'amber']
        ].map(([label, val, color]) => (
          <div key={label} className={`rounded-xl border p-4 ${color === 'red' ? 'border-red-200 bg-red-50' : color === 'blue' ? 'border-blue-200 bg-blue-50' : color === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{val}</p>
          </div>
        ))}
      </div>

      <PortalFormPanel title="Filter">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PortalField label="Status">
            <select className="input mt-0" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </PortalField>
          <PortalField label="Type">
            <select className="input mt-0" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">All types</option>
              <optgroup label="Complaints">
                {COMPLAINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </optgroup>
              <optgroup label="Feedback">
                {FEEDBACK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </optgroup>
            </select>
          </PortalField>
          <PortalField label="Search">
            <input className="input mt-0" placeholder="Title, description, resident…" value={search} onChange={e => setSearch(e.target.value)} />
          </PortalField>
        </div>
      </PortalFormPanel>

      <PortalPanel title={`Results (${filtered.length})`}>
        {loading ? <PortalLoading /> : filtered.length === 0 ? (
          <PortalEmpty message="No complaints or feedback found." />
        ) : (
          <div className="officer-table-wrap overflow-x-auto">
            <table className="officer-table min-w-[700px]">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Resident</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const { label, cls } = typeLabel(c.customCategory);
                  return (
                    <tr key={c._id}>
                      <td className="max-w-[180px] truncate">{c.title}</td>
                      <td><span className={`officer-chip ${cls}`}>{label}</span></td>
                      <td className="text-xs text-slate-500">{c.customCategory || '—'}</td>
                      <td>{c.residentId?.fullName || '—'}</td>
                      <td><span className={statusToClass(c.status)}>{c.status}</span></td>
                      <td className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="text-right">
                        <button type="button" className="officer-btn officer-btn--outline text-xs" onClick={() => handleSelect(c)}>
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PortalPanel>

      {selected && (
        <div className="officer-modal-backdrop" role="dialog" aria-modal="true">
          <div className="officer-modal max-w-2xl">
            <div className="officer-modal__head">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{selected.title}</h2>
                <span className={`officer-chip mt-1 ${typeLabel(selected.customCategory).cls}`}>
                  {typeLabel(selected.customCategory).label} · {selected.customCategory || 'Other'}
                </span>
              </div>
              <PortalOutlineButton type="button" onClick={() => setSelected(null)}>Close</PortalOutlineButton>
            </div>
            <div className="officer-modal__body space-y-4">
              <p className="text-sm text-slate-600">{selected.description}</p>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <span>Resident: <strong>{selected.residentId?.fullName || '—'}</strong></span>
                <span>·</span>
                <span>Submitted: <strong>{new Date(selected.createdAt).toLocaleString()}</strong></span>
                <span>·</span>
                <span>Current status: <strong>{selected.status}</strong></span>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <PortalField label="Update status">
                    <select className="input mt-0" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                      {['Pending', 'In Progress', 'Resolved', 'Rejected'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </PortalField>
                  <PortalField label="Response message">
                    <input className="input mt-0" placeholder="Message to resident…" value={updateMsg} onChange={e => setUpdateMsg(e.target.value)} />
                  </PortalField>
                </div>
                <div className="flex gap-3">
                  <PortalPrimaryButton type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Save update'}
                  </PortalPrimaryButton>
                  <PortalOutlineButton type="button" onClick={() => setSelected(null)}>Cancel</PortalOutlineButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </PortalPage>
  );
};

export default Complaints;
