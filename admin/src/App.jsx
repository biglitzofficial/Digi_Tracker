import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import RoleRoute from './components/RoleRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StaffDashboard from './pages/StaffDashboard';
import Staff from './pages/Staff';
import Modules from './pages/Modules';
import ModuleBuilder from './pages/ModuleBuilder';
import Analytics from './pages/Analytics';
import Rewards from './pages/Rewards';
import Reports from './pages/Reports';
import Entries from './pages/Entries';
import EntryForm from './pages/EntryForm';
import SuperAdmin from './pages/SuperAdmin';
import Onboarding from './pages/Onboarding';
import ForgotPassword from './pages/ForgotPassword';
import Settings from './pages/Settings';
import { isStaff } from './utils/permissions';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
}

function HomePage() {
  const { user } = useAuth();
  return isStaff(user) ? <StaffDashboard /> : <Dashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<HomePage />} />
        <Route path="staff" element={<RoleRoute managerOnly><Staff /></RoleRoute>} />
        <Route path="modules" element={<RoleRoute managerOnly><Modules /></RoleRoute>} />
        <Route path="modules/new" element={<RoleRoute managerOnly><ModuleBuilder /></RoleRoute>} />
        <Route path="modules/:id/edit" element={<RoleRoute managerOnly><ModuleBuilder /></RoleRoute>} />
        <Route path="entries" element={<Entries />} />
        <Route path="entries/new/:moduleId" element={<EntryForm />} />
        <Route path="entries/:id/edit" element={<EntryForm />} />
        <Route path="analytics" element={<RoleRoute managerOnly><Analytics /></RoleRoute>} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="reports" element={<RoleRoute managerOnly><Reports /></RoleRoute>} />
        <Route path="super-admin" element={<SuperAdmin />} />
        <Route path="settings" element={<RoleRoute managerOnly><Settings /></RoleRoute>} />
      </Route>
    </Routes>
  );
}
