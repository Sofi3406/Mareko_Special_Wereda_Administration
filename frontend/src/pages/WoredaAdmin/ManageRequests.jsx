import React, { useEffect, useState } from 'react';
import { serviceRequestsAPI, usersAPI, departmentsAPI, kelebesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  PortalPage,
  PortalHero,
  PortalLoading,
  PortalEmpty,
  PortalPanel,
  PortalField,
  PortalPrimaryButton,
  PortalOutlineButton
} from '../../components/portal/PortalPageShell';

const ALL_STATUSES = ['SUBMITTED','UNDER_REVIEW','ASSIGNED','IN_PROGRESS','WAITING_FOR_INFORMATION','RESOLVED','REJECTED','CLOSED'];

const TIMELINE_STEPS = ['SUBMITTED','UNDER_REVIEW','ASSIGNED','IN_PROGRESS','RESOLVED'];

const STATUS_COLOR = {
  SUBMITTED: 'officer-status--progress',
  UNDER_REVIEW: 'officer-status--pending',
  ASSIGNED: 'officer-status--pending',
  IN_PROGRESS: 'officer-status--progress',
  WAITING_FOR_INFORMATION: 'officer-status--pending',
  RESOLVED: 'officer-status--resolved',
  REJECTED: 'officer-status--rejected',
  CLOSED: 'officer-status--muted'
};

const ManageRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [kebeles, setKebeles] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({ status: '', message: '', assignedOfficer: '', resolution: '', internalNote: '' });

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [kebeleFilter, setKebeleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const canAssign = ['woreda_admin', 'super_admin'].includes(user?.role);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await serviceRequestsAPI.getAll(params);
      setRequests(res.data?.data || []);
    } catch {
      toast.error('Unable to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [statusFilter]); // eslint-disable-line

  useEffect(() => {
    const load = async () => {
      try {
        const [oRes, dRes, kRes] = await Promise.all([
          canAssign ? usersAPI.getAll({ role: 'officer' }) : Promise.resolve({ data: { data: [] } }),
          departmentsAPI.getAll(),
          kelebesAPI.getAll()
        ]);
        setOfficers(oRes.data?.data || []);
        setDepartments(dRes.data?.data || []);
        setKebeles(kRes.data?.data || []);
      } catch { /* non-fatal */ }
    };
    load();
  }, []); // eslint-disable-line

  const loadDetail = async (id) => {
    try {
      const res = await serviceRequestsAPI.getOne(id);
      const req = res.data?.data;
      setSelected(req);
      setUpdateForm({
        status: req.status || '',
        message: '',
        assignedOfficer: req.assignedOfficer?._id || req.assignedOfficer || '',
        resolution: req.resolution || '',
        internalNote: ''
      });
    } catch {
      toast.error('Unable to load request details');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setUpdating(true);
    try {
      const payload = {};
      if (updateForm.status !== selected.status) payload.status = updateForm.status;
      if (updateForm.message.trim()) payload.message = updateForm.message.trim();
      const prevOfficer = selected.assignedOfficer?._id || selected.assignedOfficer || '';
      if (updateForm.assignedOfficer !== prevOfficer) payload.assignedOfficer = updateForm.assignedOfficer || null;
      if (updateForm.resolution.trim()) payload.resolution = updateForm.resolution.trim();
      if (updateForm.internalNote.trim()) payload.internalNote = updateForm.internalNote.trim();

      await serviceRequestsAPI.update(selected._id, payload);
      toast.success('Request updated');
      fetchRequests();
      loadDetail(selected._id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to update request');
    } finally {
      setUpdating(false);
    }
  };

  // Client-side filter for search + dept + kebele
  const filtered = requests.filter(r => {
    if (deptFilter && r.department?.name !== deptFilter && r.department?._id !== deptFilter) return false;
    if (kebeleFilter && r.kebele?._id !== kebeleFilter && r.kebele !== kebeleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.trackingNumber?.toLowerCase().includes(q) &&
        !r.resident?.fullName?.toLowerCase().includes(q) &&
        !r.service?.name?.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const completedSteps = selected
    ? TIMELINE_STEPS.filter(s => {
        const idx = TIMELINE_STEPS.indexOf(s);
        const curIdx = TIMELINE_STEPS.indexOf(selected.status);
        return idx <= curIdx;
      })
    : [];

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Service Management"
        title="Service Requests"
        description="Review, assign, and update citizen service requests."
      />

      {/* Filters */}
      <div className="officer-form-panel">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PortalField label="Search">
            <input
              className="input mt-0"
              placeholder="ID, citizen name, service…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </PortalField>
          <PortalField label="Department">
            <select className="input mt-0" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">All departments</option>
              {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
            </select>
          </PortalField>
          <PortalField label="Kebele">
            <select className="input mt-0" value={kebeleFilter} onChange={e => setKebeleFilter(e.target.value)}>
              <option value="">All kebeles</option>
              {kebeles.map(k => <option key={k._id} value={k._id}>{k.name}</option>)}
            </select>
          </PortalField>
          <PortalField label="Status">
            <select className="input mt-0" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </PortalField>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        {/* List */}
        <PortalPanel title={`Requests (${filtered.length})`}>
          {loading ? <PortalLoading /> : filtered.length === 0 ? (
            <PortalEmpty message="No service requests found." />
          ) : (
            <div className="officer-table-wrap overflow-x-auto">
              <table className="officer-table min-w-[700px]">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Citizen</th>
                    <th>Service</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(req => (
                    <tr key={req._id} className={selected?._id === req._id ? 'bg-amber-50' : ''}>
                      <td className="font-mono text-xs text-amber-700">{req.trackingNumber}</td>
                      <td>{req.resident?.fullName || '—'}</td>
                      <td>{req.service?.name || '—'}</td>
                      <td>{req.department?.name || '—'}</td>
                      <td>
                        <span className={`officer-status ${STATUS_COLOR[req.status] || 'officer-status--muted'}`}>
                          {req.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="officer-btn officer-btn--outline text-xs"
                          onClick={() => loadDetail(req._id)}
                        >
                          View
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
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">Request details</p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">
              {selected ? `Request #${selected.trackingNumber}` : 'Select a request'}
            </h2>
          </div>

          {selected ? (
            <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Citizen', selected.resident?.fullName],
                  ['Service', selected.service?.name],
                  ['Kebele', selected.kebele?.name || '—'],
                  ['Submitted', new Date(selected.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
                  ['Department', selected.department?.name || '—'],
                  ['Officer', selected.assignedOfficer?.fullName || 'Unassigned']
                ].map(([label, val]) => (
                  <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-800">{val || '—'}</p>
                  </div>
                ))}
              </div>

              {/* Documents */}
              {selected.attachments?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={`/uploads/${att.filePath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="officer-btn officer-btn--outline text-xs"
                      >
                        📄 {att.fileName || `Document ${i + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Timeline</p>
                <ol className="space-y-2">
                  {TIMELINE_STEPS.map(step => {
                    const done = completedSteps.includes(step);
                    return (
                      <li key={step} className="flex items-center gap-3">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-green-500 text-white' : 'border-2 border-slate-300 text-slate-300'}`}>
                          {done ? '✓' : '○'}
                        </span>
                        <span className={`text-sm ${done ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                          {step.replace(/_/g, ' ')}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Update form */}
              <form onSubmit={handleUpdate} className="space-y-3 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Admin Actions</p>

                <PortalField label="Change status">
                  <select className="input mt-0" value={updateForm.status} onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })}>
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </PortalField>

                <PortalField label="Status message to citizen">
                  <input className="input mt-0" placeholder="Brief update…" value={updateForm.message} onChange={e => setUpdateForm({ ...updateForm, message: e.target.value })} />
                </PortalField>

                {canAssign && (
                  <PortalField label="Assign officer">
                    <select className="input mt-0" value={updateForm.assignedOfficer} onChange={e => setUpdateForm({ ...updateForm, assignedOfficer: e.target.value })}>
                      <option value="">Unassigned</option>
                      {officers.map(o => <option key={o._id} value={o._id}>{o.fullName} — {o.department}</option>)}
                    </select>
                  </PortalField>
                )}

                <PortalField label="Resolution">
                  <textarea rows={2} className="input mt-0" placeholder="How was this resolved?" value={updateForm.resolution} onChange={e => setUpdateForm({ ...updateForm, resolution: e.target.value })} />
                </PortalField>

                <PortalField label="Internal note (staff only)">
                  <textarea rows={2} className="input mt-0" placeholder="Internal notes…" value={updateForm.internalNote} onChange={e => setUpdateForm({ ...updateForm, internalNote: e.target.value })} />
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
              <p className="text-sm text-slate-500">Select a request from the list to view details.</p>
            </div>
          )}
        </div>
      </div>
    </PortalPage>
  );
};

export default ManageRequests;
