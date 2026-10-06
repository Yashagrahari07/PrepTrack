import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth/auth.store';

/**
 * GuestRoute — wraps public/guest-only routes (Landing, Login, Signup).
 * If the user is already authenticated, redirects them to /home.
 */
export function GuestRoute() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    if (isAuthenticated) {
        return <Navigate to="/home" replace />;
    }

    return <Outlet />;
}
