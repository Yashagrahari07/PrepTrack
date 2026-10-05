import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/api/queryKeys';
import { getDueRevisionsApi, completeRevisionApi } from '@/api/revisions.api';

// Fetch pending/due revisions
export function useDueRevisions() {
    return useQuery({
        queryKey: queryKeys.revisions.due(),
        queryFn: getDueRevisionsApi,
        staleTime: 1000 * 60 * 2,
    });
}

// Complete a revision review
export function useCompleteRevision() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ revisionId, confidence }: { revisionId: string; confidence: number }) =>
            completeRevisionApi(revisionId, confidence),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: queryKeys.revisions.all });
            qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
            qc.invalidateQueries({ queryKey: queryKeys.categories.all });
            toast.success(`${data.message} 🧠✨`);
        },
        onError: () => toast.error('Failed to complete revision review'),
    });
}
