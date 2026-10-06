import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '@/api/settings.api';
import { queryKeys } from '@/api/queryKeys';
import { toast } from 'sonner';

export function useSettings() {
    return useQuery({
        queryKey: queryKeys.settings.all,
        queryFn: getSettings,
    });
}

export function useUpdateSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
            toast.success('Settings updated successfully');
        },
        onError: () => {
            toast.error('Failed to update settings');
        },
    });
}
