import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/api/queryKeys';
import { getSettingsApi, updateSettingsApi } from '@/api/settings.api';
import type { UserSettings } from '@/lib/types';

export function useSettings() {
    return useQuery({
        queryKey: queryKeys.settings.all,
        queryFn: getSettingsApi,
        staleTime: 1000 * 60 * 10,
    });
}

export function useUpdateSettings() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<UserSettings>) => updateSettingsApi(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.settings.all });
            qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
            toast.success('Settings updated successfully! ⚙️');
        },
        onError: () => toast.error('Failed to update settings.'),
    });
}
