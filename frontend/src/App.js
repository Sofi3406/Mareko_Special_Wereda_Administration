import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { SidebarLayoutProvider, useSidebarLayout } from './context/SidebarLayoutContext';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import ResidentChatbotWidget from './components/Chatbot/ResidentChatbotWidget';

// Auth
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import ActivateAccount from './pages/Auth/ActivateAccount';

// Resident
import ResidentDashboard from './pages/Resident/Dashboard';
import ReportIssue from './pages/Resident/ReportIssue';
import MyReports from './pages/Resident/MyReports';
import TrackReport from './pages/Resident/TrackReport';
import PublicUpdates from './pages/Resident/PublicUpdates';
import ResidentAnnouncements from './pages/Resident/Announcements';
import Services from './pages/Resident/Services';
import ServiceDetail from './pages/Resident/ServiceDetail';
import MyRequests from './pages/Resident/MyRequests';
import ResidentNotifications from './pages/WoredaAdmin/Notifications';
import ComplaintsFeedback from './pages/Resident/ComplaintsFeedback';

// Officer
import OfficerDashboard from './pages/Officer/Dashboard';
import ManageReports from './pages/Officer/ManageReports';
import UploadResource from './pages/Officer/UploadResource';
import PostUpdates from './pages/Officer/PostUpdates';
import OfficerAnnouncements from './pages/Officer/Announcements';

// Woreda Admin
import WoredaAdminDashboard from './pages/WoredaAdmin/Dashboard';
import WoredaAdminReports from './pages/WoredaAdmin/Reports';
import ManageOfficers from './pages/WoredaAdmin/ManageOfficers';
import ManageKebeleAdmins from './pages/WoredaAdmin/ManageKebeleAdmins';
import ManageEvents from './pages/WoredaAdmin/ManageEvents';
import VirtualMeetings from './pages/WoredaAdmin/VirtualMeetings';
import WoredaAdminAnalytics from './pages/WoredaAdmin/Analytics';
import ManageDepartments from './pages/WoredaAdmin/ManageDepartments';
import ManageKebeles from './pages/WoredaAdmin/ManageKebeles';
import ManageServices from './pages/WoredaAdmin/ManageServices';
import ManageRequests from './pages/WoredaAdmin/ManageRequests';
import WoredaResidents from './pages/WoredaAdmin/Residents';
import ActivityLog from './pages/WoredaAdmin/ActivityLog';
import Complaints from './pages/WoredaAdmin/Complaints';
import Notifications from './pages/WoredaAdmin/Notifications';

// Kebele Admin
import KebeleAdminDashboard from './pages/KebeleAdmin/Dashboard';

// Mareko Special Wereda Super Admin
import SystemAdminDashboard from './pages/SubCityAdmin/Dashboard';
import AnalyticsDashboard from './pages/SubCityAdmin/AnalyticsDashboard';
import SubCityAdminEvents from './pages/SubCityAdmin/ManageEvents';
import ManageWoredaAdmins from './pages/SubCityAdmin/ManageWoredaAdmins';
import SubCityAdminReports from './pages/SubCityAdmin/Reports';
import UserManagement from './pages/SubCityAdmin/UserManagement';
import AuditLogs from './pages/SubCityAdmin/AuditLogs';
import SystemConfig from './pages/SubCityAdmin/SystemConfig';
import RoleManagement from './pages/SubCityAdmin/RoleManagement';

// Shared
import Events from './pages/Shared/Events';
import Resources from './pages/Shared/Resources';
import Profile from './pages/Shared/Profile';
import EditProfile from './pages/Shared/EditProfile';
import Home from './pages/Shared/Home';
import Announcements from './pages/Shared/Announcements';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

const Layout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const sidebarLayout = useSidebarLayout();

  const compactPrefixes = ['/resident', '/officer', '/kebele-admin', '/woreda-admin', '/subcity-admin'];
  const compactRoles = new Set(['resident', 'officer', 'kebele_admin', 'woreda_admin', 'super_admin']);
  const compactShared = new Set(['/profile', '/profile/edit']);
  const residentShared = new Set(['/resident/announcements', '/resident/public-updates', '/resources', '/events']);

  const isRoleSection = compactPrefixes.some(p => location.pathname === p || location.pathname.startsWith(`${p}/`));
  const isCompactShared = compactRoles.has(user?.role) && compactShared.has(location.pathname);
  const isResidentShared = user?.role === 'resident' && residentShared.has(location.pathname);
  const compact = isRoleSection || isCompactShared || isResidentShared;

  useEffect(() => {
    sidebarLayout?.close();
  }, [location.pathname]); // close sidebar on route change (mobile drawer)

  if (!user) return children;

  const sidebarOpen = sidebarLayout?.isOpen;

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          aria-label="Close menu"
          onClick={sidebarLayout.close}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className={`flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 ${compact ? 'pb-2' : ''}`}>
          {children}
        </main>
        <Footer compact={compact} />
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SidebarLayoutProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/resetpassword/:token" element={<ResetPassword />} />
          <Route path="/activate/:token" element={<ActivateAccount />} />
          <Route path="/activate" element={<ActivateAccount />} />
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/announcements" element={<Announcements />} />

          {/* Resident */}
          <Route path="/resident/*" element={
            <ProtectedRoute allowedRoles={['resident']}>
              <Layout>
                <Routes>
                  <Route path="dashboard" element={<ResidentDashboard />} />
                  <Route path="announcements" element={<ResidentAnnouncements />} />
                  <Route path="public-updates" element={<PublicUpdates />} />
                  <Route path="reports" element={<MyReports />} />
                  <Route path="reports/new" element={<ReportIssue />} />
                  <Route path="reports/:id" element={<TrackReport />} />
                  <Route path="services" element={<Services />} />
                  <Route path="services/:id" element={<ServiceDetail />} />
                  <Route path="my-requests" element={<MyRequests />} />
                  <Route path="notifications" element={<ResidentNotifications />} />
                  <Route path="complaints-feedback" element={<ComplaintsFeedback />} />
                  <Route path="events" element={<Events />} />
                  <Route path="resources" element={<Resources />} />
                  <Route path="meetings" element={<VirtualMeetings />} />
                  <Route path="profile" element={<Profile />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />

          {/* Officer */}
          <Route path="/officer/*" element={
            <ProtectedRoute allowedRoles={['officer']}>
              <Layout>
                <Routes>
                  <Route path="dashboard" element={<OfficerDashboard />} />
                  <Route path="reports" element={<ManageReports />} />
                  <Route path="service-requests" element={<ManageRequests />} />
                  <Route path="resources" element={<UploadResource />} />
                  <Route path="updates" element={<PostUpdates />} />
                  <Route path="events" element={<Events />} />
                  <Route path="meetings" element={<VirtualMeetings />} />
                  <Route path="announcements" element={<OfficerAnnouncements />} />
                  <Route path="profile" element={<Profile />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />

          {/* Woreda Admin */}
          <Route path="/woreda-admin/*" element={
            <ProtectedRoute allowedRoles={['woreda_admin']}>
              <Layout>
                <Routes>
                  <Route path="dashboard" element={<WoredaAdminDashboard />} />
                  <Route path="residents" element={<WoredaResidents />} />
                  <Route path="reports" element={<WoredaAdminReports />} />
                  <Route path="complaints" element={<Complaints />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="service-requests" element={<ManageRequests />} />
                  <Route path="services" element={<ManageServices />} />
                  <Route path="departments" element={<ManageDepartments />} />
                  <Route path="kebeles" element={<ManageKebeles />} />
                  <Route path="officers" element={<ManageOfficers />} />
                  <Route path="kebele-admins" element={<ManageKebeleAdmins />} />
                  <Route path="events" element={<ManageEvents />} />
                  <Route path="community-events" element={<Events />} />
                  <Route path="meetings" element={<VirtualMeetings />} />
                  <Route path="announcements" element={<OfficerAnnouncements />} />
                  <Route path="resources" element={<Resources />} />
                  <Route path="analytics" element={<WoredaAdminAnalytics />} />
                  <Route path="activity-log" element={<ActivityLog />} />
                  <Route path="profile" element={<Profile />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />

          {/* Kebele Admin */}
          <Route path="/kebele-admin/*" element={
            <ProtectedRoute allowedRoles={['kebele_admin']}>
              <Layout>
                <Routes>
                  <Route path="dashboard" element={<KebeleAdminDashboard />} />
                  <Route path="reports" element={<WoredaAdminReports />} />
                  <Route path="service-requests" element={<ManageRequests />} />
                  <Route path="residents" element={<WoredaResidents />} />
                  <Route path="announcements" element={<OfficerAnnouncements />} />
                  <Route path="events" element={<Events />} />
                  <Route path="profile" element={<Profile />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />

          {/* System Admin */}
          <Route path="/subcity-admin/*" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Layout>
                <Routes>
                  <Route path="dashboard" element={<SystemAdminDashboard />} />
                  <Route path="reports" element={<SubCityAdminReports />} />
                  <Route path="service-requests" element={<ManageRequests />} />
                  <Route path="services" element={<ManageServices />} />
                  <Route path="departments" element={<ManageDepartments />} />
                  <Route path="kebeles" element={<ManageKebeles />} />
                  <Route path="events" element={<SubCityAdminEvents />} />
                  <Route path="meetings" element={<VirtualMeetings />} />
                  <Route path="admins" element={<ManageWoredaAdmins />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="announcements" element={<OfficerAnnouncements />} />
                  <Route path="audit-logs" element={<AuditLogs />} />
                  <Route path="system-config" element={<SystemConfig />} />
                  <Route path="roles" element={<RoleManagement />} />
                  <Route path="analytics" element={<AnalyticsDashboard />} />
                  <Route path="profile" element={<Profile />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />

          {/* Shared protected */}
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><Layout><EditProfile /></Layout></ProtectedRoute>} />
        </Routes>
        <ResidentChatbotWidget />
        </SidebarLayoutProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
