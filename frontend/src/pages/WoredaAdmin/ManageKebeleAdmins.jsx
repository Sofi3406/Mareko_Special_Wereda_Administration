import React, { useEffect, useState } from 'react';
import { usersAPI, kelebesAPI } from '../../services/api';
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

const BLANK = { fullName: '', email: '', password: '', phone: '', kebele: '' };

const ManageKebeleAdmins = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [kebeles, setKebeles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll({ role: 'kebele_admin' });
      setAdmins(res.data.data || []);
    } catch {
      toast.error('Unable to load kebele admins');
    } finally {
      setLoading(false);
    }
  };

  const fetchKebeles = async () => {
    try {
      const res = await kelebesAPI.getAll();
      setKebeles(res.data.data || []);
    } catch { /* non-fatal */ }
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
        role: 'kebele_admin',
        woreda: user?.woreda,
        kebele: form.kebele || undefined
      });
      toast.success('Kebele admin created. They can log in immediately.');
      setForm(BLANK);
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to create kebele admin');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this kebele admin?')) return;
    try {
      await usersAPI.delete(id);
      toast.success('Kebele admin deleted');
      fetchAdmins();
    } catch {
      toast.error('Unable to delete kebele admin');
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

  useEffect(() => {
    fetchAdmins();
    fetchKebeles();
  }, [user?.woreda]); // eslint-disable-line

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Woreda Administration"
        title="Manage Kebele Administrators"
        description="Create Kebele Admin accounts. They can log in immediately with their email and password."
      />

      <PortalFormPanel title="Add kebele admin" onSubmit={handleCreate}>
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
          <PortalField label="Assign to kebele (optional)">
            <select
              className="input mt-0"
              value={form.kebele}
              onChange={e => setForm({ ...form, kebele: e.target.value })}
            >
              <option value="">Select kebele</option>
              {kebeles.map(k => (
                <option key={k._id} value={k._id}>{k.name}</option>
              ))}
            </select>
          </PortalField>
        </div>
        <PortalPrimaryButton type="submit">Create kebele admin</PortalPrimaryButton>
      </PortalFormPanel>

      <PortalPanel title={`Kebele admins (${admins.length})`}>
        {loading ? (
          <PortalLoading />
        ) : admins.length === 0 ? (
          <PortalEmpty message="No kebele admins yet." />
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

export default ManageKebeleAdmins;
