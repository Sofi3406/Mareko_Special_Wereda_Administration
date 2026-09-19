import React, { useEffect, useState } from 'react';
import { departmentsAPI, usersAPI, servicesAPI, serviceRequestsAPI, reportsAPI } from '../../services/api';
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

const EMPTY_FORM = { name: '', code: '', description: '', contactPhone: '', contactEmail: '', officeLocation: '' };

const DeptDetail = ({ dept }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [oRes, sRes, rqRes, rpRes] = await Promise.all([
          usersAPI.getAll({ role: 'officer', department: dept.name }),
          servicesAPI.getAll({ department: dept._id }),
          serviceRequestsAPI.getAll({ department: dept._id }),
          reportsAPI.getAll({ department: dept.name })
        ]);
        if (!mounted) return;
        setData({
          officers: oRes.data.data || [],
          services: sRes.data.data || [],
          requests: rqRes.data.data || [],
          reports: rpRes.data.data || []
        });
      } catch { /* non-fatal */ }
    };
    load();
    return () => { mounted = false; };
  }, [dept._id, dept.name]);

  if (!data) return <p className="text-sm text-slate-400 py-2">Loading details…</p>;

  const pendingReqs = data.requests.filter(r => r.status === 'SUBMITTED').length;
  const resolvedReqs = data.requests.filter(r => r.status === 'RESOLVED').length;
  const openIssues = data.reports.filter(r => r.status !== 'Resolved' && r.status !== 'Rejected').length;

  return (
    <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Officers', data.officers.length],
          ['Services', data.services.length],
          ['Requests', data.requests.length],
          ['Open Issues', openIssues]
        ].map(([label, val]) => (
          <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500 mb-2">Request workload</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span>Total</span><strong>{data.requests.length}</strong></div>
            <div className="flex justify-between"><span>Pending</span><strong className="text-amber-600">{pendingReqs}</strong></div>
            <div className="flex justify-between"><span>Resolved</span><strong className="text-green-600">{resolvedReqs}</strong></div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500 mb-2">Officers</p>
          {data.officers.length === 0 ? (
            <p className="text-xs text-slate-400">No officers assigned</p>
          ) : (
            <ul className="space-y-1">
              {data.officers.slice(0, 4).map(o => (
                <li key={o._id} className="text-xs text-slate-700 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                  {o.fullName}
                </li>
              ))}
              {data.officers.length > 4 && <li className="text-xs text-slate-400">+{data.officers.length - 4} more</li>}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500 mb-2">Services</p>
          {data.services.length === 0 ? (
            <p className="text-xs text-slate-400">No services defined</p>
          ) : (
            <ul className="space-y-1">
              {data.services.slice(0, 4).map(s => (
                <li key={s._id} className="text-xs text-slate-700 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                  {s.name}
                </li>
              ))}
              {data.services.length > 4 && <li className="text-xs text-slate-400">+{data.services.length - 4} more</li>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

const ManageDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await departmentsAPI.getAll({ includeInactive: 'true' });
      setDepartments(res.data?.data || []);
    } catch {
      toast.error('Unable to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and code are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await departmentsAPI.update(editing, form);
        toast.success('Department updated');
      } else {
        await departmentsAPI.create(form);
        toast.success('Department created');
      }
      setForm(EMPTY_FORM);
      setEditing(null);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to save department');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (dept) => {
    setEditing(dept._id);
    setForm({
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || '',
      contactPhone: dept.contactPhone || '',
      contactEmail: dept.contactEmail || '',
      officeLocation: dept.officeLocation || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleActive = async (dept) => {
    try {
      await departmentsAPI.update(dept._id, { isActive: !dept.isActive });
      toast.success(`Department ${dept.isActive ? 'deactivated' : 'activated'}`);
      fetchDepartments();
    } catch {
      toast.error('Unable to update department');
    }
  };

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Administration"
        title="Manage Departments"
        description="Create and manage Woreda departments. Click a department to view officers, services, and workload."
      />

      <PortalFormPanel title={editing ? 'Edit department' : 'Add new department'} onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <PortalField label="Department name *">
            <input className="input mt-0" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Health" />
          </PortalField>
          <PortalField label="Code *">
            <input className="input mt-0" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. HEALTH" />
          </PortalField>
          <PortalField label="Office location">
            <input className="input mt-0" value={form.officeLocation} onChange={e => setForm({ ...form, officeLocation: e.target.value })} />
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
            {saving ? 'Saving…' : editing ? 'Update department' : 'Add department'}
          </PortalPrimaryButton>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm(EMPTY_FORM); }} className="officer-btn officer-btn--outline">Cancel</button>
          )}
        </div>
      </PortalFormPanel>

      <PortalPanel title={`Departments (${departments.length})`}>
        {loading ? <PortalLoading /> : departments.length === 0 ? (
          <PortalEmpty message="No departments yet." />
        ) : (
          <div className="space-y-3">
            {departments.map(dept => (
              <div key={dept._id} className={`rounded-xl border ${dept.isActive ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-70'}`}>
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === dept._id ? null : dept._id)}
                      className="text-left"
                    >
                      <span className="font-semibold text-slate-900 hover:text-amber-700">{dept.name}</span>
                    </button>
                    <span className="officer-chip">{dept.code}</span>
                    {dept.officeLocation && <span className="text-xs text-slate-500">📍 {dept.officeLocation}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`officer-status ${dept.isActive ? 'officer-status--resolved' : 'officer-status--rejected'}`}>
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button type="button" onClick={() => handleEdit(dept)} className="officer-btn officer-btn--outline text-xs">Edit</button>
                    <button type="button" onClick={() => handleToggleActive(dept)} className="officer-btn officer-btn--outline text-xs">
                      {dept.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === dept._id ? null : dept._id)}
                      className="officer-btn officer-btn--outline text-xs"
                    >
                      {expanded === dept._id ? '▲ Hide' : '▼ Details'}
                    </button>
                  </div>
                </div>

                {/* Expandable detail */}
                {expanded === dept._id && (
                  <div className="px-5 pb-5">
                    <DeptDetail dept={dept} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </PortalPanel>
    </PortalPage>
  );
};

export default ManageDepartments;
