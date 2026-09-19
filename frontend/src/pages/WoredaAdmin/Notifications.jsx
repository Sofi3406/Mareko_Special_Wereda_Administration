import React, { useEffect, useState } from 'react';
import { notificationsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  PortalPage,
  PortalHero,
  PortalLoading,
  PortalEmpty,
  PortalPanel,
  PortalPrimaryButton
} from '../../components/portal/PortalPageShell';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.getMine();
      setNotifications(res.data.data || []);
    } catch {
      toast.error('Unable to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    setMarking(true);
    try {
      await notificationsAPI.markAllRead();
      toast.success('All notifications marked as read');
      fetchNotifications();
    } catch {
      toast.error('Unable to mark notifications as read');
    } finally {
      setMarking(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const unread = notifications.filter(n => !n.read).length;

  return (
    <PortalPage>
      <PortalHero
        eyebrow={user?.role === 'resident' ? 'Resident Portal' : 'Woreda Administration'}
        title="Notifications"
        description={`${unread} unread notification${unread !== 1 ? 's' : ''}.`}
        actions={
          unread > 0 && (
            <PortalPrimaryButton type="button" disabled={marking} onClick={handleMarkAllRead}>
              {marking ? 'Marking…' : 'Mark all as read'}
            </PortalPrimaryButton>
          )
        }
      />

      <PortalPanel title={`All notifications (${notifications.length})`}>
        {loading ? (
          <PortalLoading />
        ) : notifications.length === 0 ? (
          <PortalEmpty message="No notifications yet." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map(n => (
              <li
                key={n._id}
                className={`flex items-start gap-4 py-4 ${!n.read ? 'bg-amber-50/50' : ''}`}
              >
                <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${!n.read ? 'bg-amber-500' : 'bg-slate-200'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{n.message || n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>}
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {n.type && (
                  <span className="officer-chip shrink-0">{n.type}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </PortalPanel>
    </PortalPage>
  );
};

export default Notifications;
