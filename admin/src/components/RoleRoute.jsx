import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canManageBusiness } from '../utils/permissions';

/** Redirects staff away from owner-only pages. */
export default function RoleRoute({ children, managerOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (managerOnly && !canManageBusiness(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
