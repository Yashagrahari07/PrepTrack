import apiClient from '@/lib/axios';
import type { UserSettings } from '@/lib/types';

// GET /api/settings -> returns { settings: UserSettings }
export async function getSettingsApi(): Promise<UserSettings> {
    const response = await apiClient.get<{ settings: UserSettings }>('/api/settings');
    return response.data.settings;
}

// PATCH /api/settings -> returns { settings: UserSettings }
export async function updateSettingsApi(data: Partial<UserSettings>): Promise<UserSettings> {
    const response = await apiClient.patch<{ settings: UserSettings }>('/api/settings', data);
    return response.data.settings;
}
