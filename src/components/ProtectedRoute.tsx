import { Navigate, Outlet } from 'react-router-dom';
import { isAuditorAuthenticated } from '../utils/auth';

/**
 * Protected route layout for audit flow
 * Ensures only authenticated auditors can access audit routes
 * Uses Outlet to render nested child routes
 */
const ProtectedRoute: React.FC = () => {
  if (!isAuditorAuthenticated()) {
    return <Navigate to="/audit/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
