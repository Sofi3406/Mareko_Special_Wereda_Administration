import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebarLayout } from '../../context/SidebarLayoutContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentArrowUpIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  MegaphoneIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

const SidebarShell = ({ title, subtitle, children, onLogout }) => {
  const sidebarLayout = useSidebarLayout();

  const handleLogout = () => {
    sidebarLayout?.close();
    onLogout();
  };

  return (
  <div className="relative w-64 max-w-[85vw] bg-stone-900 text-amber-50 h-full flex flex-col border-r border-amber-900/30 overflow-y-auto">
    {sidebarLayout && (
      <button
        type="button"
        onClick={sidebarLayout.close}
        className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-amber-100/80 hover:bg-stone-800 hover:text-amber-50 lg:hidden"
        aria-label="Close menu"
      >
        <XMarkIcon className="h-6 w-6" />
      </button>
    )}
    {title && (
      <div className="px-4 pt-4 pb-2 pr-12 border-b border-amber-900/20 lg:pr-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-amber-300">{title}</h2>
        {subtitle && <p className="text-xs text-amber-100/50 mt-0.5">{subtitle}</p>}
      </div>
    )}
    <nav className="mt-3 px-2 space-y-0.5 flex-1">
      {children}
    </nav>
    <div className="px-2 pb-4 pt-2 border-t border-amber-900/20">
      <button
        type="button"
        onClick={handleLogout}
        className="group flex w-full items-center px-3 py-2 text-sm font-semibold rounded-md text-red-300 hover:bg-red-700/80 hover:text-white"
      >
        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
        Logout
      </button>
    </div>
  </div>
  );
};

const NavItem = ({ to, icon: Icon, label }) => {
  const sidebarLayout = useSidebarLayout();

  return (
  <NavLink
    to={to}
    onClick={() => sidebarLayout?.close()}
    className={({ isActive }) =>
      `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
        isActive
          ? 'bg-amber-900/35 text-amber-50'
          : 'text-amber-100/80 hover:bg-stone-800 hover:text-amber-50'
      }`
    }
  >
    <Icon className="mr-3 h-5 w-5 shrink-0" />
    {label}
  </NavLink>
  );
};

const NavGroup = ({ label }) => (
  <p className="mt-4 mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-amber-500/60">
    {label}
  </p>
);

/* ─── Resident ─── */
const ResidentSidebar = ({ onLogout }) => (
  <SidebarShell title="Citizen Portal" onLogout={onLogout}>
    <NavItem to="/resident/dashboard" icon={HomeIcon} label="Dashboard" />
    <NavItem to="/resident/services" icon={ClipboardDocumentListIcon} label="Browse Services" />
    <NavItem to="/resident/my-requests" icon={DocumentArrowUpIcon} label="My Requests" />
    <NavItem to="/resident/reports" icon={DocumentTextIcon} label="My Issues" />
    <NavItem to="/resident/reports/new" icon={DocumentArrowUpIcon} label="Report Issue" />
    <NavItem to="/resident/complaints-feedback" icon={DocumentTextIcon} label="Complaints & Feedback" />
    <NavItem to="/resident/announcements" icon={MegaphoneIcon} label="Announcements" />
    <NavItem to="/resident/events" icon={CalendarIcon} label="Events" />
    <NavItem to="/resident/public-updates" icon={DocumentTextIcon} label="Public Updates" />
    <NavItem to="/resident/resources" icon={FolderIcon} label="Documents" />
    <NavItem to="/resident/meetings" icon={CalendarIcon} label="Virtual Meetings" />
    <NavItem to="/resident/notifications" icon={BellIcon} label="Notifications" />
    <NavItem to="/profile/edit" icon={UserCircleIcon} label="Edit Profile" />
  </SidebarShell>
);

/* ─── Officer ─── */
const OfficerSidebar = ({ onLogout }) => (
  <SidebarShell title="Department Officer" onLogout={onLogout}>
    <NavItem to="/officer/dashboard" icon={HomeIcon} label="Dashboard" />
    <NavItem to="/officer/reports" icon={DocumentTextIcon} label="Manage Issues" />
    <NavItem to="/officer/service-requests" icon={ClipboardDocumentListIcon} label="Service Requests" />
    <NavItem to="/officer/resources" icon={DocumentArrowUpIcon} label="Upload Documents" />
    <NavItem to="/officer/updates" icon={DocumentTextIcon} label="Post Updates" />
    <NavItem to="/officer/announcements" icon={MegaphoneIcon} label="Announcements" />
    <NavItem to="/officer/events" icon={CalendarIcon} label="Events" />
    <NavItem to="/officer/meetings" icon={CalendarIcon} label="Virtual Meetings" />
    <NavItem to="/profile/edit" icon={UserCircleIcon} label="Edit Profile" />
  </SidebarShell>
);

/* ─── Woreda Admin ─── */
const WoredaAdminSidebar = ({ onLogout }) => (
  <SidebarShell title="Woreda Administrator" onLogout={onLogout}>
    <NavItem to="/woreda-admin/dashboard" icon={HomeIcon} label="Dashboard" />

    <NavGroup label="Citizens" />
    <NavItem to="/woreda-admin/residents" icon={UserGroupIcon} label="Residents" />

    <NavGroup label="Requests & Issues" />
    <NavItem to="/woreda-admin/service-requests" icon={ClipboardDocumentListIcon} label="Service Requests" />
    <NavItem to="/woreda-admin/reports" icon={DocumentTextIcon} label="Community Issues" />
    <NavItem to="/woreda-admin/complaints" icon={DocumentTextIcon} label="Complaints & Feedback" />

    <NavGroup label="Administration" />
    <NavItem to="/woreda-admin/departments" icon={BuildingOffice2Icon} label="Departments" />
    <NavItem to="/woreda-admin/officers" icon={UserGroupIcon} label="Department Officers" />
    <NavItem to="/woreda-admin/kebele-admins" icon={UserGroupIcon} label="Kebele Admins" />
    <NavItem to="/woreda-admin/kebeles" icon={UserGroupIcon} label="Kebeles" />
    <NavItem to="/woreda-admin/services" icon={Cog6ToothIcon} label="Services" />

    <NavGroup label="Communication" />
    <NavItem to="/woreda-admin/events" icon={CalendarIcon} label="Events & Meetings" />
    <NavItem to="/woreda-admin/announcements" icon={MegaphoneIcon} label="Announcements" />
    <NavItem to="/woreda-admin/resources" icon={FolderIcon} label="Documents" />
    <NavItem to="/woreda-admin/notifications" icon={BellIcon} label="Notifications" />

    <NavGroup label="Insights" />
    <NavItem to="/woreda-admin/analytics" icon={ChartBarIcon} label="Reports & Analytics" />
    <NavItem to="/woreda-admin/activity-log" icon={DocumentTextIcon} label="Activity Log" />

    <NavItem to="/profile/edit" icon={UserCircleIcon} label="Edit Profile" />
  </SidebarShell>
);

/* ─── Mareko Special Wereda Super Admin ─── */
const SubCityAdminSidebar = ({ onLogout }) => (
  <SidebarShell title="System Administrator" subtitle="Woreda Digital Administration" onLogout={onLogout}>
    <NavItem to="/subcity-admin/dashboard" icon={HomeIcon} label="Dashboard" />

    <NavGroup label="User Management" />
    <NavItem to="/subcity-admin/users" icon={UserGroupIcon} label="All Users" />
    <NavItem to="/subcity-admin/admins" icon={ShieldCheckIcon} label="Woreda Admins" />

    <NavGroup label="Woreda Management" />
    <NavItem to="/subcity-admin/departments" icon={BuildingOffice2Icon} label="Departments" />
    <NavItem to="/subcity-admin/kebeles" icon={UserGroupIcon} label="Kebeles" />

    <NavGroup label="Content" />
    <NavItem to="/subcity-admin/reports" icon={DocumentTextIcon} label="All Issues" />
    <NavItem to="/subcity-admin/service-requests" icon={ClipboardDocumentListIcon} label="Service Requests" />
    <NavItem to="/subcity-admin/services" icon={Cog6ToothIcon} label="Services" />
    <NavItem to="/subcity-admin/events" icon={CalendarIcon} label="Events" />
    <NavItem to="/subcity-admin/announcements" icon={MegaphoneIcon} label="Announcements" />

    <NavGroup label="System" />
    <NavItem to="/subcity-admin/roles" icon={ShieldCheckIcon} label="Roles & Permissions" />
    <NavItem to="/subcity-admin/audit-logs" icon={DocumentTextIcon} label="Audit Logs" />
    <NavItem to="/subcity-admin/system-config" icon={Cog6ToothIcon} label="System Config" />
    <NavItem to="/subcity-admin/analytics" icon={ChartBarIcon} label="Analytics" />

    <NavItem to="/profile/edit" icon={UserCircleIcon} label="Edit Profile" />
  </SidebarShell>
);

const KebeleAdminSidebar = ({ onLogout }) => (
  <SidebarShell title="Kebele Administrator" onLogout={onLogout}>
    <NavItem to="/kebele-admin/dashboard" icon={HomeIcon} label="Dashboard" />

    <NavGroup label="Citizens" />
    <NavItem to="/kebele-admin/residents" icon={UserGroupIcon} label="Residents" />

    <NavGroup label="Requests & Issues" />
    <NavItem to="/kebele-admin/service-requests" icon={ClipboardDocumentListIcon} label="Service Requests" />
    <NavItem to="/kebele-admin/reports" icon={DocumentTextIcon} label="Community Issues" />

    <NavGroup label="Communication" />
    <NavItem to="/kebele-admin/announcements" icon={MegaphoneIcon} label="Announcements" />
    <NavItem to="/kebele-admin/events" icon={CalendarIcon} label="Events" />

    <NavItem to="/profile/edit" icon={UserCircleIcon} label="Edit Profile" />
  </SidebarShell>
);

const Sidebar = () => {
  const { user, logout } = useAuth();
  if (!user) return null;
  switch (user.role) {
    case 'resident': return <ResidentSidebar onLogout={logout} />;
    case 'officer': return <OfficerSidebar onLogout={logout} />;
    case 'kebele_admin': return <KebeleAdminSidebar onLogout={logout} />;
    case 'woreda_admin': return <WoredaAdminSidebar onLogout={logout} />;
    case 'super_admin': return <SubCityAdminSidebar onLogout={logout} />;
    default: return null;
  }
};

export default Sidebar;
