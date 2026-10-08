import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/api/queryKeys';
import { getErrorMessage } from '@/lib/axios';
import {
    getCategoriesApi,
    getCategoryTopicsApi,
    getTopicByIdApi,
    getAllTopicsApi,
    createCategoryApi,
    updateCategoryApi,
    deleteCategoryApi,
    createTopicApi,
    updateTopicApi,
    deleteTopicApi,
    reorderTopicsApi,
} from '@/api/curriculum.api';
import type { CategoryGroup, ReorderTopicsRequest, Topic, TopicStatus } from '@/lib/types';

// Reorder a flat sibling array by id order; unknown ids are dropped.
function orderByIds<T extends { id: string }>(items: T[], ids: string[]): T[] {
    const map = new Map(items.map((i) => [i.id, i]));
    return ids.map((id) => map.get(id)).filter((i): i is T => Boolean(i));
}

// Apply an id order to a Topic[] sibling set (top-level or one parent's subtopics).
function applyTopicOrder(topics: Topic[], parentId: string | null, ids: string[]): Topic[] {
    if (!parentId) return orderByIds(topics, ids);
    return topics.map((t) =>
        t.id === parentId && t.subtopics ? { ...t, subtopics: orderByIds(t.subtopics, ids) } : t,
    );
}

// Apply an id order to the cached list shape (flat Topic[] or CategoryGroup[]).
function applyOrderToCache(
    old: unknown,
    scope: { categoryId?: string; parentId: string | null },
    ids: string[],
): unknown {
    if (Array.isArray(old) && old.length > 0 && 'topics' in (old[0] as object)) {
        return (old as CategoryGroup[]).map((g) =>
            !scope.categoryId || g.category_id === scope.categoryId
                ? { ...g, topics: applyTopicOrder(g.topics, scope.parentId, ids) }
                : g,
        );
    }
    if (Array.isArray(old)) {
        return applyTopicOrder(old as Topic[], scope.parentId, ids);
    }
    return old;
}

// Replace a sibling set with server-returned topic objects (same shapes as above).
function replaceWithUpdated(
    old: unknown,
    scope: { categoryId?: string; parentId: string | null },
    updated: Topic[],
): unknown {
    if (Array.isArray(old) && old.length > 0 && 'topics' in (old[0] as object)) {
        return (old as CategoryGroup[]).map((g) =>
            !scope.categoryId || g.category_id === scope.categoryId
                ? {
                      ...g,
                      topics: scope.parentId
                          ? g.topics.map((t) =>
                                t.id === scope.parentId ? { ...t, subtopics: updated } : t,
                            )
                          : updated,
                  }
                : g,
        );
    }
    if (Array.isArray(old) && !scope.parentId) {
        return updated;
    }
    if (Array.isArray(old) && scope.parentId) {
        return (old as Topic[]).map((t) =>
            t.id === scope.parentId ? { ...t, subtopics: updated } : t,
        );
    }
    return old;
}

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
        onError: (err) => toast.error(getErrorMessage(err) || 'Failed to delete category'),
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
        onError: (err) => toast.error(getErrorMessage(err) || 'Failed to delete topic'),
    });
}

// Fetch all topics grouped by category (All Domains view)
export function useAllTopics(enabled = true) {
    return useQuery({
        queryKey: queryKeys.categories.tree(),
        queryFn: getAllTopicsApi,
        enabled,
        staleTime: 1000 * 60 * 3,
    });
}

export interface ReorderTopicsVars extends ReorderTopicsRequest {
    // Cache key of the list being reordered (categories.byId(id) or categories.tree()).
    listKey: readonly unknown[];
}

// Reorder one sibling set. Lifted to the list level: one instance per sibling
// set owns the moving state and the single-in-flight guard.
export function useReorderTopics() {
    const qc = useQueryClient();
    const inFlight = useRef(false);

    return useMutation({
        mutationFn: (vars: ReorderTopicsVars) => {
            if (inFlight.current) return Promise.reject(new Error('REORDER_IN_FLIGHT'));
            inFlight.current = true;
            const { listKey: _listKey, ...body } = vars;
            return reorderTopicsApi(body).finally(() => {
                inFlight.current = false;
            });
        },
        onMutate: async (vars) => {
            await qc.cancelQueries({ queryKey: vars.listKey });
            const previous = qc.getQueryData(vars.listKey);
            qc.setQueryData(vars.listKey, (old: unknown) =>
                applyOrderToCache(old, { categoryId: vars.category_id, parentId: vars.parent_id }, vars.ordered_ids),
            );
            return { previous, listKey: vars.listKey };
        },
        onError: (err, _vars, context) => {
            if (err instanceof Error && err.message === 'REORDER_IN_FLIGHT') return;
            if (context) qc.setQueryData(context.listKey, context.previous);
            toast.error(getErrorMessage(err) || 'Failed to update order');
        },
        onSuccess: (updated, vars) => {
            qc.setQueryData(vars.listKey, (old: unknown) =>
                replaceWithUpdated(old, { categoryId: vars.category_id, parentId: vars.parent_id }, updated),
            );
            qc.invalidateQueries({ queryKey: vars.listKey });
            toast.success('Order updated', { id: 'reorder-topics' });
        },
    });
}
