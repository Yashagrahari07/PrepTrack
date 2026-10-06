import type { StateCreator } from 'zustand';

export interface CurriculumSlice {
    selectedCategoryId: string | null;
    setSelectedCategoryId: (id: string | null) => void;
    curriculumSearch: string;
    setCurriculumSearch: (query: string) => void;
    expandedTopicIds: string[];
    toggleTopicExpanded: (topicId: string) => void;
    setTopicExpanded: (topicId: string, expanded: boolean) => void;
}

export const createCurriculumSlice: StateCreator<CurriculumSlice, [], [], CurriculumSlice> = (set) => ({
    selectedCategoryId: null,
    setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
    curriculumSearch: '',
    setCurriculumSearch: (query) => set({ curriculumSearch: query }),
    expandedTopicIds: [],
    toggleTopicExpanded: (topicId) =>
        set((state) => {
            const exists = state.expandedTopicIds.includes(topicId);
            return {
                expandedTopicIds: exists
                    ? state.expandedTopicIds.filter((id) => id !== topicId)
                    : [...state.expandedTopicIds, topicId],
            };
        }),
    setTopicExpanded: (topicId, expanded) =>
        set((state) => {
            const exists = state.expandedTopicIds.includes(topicId);
            if (expanded && !exists) {
                return { expandedTopicIds: [...state.expandedTopicIds, topicId] };
            }
            if (!expanded && exists) {
                return { expandedTopicIds: state.expandedTopicIds.filter((id) => id !== topicId) };
            }
            return state;
        }),
});
