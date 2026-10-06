import type { StateCreator } from 'zustand';

export interface SettingsSlice {
    weeklyTargetHoursDraft: number | null;
    setWeeklyTargetHoursDraft: (hours: number | null) => void;
    dsaSheetUrlDraft: string | null;
    setDsaSheetUrlDraft: (url: string | null) => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice, [], [], SettingsSlice> = (set) => ({
    weeklyTargetHoursDraft: null,
    setWeeklyTargetHoursDraft: (hours) => set({ weeklyTargetHoursDraft: hours }),
    dsaSheetUrlDraft: null,
    setDsaSheetUrlDraft: (url) => set({ dsaSheetUrlDraft: url }),
});
