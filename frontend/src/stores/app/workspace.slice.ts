import type { StateCreator } from 'zustand';

export type WorkspaceTab = 'notes' | 'resources' | 'logs';

export interface WorkspaceSlice {
    activeTab: WorkspaceTab;
    setActiveTab: (tab: WorkspaceTab) => void;
    draftNotes: Record<string, string>; // topicId -> draft markdown content
    setDraftNote: (topicId: string, content: string) => void;
    clearDraftNote: (topicId: string) => void;
}

export const createWorkspaceSlice: StateCreator<WorkspaceSlice, [], [], WorkspaceSlice> = (set) => ({
    activeTab: 'notes',
    setActiveTab: (tab) => set({ activeTab: tab }),
    draftNotes: {},
    setDraftNote: (topicId, content) =>
        set((state) => ({
            draftNotes: { ...state.draftNotes, [topicId]: content },
        })),
    clearDraftNote: (topicId) =>
        set((state) => {
            const next = { ...state.draftNotes };
            delete next[topicId];
            return { draftNotes: next };
        }),
});
