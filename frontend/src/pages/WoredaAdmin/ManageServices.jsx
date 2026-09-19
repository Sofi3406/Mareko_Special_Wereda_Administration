import React, { useEffect, useState } from 'react';
import { departmentsAPI, servicesAPI } from '../../services/api';
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

const EMPTY_FORM = {
  name: '', description: '', department: '',
  estimatedProcessingDays: '', officeLocation: '',
  contactPhone: '', contactEmail: '',
  requirements: '', requiredDocuments: '', procedure: ''
};

const ManageServices = () => {
  const [services, setServices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        servicesAPI.getAll({ includeInactive: 'true' }),
        departmentsAPI.getAll()
      ]);
      setServices(sRes.data?.data || []);
      setDepartments(dRes.data?.data || []);
    } catch {
      toast.error('Unable to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const splitLines = (val) => val.split('\n').map((s) => s.trim()).filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.department) {
      toast.error('Name, description and department are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        department: form.department,
        estimatedProcessingDays: form.estimatedProcessingDays ? Number(form.estimatedProcessingDays) : undefined,
        officeLocation: form.officeLocation.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        requirements: splitLines(form.requirements),
        requiredDocuments: splitLines(form.requiredDocuments),
        procedure: splitLines(form.procedure)
      };
      if (editing) {
        await servicesAPI.update(editing, payload);
        toast.success('Service updated');
      } else {
        await servicesAPI.create(payload);
        toast.success('Service created');
      }
      setForm(EMPTY_FORM);
      setEditing(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (svc) => {
    setEditing(svc._id);
    setForm({
      name: svc.name || '',
      description: svc.description || '',
      department: svc.department?._id || svc.department || '',
      estimatedProcessingDays: svc.estimatedProcessingDays ?? '',
      officeLocation: svc.officeLocation || '',
      contactPhone: svc.contactPhone || '',
      contactEmail: svc.contactEmail || '',
      requirements: (svc.requirements || []).join('\n'),
      requiredDocuments: (svc.requiredDocuments || []).join('\n'),
      procedure: (svc.procedure || []).join('\n')
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleActive = async (svc) => {
    try {
      await servicesAPI.update(svc._id, { isActive: !svc.isActive });
      toast.success(`Service ${svc.isActive ? 'deactivated' : 'activated'}`);
      fetchAll();
    } catch {
      toast.error('Unable to update service');
    }
  };

  const handleCancel = () => { setEditing(null); setForm(EMPTY_FORM); };

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Administration"
        title="Manage citizen services"
        description="Create and manage services that residents can apply for. Each service is linked to a department."
      />

      <PortalFormPanel title={editing ? 'Edit service' : 'Add new service'} onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PortalField label="Service name *">
            <input className="input mt-0" placeholder="e.g. Birth Certificate Request" {...f('name')} />
          </PortalField>
          <PortalField label="Department *">
            <select className="input mt-0" {...f('department')}>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </PortalField>
          <PortalField label="Estimated processing days">
            <input type="number" min="0" className="input mt-0" placeholder="e.g. 5" {...f('estimatedProcessingDays')} />
          </PortalField>
          <PortalField label="Office location">
            <input className="input mt-0" {...f('officeLocation')} />
          </PortalField>
          <PortalField label="Contact phone">
            <input className="input mt-0" {...f('contactPhone')} />
          </PortalField>
          <PortalField label="Contact email">
            <input type="email" className="input mt-0" {...f('contactEmail')} />
          </PortalField>
          <div className="md:col-span-2">
            <PortalField label="Description *">
              <textarea rows={3} className="input mt-0" {...f('description')} />
            </PortalField>
          </div>
          <PortalField label="Requirements (one per line)">
            <textarea rows={3} className="input mt-0" placeholder="Valid ID&#10;Proof of residence" {...f('requirements')} />
          </PortalField>
          <PortalField label="Required documents (one per line)">
            <textarea rows={3} className="input mt-0" placeholder="National ID copy&#10;Application form" {...f('requiredDocuments')} />
          </PortalField>
          <div className="md:col-span-2">
            <PortalField label="Procedure steps (one per line)">
              <textarea rows={4} className="input mt-0" placeholder="Submit application&#10;Wait for review&#10;Collect document" {...f('procedure')} />
            </PortalField>
          </div>
        </div>
        <div className="flex gap-3 mt-2">
          <PortalPrimaryButton type="submit" disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Update service' : 'Add service'}
          </PortalPrimaryButton>
          {editing && (
            <button type="button" onClick={handleCancel} className="officer-btn officer-btn--outline">Cancel</button>
          )}
        </div>
      </PortalFormPanel>

      <PortalPanel title={`Services (${services.length})`}>
        {loading ? (
          <PortalLoading />
        ) : services.length === 0 ? (
          <PortalEmpty message="No services yet. Add your first service above." />
        ) : (
          <div className="officer-table-wrap overflow-x-auto">
            <table className="officer-table min-w-[700px]">
              <thead>
                <tr>
                  <th>Service name</th>
                  <th>Department</th>
                  <th>Processing days</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => (
                  <tr key={svc._id}>
                    <td>{svc.name}</td>
                    <td><span className="officer-chip">{svc.department?.name || '—'}</span></td>
                    <td>{svc.estimatedProcessingDays != null ? `${svc.estimatedProcessingDays} days` : '—'}</td>
                    <td>
                      <span className={`officer-status ${svc.isActive ? 'officer-status--resolved' : 'officer-status--rejected'}`}>
                        {svc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => handleEdit(svc)} className="officer-btn officer-btn--outline text-xs px-3 py-1">Edit</button>
                        <button type="button" onClick={() => handleToggleActive(svc)} className="officer-btn officer-btn--outline text-xs px-3 py-1">
                          {svc.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PortalPanel>
    </PortalPage>
  );
};

export default ManageServices;
