import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth/auth.store';

/**
 * ProtectedRoute — wraps authenticated routes.
 * Checks for authentication in Zustand auth store before rendering.
 * If unauthenticated, redirects to /login.
 */
export function ProtectedRoute() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
