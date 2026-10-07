import type { StateCreator } from 'zustand';

export interface SettingsSlice {
    weeklyTargetHoursDraft: number | null;
    setWeeklyTargetHoursDraft: (hours: number | null) => void;
    referenceSheetUrlDraft: string | null;
    setReferenceSheetUrlDraft: (url: string | null) => void;
    goalTypeDraft: string | null;
    setGoalTypeDraft: (type: string | null) => void;
    goalCustomTextDraft: string | null;
    setGoalCustomTextDraft: (text: string | null) => void;
    showReferenceSheetDraft: boolean | null;
    setShowReferenceSheetDraft: (show: boolean | null) => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice, [], [], SettingsSlice> = (set) => ({
    weeklyTargetHoursDraft: null,
    setWeeklyTargetHoursDraft: (hours) => set({ weeklyTargetHoursDraft: hours }),
    referenceSheetUrlDraft: null,
    setReferenceSheetUrlDraft: (url) => set({ referenceSheetUrlDraft: url }),
    goalTypeDraft: null,
    setGoalTypeDraft: (type) => set({ goalTypeDraft: type }),
    goalCustomTextDraft: null,
    setGoalCustomTextDraft: (text) => set({ goalCustomTextDraft: text }),
    showReferenceSheetDraft: null,
    setShowReferenceSheetDraft: (show) => set({ showReferenceSheetDraft: show }),
});
