import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { queryKeys } from '@/api/queryKeys';
import { loginApi, signupApi, getMeApi } from '@/api/auth.api';
import type { LoginRequest, SignupRequest, User } from '@/lib/types';

const TOKEN_KEY = 'preptrack_token';
const USER_KEY = 'preptrack_user';

// ─── Helpers ────────────────────────────────────────────────
export function getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as User;
    } catch {
        return null;
    }
}

function persistAuth(token: string, user: User) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// ─── useCurrentUser ──────────────────────────────────────────
// Returns the currently authenticated user by hitting GET /api/auth/me.
// Enabled only when a token exists — acts as the auth gate.
export function useCurrentUser() {
    const hasToken = Boolean(getStoredToken());

    return useQuery({
        queryKey: queryKeys.auth.me,
        queryFn: getMeApi,
        enabled: hasToken,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: false,
        // Seed initial data from localStorage so there's no flash on navigation
        initialData: hasToken ? (getStoredUser() ?? undefined) : undefined,
    });
}

// ─── useLogin ───────────────────────────────────────────────
export function useLogin() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (data: LoginRequest) => loginApi(data),
        onSuccess: ({ token, user }) => {
            persistAuth(token, user);
            // Seed the cache so useCurrentUser doesn't refetch immediately
            queryClient.setQueryData(queryKeys.auth.me, user);
            toast.success(`Welcome back, ${user.display_name}! 🎯`);
            navigate('/app');
        },
        onError: (error: { response?: { data?: { error?: string } } }) => {
            const msg = error?.response?.data?.error ?? 'Login failed. Please try again.';
            toast.error(msg);
        },
    });
}

// ─── useSignup ──────────────────────────────────────────────
export function useSignup() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (data: SignupRequest) => signupApi(data),
        onSuccess: ({ token, user }) => {
            persistAuth(token, user);
            queryClient.setQueryData(queryKeys.auth.me, user);
            toast.success(`Account created! Welcome, ${user.display_name}! 🚀`);
            navigate('/app');
        },
        onError: (error: { response?: { data?: { error?: string }; status?: number } }) => {
            const status = error?.response?.status;
            const msg =
                status === 409
                    ? 'Email already registered.'
                    : status === 400
                      ? 'Invalid invite code.'
                      : error?.response?.data?.error ?? 'Signup failed. Please try again.';
            toast.error(msg);
        },
    });
}

// ─── useLogout ──────────────────────────────────────────────
export function useLogout() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return () => {
        clearAuth();
        queryClient.clear();
        toast.success('Logged out. See you soon! 👋');
        navigate('/login');
    };
}
