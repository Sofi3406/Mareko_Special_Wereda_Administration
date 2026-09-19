import React, { useState } from 'react';
import {
  PortalPage,
  PortalHero,
  PortalPanel,
  PortalEmpty
} from '../../components/portal/PortalPageShell';

const ROLES = [
  {
    key: 'super_admin',
    label: 'System Administrator',
    description: 'Full platform access. Manages users, roles, system configuration, audit logs, and woreda setup.',
    color: 'bg-red-100 text-red-800 border-red-200',
    permissions: [
      'View all users across all woredas',
      'Create / edit / delete any user',
      'Assign and change user roles',
      'Manage departments and kebeles',
      'View and export audit logs',
      'Configure system settings',
      'View platform-wide analytics',
      'Manage all events and announcements',
      'Access all service requests and reports'
    ]
  },
  {
    key: 'woreda_admin',
    label: 'Woreda Administrator',
    description: 'Manages the administrative workflow within their assigned woreda.',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    permissions: [
      'View residents in their woreda',
      'Create and manage department officers',
      'Manage service requests and community issues',
      'Manage departments, kebeles, and services',
      'Create and manage events and announcements',
      'Upload and manage documents',
      'View woreda-scoped analytics',
      'Post public updates'
    ]
  },
  {
    key: 'officer',
    label: 'Department Officer',
    description: 'Handles reports and service requests assigned to their department.',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    permissions: [
      'View and update reports in their department',
      'Manage service requests assigned to them',
      'Upload resources and documents',
      'Post public updates',
      'View and register for events',
      'Participate in virtual meetings',
      'View announcements'
    ]
  },
  {
    key: 'kebele_admin',
    label: 'Kebele Administrator',
    description: 'Manages kebele-level citizen interactions and service requests.',
    color: 'bg-green-100 text-green-800 border-green-200',
    permissions: [
      'View residents in their kebele',
      'View and update service requests for their kebele',
      'View community issues in their kebele',
      'View announcements and events'
    ]
  },
  {
    key: 'resident',
    label: 'Resident (Citizen)',
    description: 'Citizens who use the platform to access services and report issues.',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    permissions: [
      'Browse and request government services',
      'Track their own service requests',
      'Submit and track community issue reports',
      'View public announcements and updates',
      'Register for events',
      'Join virtual meetings',
      'Download public documents',
      'Use the AI chatbot assistant'
    ]
  }
];

const RoleManagement = () => {
  const [expanded, setExpanded] = useState(null);

  return (
    <PortalPage>
      <PortalHero
        eyebrow="System Administration"
        title="Role & Permission Management"
        description="Overview of all platform roles and their associated permissions."
      />

      <PortalPanel title="Platform roles">
        {ROLES.length === 0 ? (
          <PortalEmpty message="No roles defined." />
        ) : (
          <div className="space-y-3">
            {ROLES.map(role => (
              <div
                key={role.key}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                {/* Header row */}
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(expanded === role.key ? null : role.key)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${role.color}`}>
                      {role.label}
                    </span>
                    <span className="text-sm text-slate-500 hidden sm:block">{role.description}</span>
                  </div>
                  <span className="text-slate-400 text-sm ml-4 shrink-0">
                    {expanded === role.key ? '▲ Hide' : '▼ Show'} permissions
                  </span>
                </button>

                {/* Permissions list */}
                {expanded === role.key && (
                  <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
                    <p className="mb-3 text-xs text-slate-500">{role.description}</p>
                    <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {role.permissions.map(p => (
                        <li key={p} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="mt-0.5 text-green-500 shrink-0">✓</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </PortalPanel>

      <PortalPanel title="Role assignment rules">
        <div className="officer-table-wrap overflow-x-auto">
          <table className="officer-table min-w-[560px]">
            <thead>
              <tr>
                <th>Role</th>
                <th>Can create</th>
                <th>Scope</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="officer-chip">System Admin</span></td>
                <td>Woreda Admins</td>
                <td>Platform-wide</td>
              </tr>
              <tr>
                <td><span className="officer-chip">Woreda Admin</span></td>
                <td>Department Officers</td>
                <td>Their woreda only</td>
              </tr>
              <tr>
                <td><span className="officer-chip">Officer</span></td>
                <td>—</td>
                <td>Their department only</td>
              </tr>
              <tr>
                <td><span className="officer-chip">Resident</span></td>
                <td>Self-registration</td>
                <td>Their own data only</td>
              </tr>
            </tbody>
          </table>
        </div>
      </PortalPanel>
    </PortalPage>
  );
};

export default RoleManagement;
