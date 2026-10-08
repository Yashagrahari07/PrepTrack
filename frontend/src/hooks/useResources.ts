import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/api/queryKeys';
import { getErrorMessage } from '@/lib/axios';
import {
    getTopicResourcesApi,
    createResourceApi,
    updateResourceApi,
    deleteResourceApi,
    reorderResourcesApi,
} from '@/api/resources.api';
import type { CreateResourceRequest, UpdateResourceRequest } from '@/api/resources.api';
import type { Resource } from '@/lib/types';

// Fetch resources attached to a topic
export function useTopicResources(topicId: string | null) {
    return useQuery({
        queryKey: topicId ? queryKeys.topics.resources(topicId) : ['resources', 'none'],
        queryFn: () => getTopicResourcesApi(topicId!),
        enabled: Boolean(topicId),
        staleTime: 1000 * 60 * 3,
    });
}

// Attach a new resource (Max 3/topic server enforced)
export function useCreateResource(topicId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateResourceRequest) => createResourceApi(topicId, data),
        onSuccess: (newRes) => {
            qc.invalidateQueries({ queryKey: queryKeys.topics.resources(topicId) });
            qc.invalidateQueries({ queryKey: queryKeys.topics.byId(topicId) });
            qc.invalidateQueries({ queryKey: queryKeys.categories.all });
            toast.success(`Resource "${newRes.title}" attached! 🔗`);
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.error || 'Failed to add resource';
            toast.error(msg);
        },
    });
}

// Update resource status or info
export function useUpdateResource(topicId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateResourceRequest }) =>
            updateResourceApi(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.topics.resources(topicId) });
            toast.success('Resource updated!');
        },
        onError: () => toast.error('Failed to update resource'),
    });
}

// Delete resource
export function useDeleteResource(topicId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (resourceId: string) => deleteResourceApi(resourceId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.topics.resources(topicId) });
            qc.invalidateQueries({ queryKey: queryKeys.topics.byId(topicId) });
            qc.invalidateQueries({ queryKey: queryKeys.categories.all });
            toast.success('Resource deleted');
        },
        onError: (err) => toast.error(getErrorMessage(err) || 'Failed to delete resource'),
    });
}

// Reorder one topic's resources. Flat array on a single list key.
export function useReorderResources(topicId: string | null) {
    const qc = useQueryClient();
    const inFlight = useRef(false);
    const key = topicId ? queryKeys.topics.resources(topicId) : ['resources', 'none'];

    return useMutation({
        mutationFn: (orderedIds: string[]) => {
            if (!topicId) return Promise.reject(new Error('REORDER_NO_TOPIC'));
            if (inFlight.current) return Promise.reject(new Error('REORDER_IN_FLIGHT'));
            inFlight.current = true;
            return reorderResourcesApi({ topic_id: topicId, ordered_ids: orderedIds }).finally(() => {
                inFlight.current = false;
            });
        },
        onMutate: async (orderedIds: string[]) => {
            await qc.cancelQueries({ queryKey: key });
            const previous = qc.getQueryData<Resource[]>(key);
            if (previous) {
                const map = new Map(previous.map((r) => [r.id, r]));
                qc.setQueryData(
                    key,
                    orderedIds.map((id) => map.get(id)).filter((r): r is Resource => Boolean(r)),
                );
            }
            return { previous };
        },
        onError: (err, _vars, context) => {
            if (err instanceof Error && (err.message === 'REORDER_IN_FLIGHT' || err.message === 'REORDER_NO_TOPIC')) {
                return;
            }
            if (context?.previous) qc.setQueryData(key, context.previous);
            toast.error(getErrorMessage(err) || 'Failed to update order');
        },
        onSuccess: (updated) => {
            qc.setQueryData(key, updated);
            qc.invalidateQueries({ queryKey: key });
            toast.success('Order updated', { id: 'reorder-resources' });
        },
    });
}
