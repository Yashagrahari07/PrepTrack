import { create } from 'zustand';
import type { User } from '@/lib/types';

const USER_STORAGE_KEY = 'preptrack_user_cache';

export function getCachedUser(): User | null {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as User;
    } catch {
        return null;
    }
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
    authError: string | null;

    // Actions
    setAuth: (user: User) => void;
    setUser: (user: User) => void;
    clearAuth: () => void;
    setInitializing: (loading: boolean) => void;
    setAuthError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: getCachedUser(),
    isAuthenticated: Boolean(getCachedUser()),
    isInitializing: true,
    authError: null,

    setAuth: (user: User) => {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        set({
            user,
            isAuthenticated: true,
            isInitializing: false,
            authError: null,
        });
    },

    setUser: (user: User) => {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        set({ user, isAuthenticated: true, isInitializing: false });
    },

    clearAuth: () => {
        localStorage.removeItem(USER_STORAGE_KEY);
        set({
            user: null,
            isAuthenticated: false,
            isInitializing: false,
            authError: null,
        });
    },

    setInitializing: (isInitializing: boolean) => {
        set({ isInitializing });
    },

    setAuthError: (authError: string | null) => {
        set({ authError });
    },
}));
