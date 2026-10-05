import { Navigate, Outlet } from 'react-router-dom';
import { getStoredToken } from '@/hooks/useAuth';

/**
 * ProtectedRoute — wraps authenticated routes.
 * Checks for a stored JWT before rendering. If no token exists,
 * redirects to /login with the current location saved so we can
 * send the user back after login.
 */
export function ProtectedRoute() {
    const token = getStoredToken();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
