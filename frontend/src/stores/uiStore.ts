import { create } from 'zustand';

interface UIStore {
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
    activeTopicId: string | null;
    openQuickLog: (topicId?: string) => void;
    closeQuickLog: () => void;

    // Command Menu
    isCommandMenuOpen: boolean;
    openCommandMenu: () => void;
    closeCommandMenu: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
    // ── Sidebar ────────────────────────────────────────────────
    isSidebarOpen: true,
    toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
    setSidebarOpen: (open) => set({ isSidebarOpen: open }),

    // ── Theme ──────────────────────────────────────────────────
    theme: (localStorage.getItem('preptrack_theme') as 'dark' | 'light') ?? 'dark',
    toggleTheme: () =>
        set((s) => {
            const next = s.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('preptrack_theme', next);
            return { theme: next };
        }),
    setTheme: (theme) => {
        localStorage.setItem('preptrack_theme', theme);
        set({ theme });
    },

    // ── Quick Log Modal ────────────────────────────────────────
    isQuickLogOpen: false,
    activeTopicId: null,
    openQuickLog: (topicId) => set({ isQuickLogOpen: true, activeTopicId: topicId ?? null }),
    closeQuickLog: () => set({ isQuickLogOpen: false, activeTopicId: null }),

    // ── Command Menu ───────────────────────────────────────────
    isCommandMenuOpen: false,
    openCommandMenu: () => set({ isCommandMenuOpen: true }),
    closeCommandMenu: () => set({ isCommandMenuOpen: false }),
}));
