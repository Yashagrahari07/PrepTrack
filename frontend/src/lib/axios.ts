import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false,
});

// Request interceptor — attach JWT from localStorage
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('preptrack_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// Response interceptor — handle 401 globally
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear stale token and redirect to login
            localStorage.removeItem('preptrack_token');
            localStorage.removeItem('preptrack_user');
            // Use window.location to avoid circular dep with router
            if (window.location.pathname.startsWith('/app')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    },
);

export default apiClient;
