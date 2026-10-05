import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/api/queryKeys';
import {
    getTopicResourcesApi,
    createResourceApi,
    updateResourceApi,
    deleteResourceApi,
    type CreateResourceRequest,
    type UpdateResourceRequest,
} from '@/api/resources.api';

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
        onError: () => toast.error('Failed to delete resource'),
    });
}
