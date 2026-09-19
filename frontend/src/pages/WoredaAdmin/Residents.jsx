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
  PortalPanel
} from '../../components/portal/PortalPageShell';

const Residents = () => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchResidents = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll({ role: 'resident' });
      setResidents(res.data.data || []);
    } catch {
      toast.error('Unable to load residents');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await usersAPI.update(user._id, { isActive: !user.isActive });
      toast.success(`Account ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchResidents();
    } catch {
      toast.error('Unable to update account status');
    }
  };

  useEffect(() => { fetchResidents(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return residents;
    return residents.filter(r =>
      r.fullName?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.phone?.toLowerCase().includes(q)
    );
  }, [residents, search]);

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Woreda Administration"
        title="Residents"
        description="View and manage resident accounts in your woreda."
      />

      <PortalFormPanel title="Search residents">
        <PortalField label="Search by name, email or phone">
          <input
            className="input mt-0"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </PortalField>
      </PortalFormPanel>

      <PortalPanel title={`Residents (${filtered.length})`}>
        {loading ? (
          <PortalLoading />
        ) : filtered.length === 0 ? (
          <PortalEmpty message="No residents found." />
        ) : (
          <div className="officer-table-wrap overflow-x-auto">
            <table className="officer-table min-w-[700px]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Woreda</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r._id}>
                    <td>{r.fullName}</td>
                    <td>{r.email}</td>
                    <td>{r.phone || '—'}</td>
                    <td>{r.woreda || '—'}</td>
                    <td>
                      <span className={`officer-status ${r.isActive ? 'officer-status--resolved' : 'officer-status--pending'}`}>
                        {r.isActive ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(r)}
                        className="officer-btn officer-btn--outline"
                      >
                        {r.isActive ? 'Deactivate' : 'Activate'}
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

export default Residents;
