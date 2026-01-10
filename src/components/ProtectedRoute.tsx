import { Navigate } from 'react-router-dom';
import { isAuditorAuthenticated } from '../utils/auth';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

/**
 * Protected route component that ensures only authenticated auditors can access audit routes
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  if (!isAuditorAuthenticated()) {
    return <Navigate to="/audit/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
