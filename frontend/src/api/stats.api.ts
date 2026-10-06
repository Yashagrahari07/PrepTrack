import apiClient from '@/lib/axios';
import type { StatsResponse } from '@/lib/types';

export async function getStats(): Promise<StatsResponse> {
    const response = await apiClient.get('/api/stats');
    return response.data;
}
