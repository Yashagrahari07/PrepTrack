import type { StateCreator } from 'zustand';
import type { Topic } from '@/lib/types';

export interface UISlice {
    // Sidebar
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;

    // Theme
    theme: 'dark' | 'light';
    toggleTheme: () => void;
    setTheme: (theme: 'dark' | 'light') => void;

    // Quick Log Modal
    isQuickLogOpen: boolean;
    quickLogTopicId: string | null;
    openQuickLog: (topicId?: string) => void;
    closeQuickLog: () => void;

    // Category Modal
    isCategoryModalOpen: boolean;
    openCategoryModal: () => void;
    closeCategoryModal: () => void;

    // Topic Modal
    isTopicModalOpen: boolean;
    topicModalParent: Topic | null;
    topicModalCategoryId: string | null;
    openTopicModal: (options?: { categoryId?: string; parentTopic?: Topic }) => void;
    closeTopicModal: () => void;

    // Command Menu
    isCommandMenuOpen: boolean;
    openCommandMenu: () => void;
    closeCommandMenu: () => void;

    // Global Rate Limiting State
    rateLimit: {
        isLimited: boolean;
        secondsRemaining: number;
        message: string | null;
    };
    setRateLimit: (seconds: number, message?: string) => void;
    clearRateLimit: () => void;
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
    // Sidebar
    isSidebarOpen: true,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setSidebarOpen: (open) => set({ isSidebarOpen: open }),

    // Theme
    theme: (localStorage.getItem('preptrack_theme') as 'dark' | 'light') ?? 'dark',
    toggleTheme: () =>
        set((state) => {
            const next = state.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('preptrack_theme', next);
            return { theme: next };
        }),
    setTheme: (theme) => {
        localStorage.setItem('preptrack_theme', theme);
        set({ theme });
    },

    // Quick Log
    isQuickLogOpen: false,
    quickLogTopicId: null,
    openQuickLog: (topicId) => set({ isQuickLogOpen: true, quickLogTopicId: topicId ?? null }),
    closeQuickLog: () => set({ isQuickLogOpen: false, quickLogTopicId: null }),

    // Category Modal
    isCategoryModalOpen: false,
    openCategoryModal: () => set({ isCategoryModalOpen: true }),
    closeCategoryModal: () => set({ isCategoryModalOpen: false }),

    // Topic Modal
    isTopicModalOpen: false,
    topicModalParent: null,
    topicModalCategoryId: null,
    openTopicModal: (options) =>
        set({
            isTopicModalOpen: true,
            topicModalCategoryId: options?.categoryId ?? null,
            topicModalParent: options?.parentTopic ?? null,
        }),
    closeTopicModal: () =>
        set({
            isTopicModalOpen: false,
            topicModalParent: null,
            topicModalCategoryId: null,
        }),

    // Command Menu
    isCommandMenuOpen: false,
    openCommandMenu: () => set({ isCommandMenuOpen: true }),
    closeCommandMenu: () => set({ isCommandMenuOpen: false }),

    // Rate Limit State
    rateLimit: {
        isLimited: false,
        secondsRemaining: 0,
        message: null,
    },
    setRateLimit: (seconds, message) =>
        set({
            rateLimit: {
                isLimited: true,
                secondsRemaining: seconds,
                message: message || `Too many requests. Please wait ${seconds} seconds.`,
            },
        }),
    clearRateLimit: () =>
        set({
            rateLimit: {
                isLimited: false,
                secondsRemaining: 0,
                message: null,
            },
        }),
});
