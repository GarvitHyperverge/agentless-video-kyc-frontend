import { ComponentType, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { checkAuditAuthentication } from '../utils/authCheck';

/**
 * Higher Order Component (HOC) for audit route protection
 * 
 * Wraps a component and checks audit authentication before rendering.
 * Flow:
 * 1. On mount, calls GET /api/auth/audit/check
 * 2. Backend validates: JWT signature + expiry + JTI exists in Redis
 * 3. If 200 OK with authenticated: true → authenticated → render wrapped component
 * 4. If 401 Unauthorized → not authenticated → redirect to login
 * 
 * Security: Frontend route protection is for UX; security is handled by backend.
 * Backend validates JWT + Redis session per request.
 * 
 * @param Component - The component to protect
 * @returns Protected component
 */
export function withProtectedAuditRoute<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return function ProtectedAuditComponent(props: P) {
    const location = useLocation();
    const [auth, setAuth] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      async function verifyAuth() {
        const authenticated = await checkAuditAuthentication();
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
      // Not authenticated - redirect to audit login
      return (
        <Navigate
          to="/audit/login"
          state={{ from: location }}
          replace
        />
      );
    }

    // Authenticated - render wrapped component
    return <Component {...props} />;
  };
}
