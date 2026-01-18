import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { checkAuthentication } from '../utils/authCheck';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component - Frontend route protection
 * 
 * Flow:
 * 1. On mount, calls GET /api/auth/check
 * 2. Backend validates: JWT signature + expiry + JTI exists in Redis
 * 3. If 200 OK → authenticated → show content
 * 4. If 401 Unauthorized → not authenticated → redirect to login
 * 
 * Security: Backend enforces auth, frontend only handles UX
 */
function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const [auth, setAuth] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      const authenticated = await checkAuthentication();
      setAuth(authenticated);
      setLoading(false);
    }
    verifyAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="w-12 h-12 text-white animate-spin mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!auth) {
    // Not authenticated - redirect to login with session_expired error
    return (
      <Navigate
        to="/audit/login?error=session_expired"
        state={{ from: location }}
        replace
      />
    );
  }

  // Authenticated - render protected content
  return <>{children}</>;
}

export default ProtectedRoute;
