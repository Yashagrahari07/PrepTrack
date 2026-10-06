import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { queryKeys } from '@/api/queryKeys';
import { loginApi, signupApi, getMeApi, logoutApi } from '@/api/auth.api';
import { useAuthStore, getCachedUser as getStoredUser } from '@/stores/auth/auth.store';
import { getErrorMessage } from '@/lib/axios';
import type { LoginRequest, SignupRequest } from '@/lib/types';

export { getStoredUser };

// ─── useCurrentUser ──────────────────────────────────────────
export function useCurrentUser() {
    const { user: storedUser, setUser, clearAuth } = useAuthStore();

    return useQuery({
        queryKey: queryKeys.auth.me,
        queryFn: async () => {
            try {
                const user = await getMeApi();
                setUser(user);
                return user;
            } catch (err) {
                clearAuth();
                throw err;
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: false,
        initialData: storedUser ?? undefined,
    });
}

// ─── useLogin ───────────────────────────────────────────────
export function useLogin() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);

    return useMutation({
        mutationFn: (data: LoginRequest) => loginApi(data),
        onSuccess: ({ user }) => {
            setAuth(user);
            queryClient.setQueryData(queryKeys.auth.me, user);
            toast.success(`Welcome back, ${user.display_name}! 🎯`);
            navigate('/home');
        },
        onError: (error) => {
            const msg = getErrorMessage(error);
            toast.error(msg);
        },
    });
}

// ─── useSignup ──────────────────────────────────────────────
export function useSignup() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);

    return useMutation({
        mutationFn: (data: SignupRequest) => signupApi(data),
        onSuccess: ({ user }) => {
            setAuth(user);
            queryClient.setQueryData(queryKeys.auth.me, user);
            toast.success(`Account created! Welcome, ${user.display_name}! 🚀`);
            navigate('/home');
        },
        onError: (error) => {
            const msg = getErrorMessage(error);
            toast.error(msg);
        },
    });
}

// ─── useLogout ──────────────────────────────────────────────
export function useLogout() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const clearAuth = useAuthStore((s) => s.clearAuth);

    return async () => {
        try {
            await logoutApi();
        } catch {
            // Even if logout endpoint fails, clear local auth session
        } finally {
            clearAuth();
            queryClient.clear();
            toast.success('Logged out. See you soon! 👋');
            navigate('/login');
        }
    };
}
