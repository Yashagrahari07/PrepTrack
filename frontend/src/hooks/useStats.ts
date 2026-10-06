import { useQuery } from '@tanstack/react-query';
import { getStats } from '@/api/stats.api';
import { queryKeys } from '@/api/queryKeys';

export function useStats() {
    return useQuery({
        queryKey: queryKeys.stats.all,
        queryFn: getStats,
    });
}
