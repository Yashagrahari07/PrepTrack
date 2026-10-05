// ============================================================
// PrepTrack — Centralized Query Key Factory
// Prevents cache collisions and enables precise invalidations.
// ============================================================

export const queryKeys = {
    auth: {
        me: ['auth', 'me'] as const,
    },
    dashboard: {
        all: ['dashboard'] as const,
        overview: () => [...queryKeys.dashboard.all, 'overview'] as const,
        heatmap: (weeks: number) => [...queryKeys.dashboard.all, 'heatmap', weeks] as const,
    },
    categories: {
        all: ['categories'] as const,
        tree: () => [...queryKeys.categories.all, 'tree'] as const,
        byId: (id: string) => [...queryKeys.categories.all, id] as const,
    },
    topics: {
        all: ['topics'] as const,
        byId: (id: string) => [...queryKeys.topics.all, id] as const,
        notes: (id: string) => [...queryKeys.topics.all, id, 'notes'] as const,
        resources: (id: string) => [...queryKeys.topics.all, id, 'resources'] as const,
    },
    studyLogs: {
        all: ['studyLogs'] as const,
        byTopic: (topicId: string) => [...queryKeys.studyLogs.all, 'topic', topicId] as const,
        recent: () => [...queryKeys.studyLogs.all, 'recent'] as const,
    },
    revisions: {
        all: ['revisions'] as const,
        due: () => [...queryKeys.revisions.all, 'due'] as const,
    },
    settings: {
        all: ['settings'] as const,
    },
    stats: {
        all: ['stats'] as const,
    },
};
