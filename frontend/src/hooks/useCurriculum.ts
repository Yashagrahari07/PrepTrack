import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/api/queryKeys';
import {
    getCategoriesApi,
    getCategoryTopicsApi,
    getTopicByIdApi,
    createCategoryApi,
    updateCategoryApi,
    deleteCategoryApi,
    createTopicApi,
    updateTopicApi,
    deleteTopicApi,
} from '@/api/curriculum.api';
import type { TopicStatus } from '@/lib/types';

// Fetch all categories
export function useCategories() {
    return useQuery({
        queryKey: queryKeys.categories.all,
        queryFn: getCategoriesApi,
        staleTime: 1000 * 60 * 5,
    });
}

// Fetch topics for a specific category
export function useCategoryTopics(categoryId: string | null) {
    return useQuery({
        queryKey: categoryId ? queryKeys.categories.byId(categoryId) : ['topics', 'none'],
        queryFn: () => getCategoryTopicsApi(categoryId!),
        enabled: Boolean(categoryId),
        staleTime: 1000 * 60 * 3,
    });
}

// Fetch a single topic by ID
export function useTopic(topicId: string | null) {
    return useQuery({
        queryKey: topicId ? queryKeys.topics.byId(topicId) : ['topic', 'none'],
        queryFn: () => getTopicByIdApi(topicId!),
        enabled: Boolean(topicId),
        staleTime: 1000 * 60 * 3,
    });
}

// Create category
export function useCreateCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createCategoryApi,
        onSuccess: (newCat) => {
            qc.invalidateQueries({ queryKey: queryKeys.categories.all });
            toast.success(`Category "${newCat.name}" created!`);
        },
        onError: () => toast.error('Failed to create category'),
    });
}

// Update category
export function useUpdateCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateCategoryApi>[1] }) =>
            updateCategoryApi(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.categories.all });
            toast.success('Category updated!');
        },
        onError: () => toast.error('Failed to update category'),
    });
}

// Delete category
export function useDeleteCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteCategoryApi,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.categories.all });
            qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
            toast.success('Category deleted');
        },
        onError: () => toast.error('Failed to delete category'),
    });
}

// Create Topic / Subtopic
export function useCreateTopic() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createTopicApi,
        onSuccess: (newTopic) => {
            qc.invalidateQueries({ queryKey: queryKeys.categories.all });
            qc.invalidateQueries({ queryKey: queryKeys.categories.byId(newTopic.category_id) });
            qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
            toast.success(`Topic "${newTopic.title}" added! 📚`);
        },
        onError: () => toast.error('Failed to create topic'),
    });
}

// Update Topic (Status, Confidence, Notes)
export function useUpdateTopic() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: { status?: TopicStatus; confidence?: number; notes_md?: string; title?: string };
        }) => updateTopicApi(id, data),
        onSuccess: (updated) => {
            qc.invalidateQueries({ queryKey: queryKeys.categories.all });
            qc.invalidateQueries({ queryKey: queryKeys.categories.byId(updated.category_id) });
            qc.invalidateQueries({ queryKey: queryKeys.topics.byId(updated.id) });
            qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
            qc.invalidateQueries({ queryKey: queryKeys.revisions.all });
            toast.success('Topic updated! 🎯');
        },
        onError: () => toast.error('Failed to update topic'),
    });
}

// Delete Topic
export function useDeleteTopic() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteTopicApi,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.categories.all });
            qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
            toast.success('Topic deleted');
        },
        onError: () => toast.error('Failed to delete topic'),
    });
}
