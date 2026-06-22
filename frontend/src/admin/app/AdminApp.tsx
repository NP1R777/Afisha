import { Navigate, Route, Routes } from 'react-router-dom';
import AdminAiPage from '../pages/AdminAiPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import AdminEventsPage from '../pages/AdminEventsPage';
import AdminLoginPage from '../pages/AdminLoginPage';
import AdminOrganizationsPage from '../pages/AdminOrganizationsPage';
import AdminParserPage from '../pages/AdminParserPage';
import AdminUsersPage from '../pages/AdminUsersPage';
import { AdminAuthProvider } from './AdminAuthContext';
import AdminGuard from './AdminGuard';
import AdminLayout from './AdminLayout';

const AdminApp: React.FC = () => {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="organizations" element={<AdminOrganizationsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="parser" element={<AdminParserPage />} />
          <Route path="ai" element={<AdminAiPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminAuthProvider>
  );
};

export default AdminApp;
