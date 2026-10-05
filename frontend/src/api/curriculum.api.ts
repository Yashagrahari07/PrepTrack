import apiClient from '@/lib/axios';
import type { Category, Topic, TopicStatus } from '@/lib/types';

// GET /api/categories -> returns { categories: Category[] }
export async function getCategoriesApi(): Promise<Category[]> {
    const response = await apiClient.get<{ categories?: Category[] }>('/api/categories');
    return response.data.categories || [];
}

// POST /api/categories -> returns { category: Category }
export async function createCategoryApi(data: { name: string; color: string }): Promise<Category> {
    const response = await apiClient.post<{ category: Category }>('/api/categories', data);
    return response.data.category;
}

// PATCH /api/categories/:id -> returns { category: Category }
export async function updateCategoryApi(id: string, data: Partial<Category>): Promise<Category> {
    const response = await apiClient.patch<{ category: Category }>(`/api/categories/${id}`, data);
    return response.data.category;
}

// DELETE /api/categories/:id
export async function deleteCategoryApi(id: string): Promise<void> {
    await apiClient.delete(`/api/categories/${id}`);
}

// GET /api/categories/:id/topics -> returns { topics: Topic[] }
export async function getCategoryTopicsApi(categoryId: string): Promise<Topic[]> {
    const response = await apiClient.get<{ topics?: Topic[] }>(`/api/categories/${categoryId}/topics`);
    return response.data.topics || [];
}

// GET /api/topics/:id -> returns { topic: Topic }
export async function getTopicByIdApi(topicId: string): Promise<Topic> {
    const response = await apiClient.get<{ topic: Topic }>(`/api/topics/${topicId}`);
    return response.data.topic;
}

// POST /api/topics -> returns { topic: Topic }
export async function createTopicApi(data: {
    category_id: string;
    parent_id?: string | null;
    title: string;
}): Promise<Topic> {
    const response = await apiClient.post<{ topic: Topic }>('/api/topics', data);
    return response.data.topic;
}

// PATCH /api/topics/:id -> returns { topic: Topic }
export async function updateTopicApi(
    topicId: string,
    data: {
        status?: TopicStatus;
        confidence?: number;
        notes_md?: string;
        title?: string;
    },
): Promise<Topic> {
    const response = await apiClient.patch<{ topic: Topic }>(`/api/topics/${topicId}`, data);
    return response.data.topic;
}

// DELETE /api/topics/:id
export async function deleteTopicApi(topicId: string): Promise<void> {
    await apiClient.delete(`/api/topics/${topicId}`);
}
