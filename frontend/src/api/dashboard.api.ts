import apiClient from '@/lib/axios';
import type { DashboardResponse } from '@/lib/types';

export async function getDashboard(): Promise<DashboardResponse> {
    const response = await apiClient.get('/api/dashboard');
    return response.data;
}
