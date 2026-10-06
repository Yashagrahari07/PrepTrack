import axios, { type AxiosError } from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth/auth.store';
import { useAppStore } from '@/stores/app/app.store';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Crucial for HttpOnly cookies
});

/**
 * Extracts a human-readable error message from an API error response.
 */
export function getErrorMessage(error: unknown): string {
    if (!axios.isAxiosError(error)) {
        if (error instanceof Error) return error.message;
        return 'An unexpected error occurred.';
    }

    const axiosError = error as AxiosError<{
        error?: string | { code?: string; message?: string; retryAfter?: number };
        message?: string;
    }>;

    const data = axiosError.response?.data;

    if (!data) {
        if (axiosError.code === 'ERR_NETWORK') {
            return 'Network error: Please check your internet connection or server status.';
        }
        return axiosError.message || 'Server request failed.';
    }

    if (typeof data.error === 'string') {
        return data.error;
    }

    if (data.error && typeof data.error === 'object') {
        return data.error.message || 'An error occurred during the request.';
    }

    if (typeof data.message === 'string') {
        return data.message;
    }

    return 'An unexpected server error occurred.';
}

// Response interceptor for global status code handling (401 Unauthorized & 429 Rate Limit)
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ error?: { message?: string; retryAfter?: number }; retryAfter?: number }>) => {
        const status = error.response?.status;

        // ── 401 Unauthorized — Auth Cookie expired or invalid
        if (status === 401) {
            useAuthStore.getState().clearAuth();
            if (window.location.pathname.startsWith('/home') || window.location.pathname.startsWith('/app')) {
                window.location.href = '/login';
            }
        }

        // ── 429 Rate Limit Exceeded — Graceful feedback & retry behavior
        if (status === 429) {
            const retryHeader = error.response?.headers?.['retry-after'];
            const retryAfterSec =
                retryHeader ? parseInt(retryHeader, 10) : error.response?.data?.error?.retryAfter ?? error.response?.data?.retryAfter ?? 60;

            const message =
                getErrorMessage(error) || `Rate limit exceeded. Please try again in ${retryAfterSec} seconds.`;

            // Trigger global rate limit banner state
            useAppStore.getState().setRateLimit(retryAfterSec, message);

            toast.error(message, {
                id: 'rate-limit-toast',
                duration: 6000,
            });
        }

        return Promise.reject(error);
    },
);

export default apiClient;
