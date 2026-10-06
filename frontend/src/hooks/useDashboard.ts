import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '@/api/dashboard.api';
import { queryKeys } from '@/api/queryKeys';

export function useDashboard() {
    return useQuery({
        queryKey: queryKeys.dashboard.all,
        queryFn: getDashboard,
    });
}
