import type { StateCreator } from 'zustand';

export type RevisionFilter = 'ALL' | 'DUE' | 'COMPLETED';

export interface RevisionsSlice {
    revisionFilter: RevisionFilter;
    setRevisionFilter: (filter: RevisionFilter) => void;
    confidenceFilter: number | null; // 1-5 or null for all
    setConfidenceFilter: (confidence: number | null) => void;
}

export const createRevisionsSlice: StateCreator<RevisionsSlice, [], [], RevisionsSlice> = (set) => ({
    revisionFilter: 'DUE',
    setRevisionFilter: (filter) => set({ revisionFilter: filter }),
    confidenceFilter: null,
    setConfidenceFilter: (confidence) => set({ confidenceFilter: confidence }),
});
