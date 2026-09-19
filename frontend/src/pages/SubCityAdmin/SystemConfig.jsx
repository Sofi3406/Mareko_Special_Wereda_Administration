import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  PortalPage,
  PortalHero,
  PortalFormPanel,
  PortalField,
  PortalPrimaryButton
} from '../../components/portal/PortalPageShell';

const SystemConfig = () => {
  const [general, setGeneral] = useState({
    platformName: 'Woreda Digital Administration Platform',
    supportEmail: '',
    maintenanceMode: false,
    defaultLanguage: 'en'
  });

  const [notifications, setNotifications] = useState({
    emailEnabled: true,
    smsEnabled: false,
    reportUpdateNotify: true,
    serviceRequestNotify: true,
    announcementNotify: true
  });

  const [security, setSecurity] = useState({
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    requireEmailVerification: true,
    twoFactorEnabled: false
  });

  const save = (section) => {
    // In production this would call a settings API endpoint
    toast.success(`${section} settings saved`);
  };

  return (
    <PortalPage>
      <PortalHero
        eyebrow="System Administration"
        title="System Configuration"
        description="Manage platform-wide settings, notifications, and security policies."
      />

      {/* General Settings */}
      <PortalFormPanel title="General Settings" onSubmit={e => { e.preventDefault(); save('General'); }}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PortalField label="Platform name">
            <input
              className="input mt-0"
              value={general.platformName}
              onChange={e => setGeneral({ ...general, platformName: e.target.value })}
            />
          </PortalField>
          <PortalField label="Support email">
            <input
              type="email"
              className="input mt-0"
              value={general.supportEmail}
              onChange={e => setGeneral({ ...general, supportEmail: e.target.value })}
            />
          </PortalField>
          <PortalField label="Default language">
            <select
              className="input mt-0"
              value={general.defaultLanguage}
              onChange={e => setGeneral({ ...general, defaultLanguage: e.target.value })}
            >
              <option value="en">English</option>
              <option value="am">Amharic</option>
            </select>
          </PortalField>
          <PortalField label="Maintenance mode">
            <select
              className="input mt-0"
              value={general.maintenanceMode ? 'on' : 'off'}
              onChange={e => setGeneral({ ...general, maintenanceMode: e.target.value === 'on' })}
            >
              <option value="off">Off</option>
              <option value="on">On (platform locked to admins only)</option>
            </select>
          </PortalField>
        </div>
        <PortalPrimaryButton type="submit">Save general settings</PortalPrimaryButton>
      </PortalFormPanel>

      {/* Notification Settings */}
      <PortalFormPanel title="Notification Settings" onSubmit={e => { e.preventDefault(); save('Notification'); }}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            ['Email notifications', 'emailEnabled'],
            ['SMS notifications', 'smsEnabled'],
            ['Report update alerts', 'reportUpdateNotify'],
            ['Service request alerts', 'serviceRequestNotify'],
            ['Announcement alerts', 'announcementNotify']
          ].map(([label, key]) => (
            <PortalField key={key} label={label}>
              <select
                className="input mt-0"
                value={notifications[key] ? 'on' : 'off'}
                onChange={e => setNotifications({ ...notifications, [key]: e.target.value === 'on' })}
              >
                <option value="on">Enabled</option>
                <option value="off">Disabled</option>
              </select>
            </PortalField>
          ))}
        </div>
        <PortalPrimaryButton type="submit">Save notification settings</PortalPrimaryButton>
      </PortalFormPanel>

      {/* Security Settings */}
      <PortalFormPanel title="Security Settings" onSubmit={e => { e.preventDefault(); save('Security'); }}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PortalField label="Session timeout (minutes)">
            <input
              type="number"
              className="input mt-0"
              min={5}
              max={480}
              value={security.sessionTimeoutMinutes}
              onChange={e => setSecurity({ ...security, sessionTimeoutMinutes: Number(e.target.value) })}
            />
          </PortalField>
          <PortalField label="Max login attempts before lockout">
            <input
              type="number"
              className="input mt-0"
              min={3}
              max={20}
              value={security.maxLoginAttempts}
              onChange={e => setSecurity({ ...security, maxLoginAttempts: Number(e.target.value) })}
            />
          </PortalField>
          <PortalField label="Require email verification">
            <select
              className="input mt-0"
              value={security.requireEmailVerification ? 'yes' : 'no'}
              onChange={e => setSecurity({ ...security, requireEmailVerification: e.target.value === 'yes' })}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </PortalField>
          <PortalField label="Two-factor authentication">
            <select
              className="input mt-0"
              value={security.twoFactorEnabled ? 'on' : 'off'}
              onChange={e => setSecurity({ ...security, twoFactorEnabled: e.target.value === 'on' })}
            >
              <option value="off">Disabled</option>
              <option value="on">Enabled</option>
            </select>
          </PortalField>
        </div>
        <PortalPrimaryButton type="submit">Save security settings</PortalPrimaryButton>
      </PortalFormPanel>
    </PortalPage>
  );
};

export default SystemConfig;
