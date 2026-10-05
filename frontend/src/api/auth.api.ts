import apiClient from '@/lib/axios';
import type { AuthResponse, LoginRequest, SignupRequest, User } from '@/lib/types';

// POST /api/auth/login
export async function loginApi(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
    return response.data;
}

// POST /api/auth/signup
export async function signupApi(data: SignupRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/signup', data);
    return response.data;
}

// GET /api/auth/me
export async function getMeApi(): Promise<User> {
    const response = await apiClient.get<User>('/api/auth/me');
    return response.data;
}
