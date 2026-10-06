import apiClient from '@/lib/axios';
import type { UserSettings, UpdateSettingsRequest } from '@/lib/types';

export async function getSettings(): Promise<UserSettings> {
    const response = await apiClient.get('/api/settings');
    return response.data.settings;
}

export async function updateSettings(data: UpdateSettingsRequest): Promise<UserSettings> {
    const response = await apiClient.patch('/api/settings', data);
    return response.data.settings;
}
