import React, { useEffect, useState } from 'react';
import { usersAPI } from '../../services/api';
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
import { MAREQO_WEREDA } from '../../utils/woredas';

const BLANK = { fullName: '', email: '', password: '', phone: '' };

const ManageWoredaAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll({ role: 'woreda_admin' });
      setAdmins(res.data.data || []);
    } catch {
      toast.error('Unable to load woreda admins');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      toast.error('Full name, email and password are required');
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
        phone: form.phone || undefined,
        role: 'woreda_admin',
        woreda: MAREQO_WEREDA
      });
      toast.success(`Woreda admin created. They can now log in with their email and password.`);
      setForm(BLANK);
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to create admin');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this woreda admin?')) return;
    try {
      await usersAPI.delete(id);
      toast.success('Woreda admin deleted');
      fetchAdmins();
    } catch {
      toast.error('Unable to delete admin');
    }
  };

  const handleToggleActive = async (admin) => {
    try {
      await usersAPI.update(admin._id, { isActive: !admin.isActive });
      toast.success(`Account ${admin.isActive ? 'deactivated' : 'activated'}`);
      fetchAdmins();
    } catch {
      toast.error('Unable to update account status');
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  return (
    <PortalPage>
      <PortalHero
        eyebrow="System Administration · Mareqo Wereda"
        title="Manage Woreda Administrators"
        description="Create Woreda Admin accounts. They can log in immediately with their email and password."
      />

      <PortalFormPanel title="Add woreda admin" onSubmit={handleCreate}>
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
          <PortalField label="Phone (optional)">
            <input
              className="input mt-0"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
          </PortalField>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Woreda: <strong>{MAREQO_WEREDA}</strong> — all woreda admins belong to this woreda.
        </div>
        <PortalPrimaryButton type="submit">Create woreda admin</PortalPrimaryButton>
      </PortalFormPanel>

      <PortalPanel title={`Woreda admins (${admins.length})`}>
        {loading ? (
          <PortalLoading />
        ) : admins.length === 0 ? (
          <PortalEmpty message="No woreda admins yet." />
        ) : (
          <div className="officer-table-wrap overflow-x-auto">
            <table className="officer-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin._id}>
                    <td>{admin.fullName}</td>
                    <td>{admin.email}</td>
                    <td>{admin.phone || '—'}</td>
                    <td>
                      <span className={`officer-status ${admin.isActive ? 'officer-status--resolved' : 'officer-status--pending'}`}>
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(admin)}
                        className="officer-btn officer-btn--outline mr-2"
                      >
                        {admin.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(admin._id)}
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

export default ManageWoredaAdmins;
