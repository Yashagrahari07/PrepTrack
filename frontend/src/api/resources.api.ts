import apiClient from '@/lib/axios';
import type { Resource, ResourceType, ResourceStatus } from '@/lib/types';

export interface CreateResourceRequest {
    type: ResourceType;
    title: string;
    url: string;
    est_minutes?: number;
    status?: ResourceStatus;
}

export interface UpdateResourceRequest {
    type?: ResourceType;
    title?: string;
    url?: string;
    est_minutes?: number;
    status?: ResourceStatus;
}

// GET /api/topics/:id/resources -> returns { resources: Resource[] }
export async function getTopicResourcesApi(topicId: string): Promise<Resource[]> {
    const response = await apiClient.get<{ resources?: Resource[] }>(`/api/topics/${topicId}/resources`);
    return response.data.resources || [];
}

// POST /api/topics/:id/resources -> returns { resource: Resource }
export async function createResourceApi(topicId: string, data: CreateResourceRequest): Promise<Resource> {
    const response = await apiClient.post<{ resource: Resource }>(`/api/topics/${topicId}/resources`, data);
    return response.data.resource;
}

// PATCH /api/resources/:id -> returns { resource: Resource }
export async function updateResourceApi(resourceId: string, data: UpdateResourceRequest): Promise<Resource> {
    const response = await apiClient.patch<{ resource: Resource }>(`/api/resources/${resourceId}`, data);
    return response.data.resource;
}

// DELETE /api/resources/:id
export async function deleteResourceApi(resourceId: string): Promise<void> {
    await apiClient.delete(`/api/resources/${resourceId}`);
}
