import React, { useEffect, useState } from 'react';
import { usersAPI, departmentsAPI } from '../../services/api';
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

const BLANK = { fullName: '', email: '', password: '', department: '' };

const ManageOfficers = () => {
  const { user } = useAuth();
  const [officers, setOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK);

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll({ role: 'officer' });
      setOfficers(res.data.data || []);
    } catch {
      toast.error('Unable to load officers');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await departmentsAPI.getAll();
      setDepartments(res.data.data || []);
    } catch { /* non-fatal */ }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password || !form.department) {
      toast.error('All fields are required');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await usersAPI.create({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: 'officer',
        department: form.department,
        woreda: user?.woreda
      });
      toast.success('Officer added. They can log in immediately.');
      setForm(BLANK);
      fetchOfficers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to add officer');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this officer?')) return;
    try {
      await usersAPI.delete(id);
      toast.success('Officer deleted');
      fetchOfficers();
    } catch {
      toast.error('Unable to delete officer');
    }
  };

  const handleToggleActive = async (officer) => {
    try {
      await usersAPI.update(officer._id, { isActive: !officer.isActive });
      toast.success(`Account ${officer.isActive ? 'deactivated' : 'activated'}`);
      fetchOfficers();
    } catch {
      toast.error('Unable to update account status');
    }
  };

  useEffect(() => {
    fetchOfficers();
    fetchDepartments();
  }, [user?.woreda]); // eslint-disable-line

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Team management"
        title="Manage Department Officers"
        description="Add officers to departments. Officers can log in immediately with their email and password."
      />

      <PortalFormPanel title="Add new officer" onSubmit={handleCreate}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PortalField label="Full name">
            <input
              className="input mt-0"
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
            />
          </PortalField>
          <PortalField label="Email">
            <input
              type="email"
              className="input mt-0"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </PortalField>
          <PortalField label="Password">
            <input
              type="password"
              className="input mt-0"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </PortalField>
          <PortalField label="Department">
            {departments.length === 0 ? (
              <p className="mt-1 text-sm text-amber-600">
                No departments found. <a href="/woreda-admin/departments" className="underline">Add departments first.</a>
              </p>
            ) : (
              <select
                className="input mt-0"
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
              >
                <option value="">Select department</option>
                {departments.map(d => (
                  <option key={d._id} value={d.name}>{d.name}</option>
                ))}
              </select>
            )}
          </PortalField>
        </div>
        <PortalPrimaryButton type="submit">Add officer</PortalPrimaryButton>
      </PortalFormPanel>

      <PortalPanel title={`Officers (${officers.length})`}>
        {loading ? (
          <PortalLoading />
        ) : officers.length === 0 ? (
          <PortalEmpty message="No officers found for this woreda." />
        ) : (
          <div className="officer-table-wrap overflow-x-auto">
            <table className="officer-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {officers.map(officer => (
                  <tr key={officer._id}>
                    <td>{officer.fullName}</td>
                    <td>{officer.email}</td>
                    <td><span className="officer-chip">{officer.department || '—'}</span></td>
                    <td>
                      <span className={`officer-status ${officer.isActive ? 'officer-status--resolved' : 'officer-status--pending'}`}>
                        {officer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(officer)}
                        className="officer-btn officer-btn--outline mr-2"
                      >
                        {officer.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(officer._id)}
                        className="officer-btn officer-btn--danger-outline"
                      >
                        Delete
                      </button>
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

export default ManageOfficers;
