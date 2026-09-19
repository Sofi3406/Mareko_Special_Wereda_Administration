import React, { useEffect, useMemo, useState } from 'react';
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
  PortalOutlineButton,
  PortalPanel
} from '../../components/portal/PortalPageShell';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [woredaFilter, setWoredaFilter] = useState('all');
  const [woredaOptions, setWoredaOptions] = useState(['all']);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'resident',
    woreda: '',
    department: '',
    customDepartment: '',
    accessCode: '',
    isActive: true
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (woredaFilter !== 'all') params.woreda = woredaFilter;
      const response = await usersAPI.getAll(Object.keys(params).length ? params : undefined);
      setUsers(response.data.data || []);
    } catch (error) {
      toast.error('Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchWoredaOptions = async () => {
    try {
      const response = await usersAPI.getAll();
      const woredas = [...new Set((response.data.data || []).map((user) => user.woreda).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b)
      );
      setWoredaOptions(['all', ...woredas]);
    } catch {
      // Keep defaults if woreda list cannot be loaded.
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user account?')) return;
    try {
      await usersAPI.delete(id);
      toast.success('User deleted successfully');
      fetchUsers();
      fetchWoredaOptions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to delete user');
    }
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'resident',
      woreda: user.woreda || '',
      department: user.department || '',
      customDepartment: user.customDepartment || '',
      accessCode: user.accessCode || '',
      isActive: user.isActive !== false
    });
  };

  const handleCloseEdit = () => {
    setEditingUser(null);
    setEditForm({
      fullName: '',
      email: '',
      phone: '',
      role: 'resident',
      woreda: '',
      department: '',
      customDepartment: '',
      accessCode: '',
      isActive: false
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editForm.fullName || !editForm.email || !editForm.role) {
      toast.error('Please complete required fields');
      return;
    }

    if ((editForm.role === 'resident' || editForm.role === 'woreda_admin') && !editForm.woreda) {
      toast.error('Woreda is required for this role');
      return;
    }

    if (editForm.role === 'officer' && !editForm.department) {
      toast.error('Department is required for officers');
      return;
    }

    if (editForm.role === 'officer' && editForm.department === 'Other' && !editForm.customDepartment) {
      toast.error('Custom department is required when department is Other');
      return;
    }

    if (editForm.role === 'officer' && !editForm.accessCode) {
      toast.error('Access code is required for officers');
      return;
    }

    const payload = {
      fullName: editForm.fullName,
      email: editForm.email,
      phone: editForm.phone,
      role: editForm.role,
      isActive: editForm.isActive
    };

    if (editForm.role === 'resident' || editForm.role === 'woreda_admin') {
      payload.woreda = editForm.woreda;
    }

    if (editForm.role === 'officer') {
      payload.department = editForm.department;
      payload.accessCode = editForm.accessCode;
      if (editForm.department === 'Other') {
        payload.customDepartment = editForm.customDepartment;
      }
    }

    try {
      await usersAPI.update(editingUser._id, payload);
      toast.success('User updated successfully');
      handleCloseEdit();
      fetchUsers();
      fetchWoredaOptions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to update user');
    }
  };

  const roleLabel = (role) => {
    if (role === 'super_admin') return 'Mareqo Special Wereda Super Admin';
    if (role === 'woreda_admin') return 'Woreda Admin';
    if (role === 'officer') return 'Officer';
    if (role === 'resident') return 'Resident';
    return role;
  };

  useEffect(() => {
    fetchWoredaOptions();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, woredaFilter]);

  const filteredUsers = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return users;

    return users.filter(
      (user) =>
        user.fullName?.toLowerCase().includes(needle) ||
        user.email?.toLowerCase().includes(needle) ||
        user.woreda?.toLowerCase().includes(needle) ||
        user.department?.toLowerCase().includes(needle)
    );
  }, [users, searchTerm]);

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Accounts"
        title="User management"
        description="View, filter, search, and manage all user accounts in the sub city."
      />

      <PortalFormPanel title="Find users">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PortalField label="Filter by role">
            <select
              className="input mt-0"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All roles</option>
              <option value="super_admin">Mareqo Special Wereda Super Admin</option>
              <option value="woreda_admin">Woreda Admin</option>
              <option value="officer">Officer</option>
              <option value="resident">Resident</option>
            </select>
          </PortalField>
          <PortalField label="Filter by woreda">
            <select
              className="input mt-0"
              value={woredaFilter}
              onChange={(e) => setWoredaFilter(e.target.value)}
            >
              {woredaOptions.map((woreda) => (
                <option key={woreda} value={woreda}>
                  {woreda === 'all' ? 'All woredas' : woreda}
                </option>
              ))}
            </select>
          </PortalField>
          <PortalField label="Search">
            <input
              className="input mt-0"
              placeholder="Name, email, woreda, department"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </PortalField>
        </div>
      </PortalFormPanel>

      <PortalPanel title={`Users (${filteredUsers.length})`}>
        {loading ? (
          <PortalLoading />
        ) : filteredUsers.length === 0 ? (
          <PortalEmpty message="No users found for the selected filters." />
        ) : (
          <div className="officer-table-wrap overflow-x-auto">
            <table className="officer-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Woreda</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className="officer-chip">{roleLabel(user.role)}</span>
                    </td>
                    <td>{user.woreda || '—'}</td>
                    <td>{user.department || '—'}</td>
                    <td>
                      <span
                        className={`officer-status ${
                          user.isActive ? 'officer-status--resolved' : 'officer-status--pending'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(user)}
                        className="officer-btn officer-btn--outline mr-2"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user._id)}
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

      {editingUser && (
        <div className="officer-modal-backdrop" role="dialog" aria-modal="true">
          <div className="officer-modal max-w-2xl">
            <div className="officer-modal__head">
              <h2 className="text-lg font-semibold text-slate-900">Edit user</h2>
              <PortalOutlineButton type="button" onClick={handleCloseEdit}>
                Close
              </PortalOutlineButton>
            </div>
            <form onSubmit={handleSaveEdit} className="officer-modal__body space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <PortalField label="Full name">
                  <input
                    className="input mt-0"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  />
                </PortalField>
                <PortalField label="Email">
                  <input
                    type="email"
                    className="input mt-0"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </PortalField>
                <PortalField label="Phone">
                  <input
                    className="input mt-0"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </PortalField>
                <PortalField label="Role">
                  <select
                    className="input mt-0"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  >
                    <option value="super_admin">Mareqo Special Wereda Super Admin</option>
                    <option value="woreda_admin">Woreda Admin</option>
                    <option value="officer">Officer</option>
                    <option value="resident">Resident</option>
                  </select>
                </PortalField>

                {(editForm.role === 'resident' || editForm.role === 'woreda_admin') && (
                  <PortalField label="Woreda">
                    <input
                      className="input mt-0"
                      value={editForm.woreda}
                      onChange={(e) => setEditForm({ ...editForm, woreda: e.target.value })}
                    />
                  </PortalField>
                )}

                {editForm.role === 'officer' && (
                  <>
                    <PortalField label="Department">
                      <select
                        className="input mt-0"
                        value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      >
                        <option value="">Select department</option>
                        <option value="Water">Water</option>
                        <option value="Road">Road</option>
                        <option value="Sanitation">Sanitation</option>
                        <option value="Electricity">Electricity</option>
                        <option value="Health">Health</option>
                        <option value="Other">Other</option>
                      </select>
                    </PortalField>
                    <PortalField label="Access code">
                      <input
                        className="input mt-0"
                        value={editForm.accessCode}
                        onChange={(e) => setEditForm({ ...editForm, accessCode: e.target.value })}
                      />
                    </PortalField>
                    {editForm.department === 'Other' && (
                      <div className="md:col-span-2">
                        <PortalField label="Custom department">
                          <input
                            className="input mt-0"
                            value={editForm.customDepartment}
                            onChange={(e) =>
                              setEditForm({ ...editForm, customDepartment: e.target.value })
                            }
                          />
                        </PortalField>
                      </div>
                    )}
                  </>
                )}

                <PortalField label="Account status">
                  <select
                    className="input mt-0"
                    value={editForm.isActive ? 'active' : 'pending'}
                    onChange={(e) =>
                      setEditForm({ ...editForm, isActive: e.target.value === 'active' })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                  </select>
                </PortalField>
              </div>
              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <PortalOutlineButton type="button" onClick={handleCloseEdit}>
                  Cancel
                </PortalOutlineButton>
                <PortalPrimaryButton type="submit">Save changes</PortalPrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalPage>
  );
};

export default UserManagement;
