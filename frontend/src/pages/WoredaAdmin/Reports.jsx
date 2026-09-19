import React, { useEffect, useMemo, useState } from 'react';
import { reportsAPI, usersAPI, departmentsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  PortalPage,
  PortalHero,
  PortalLoading,
  PortalEmpty,
  PortalPanel,
  PortalField,
  PortalPrimaryButton,
  PortalOutlineButton,
  statusToClass
} from '../../components/portal/PortalPageShell';

const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({ status: '', priority: '', department: '', assignedOfficer: '', updateMessage: '', resolution: '' });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const res = await reportsAPI.getAll(params);
      setReports(res.data.data || []);
    } catch {
      toast.error('Unable to load community issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [statusFilter, categoryFilter]); // eslint-disable-line

  useEffect(() => {
    const load = async () => {
      try {
        const [oRes, dRes] = await Promise.all([
          usersAPI.getAll({ role: 'officer' }),
          departmentsAPI.getAll()
        ]);
        setOfficers(oRes.data.data || []);
        setDepartments(dRes.data.data || []);
      } catch { /* non-fatal */ }
    };
    load();
  }, []);

  const handleSelect = (report) => {
    setSelected(report);
    setUpdateForm({
      status: report.status || 'Pending',
      priority: report.priority || 'Medium',
      department: report.department || '',
      assignedOfficer: report.assignedOfficer?._id || report.assignedOfficer || '',
      updateMessage: '',
      resolution: ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setUpdating(true);
    try {
      await reportsAPI.update(selected._id, {
        status: updateForm.status,
        priority: updateForm.priority,
        department: updateForm.department || undefined,
        assignedOfficer: updateForm.assignedOfficer || undefined,
        updateMessage: updateForm.updateMessage || undefined,
        resolution: updateForm.resolution || undefined
      });
      toast.success('Issue updated');
      fetchReports();
      setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to update issue');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return reports;
    const q = search.toLowerCase();
    return reports.filter(r =>
      r.title?.toLowerCase().includes(q) ||
      r.residentId?.fullName?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q)
    );
  }, [reports, search]);

  const categories = useMemo(() => [...new Set(reports.map(r => r.category).filter(Boolean))], [reports]);

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Woreda Administration"
        title="Community Issues"
        description="Review, verify, assign, and resolve community issues submitted in your woreda."
      />

      {/* Filters */}
      <div className="officer-form-panel">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PortalField label="Search">
            <input className="input mt-0" placeholder="Title, resident, category…" value={search} onChange={e => setSearch(e.target.value)} />
          </PortalField>
          <PortalField label="Status">
            <select className="input mt-0" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </PortalField>
          <PortalField label="Category">
            <select className="input mt-0" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="">All categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </PortalField>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        {/* List */}
        <PortalPanel title={`Issues (${filtered.length})`}>
          {loading ? <PortalLoading /> : filtered.length === 0 ? (
            <PortalEmpty message="No community issues found." />
          ) : (
            <div className="officer-table-wrap overflow-x-auto">
              <table className="officer-table min-w-[700px]">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Department</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r._id} className={selected?._id === r._id ? 'bg-amber-50' : ''}>
                      <td className="font-mono text-xs text-slate-500">{r._id.slice(-6).toUpperCase()}</td>
                      <td className="max-w-[180px] truncate">{r.title}</td>
                      <td><span className="officer-chip">{r.category}</span></td>
                      <td>{r.department || '—'}</td>
                      <td>
                        <span className={`officer-chip ${r.priority === 'High' ? 'bg-red-100 text-red-700' : r.priority === 'Low' ? 'bg-slate-100 text-slate-600' : ''}`}>
                          {r.priority || 'Medium'}
                        </span>
                      </td>
                      <td><span className={statusToClass(r.status)}>{r.status}</span></td>
                      <td className="text-right">
                        <button type="button" className="officer-btn officer-btn--outline text-xs" onClick={() => handleSelect(r)}>
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PortalPanel>

        {/* Detail panel */}
        <div className="h-fit rounded-xl border border-amber-100 bg-white shadow-lg overflow-hidden lg:sticky lg:top-6">
          <div className="border-b border-slate-100 bg-gradient-to-b from-amber-50 to-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">Issue details</p>
            <h2 className="mt-1 text-base font-semibold text-slate-900 truncate">
              {selected ? selected.title : 'Select an issue'}
            </h2>
          </div>

          {selected ? (
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Resident', selected.residentId?.fullName],
                  ['Category', selected.category],
                  ['Submitted', new Date(selected.createdAt).toLocaleDateString()],
                  ['Location', selected.location?.address || '—']
                ].map(([label, val]) => (
                  <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-800">{val || '—'}</p>
                  </div>
                ))}
              </div>

              {selected.description && (
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500 mb-1">Description</p>
                  <p className="text-sm text-slate-700">{selected.description}</p>
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-3 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Admin Actions</p>

                <div className="grid grid-cols-2 gap-3">
                  <PortalField label="Status">
                    <select className="input mt-0" value={updateForm.status} onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </PortalField>
                  <PortalField label="Priority">
                    <select className="input mt-0" value={updateForm.priority} onChange={e => setUpdateForm({ ...updateForm, priority: e.target.value })}>
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </PortalField>
                </div>

                <PortalField label="Assign department">
                  <select className="input mt-0" value={updateForm.department} onChange={e => setUpdateForm({ ...updateForm, department: e.target.value })}>
                    <option value="">Select department</option>
                    {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                  </select>
                </PortalField>

                <PortalField label="Assign officer">
                  <select className="input mt-0" value={updateForm.assignedOfficer} onChange={e => setUpdateForm({ ...updateForm, assignedOfficer: e.target.value })}>
                    <option value="">Unassigned</option>
                    {officers.map(o => <option key={o._id} value={o._id}>{o.fullName} — {o.department}</option>)}
                  </select>
                </PortalField>

                <PortalField label="Update message to citizen">
                  <input className="input mt-0" placeholder="Brief update…" value={updateForm.updateMessage} onChange={e => setUpdateForm({ ...updateForm, updateMessage: e.target.value })} />
                </PortalField>

                <PortalField label="Resolution">
                  <textarea rows={2} className="input mt-0" placeholder="How was this resolved?" value={updateForm.resolution} onChange={e => setUpdateForm({ ...updateForm, resolution: e.target.value })} />
                </PortalField>

                <div className="flex gap-2">
                  <PortalPrimaryButton type="submit" disabled={updating}>
                    {updating ? 'Saving…' : 'Save update'}
                  </PortalPrimaryButton>
                  <PortalOutlineButton type="button" onClick={() => setSelected(null)}>Close</PortalOutlineButton>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-5">
              <p className="text-sm text-slate-500">Select an issue to manage it.</p>
            </div>
          )}
        </div>
      </div>
    </PortalPage>
  );
};

export default Reports;
