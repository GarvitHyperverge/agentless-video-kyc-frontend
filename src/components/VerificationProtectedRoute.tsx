import { Outlet } from 'react-router-dom';
import { useSessionValidation } from '../utils/hooks/useSessionValidation';

/**
 * Protected route layout for verification flow
 * Validates session token and redirects if missing
 * Uses Outlet to render nested child routes
 */
const VerificationProtectedRoute: React.FC = () => {
  useSessionValidation(); // This hook handles validation and redirect internally

  return <Outlet />;
};

export default VerificationProtectedRoute;
