import { create } from 'zustand';
import { createUISlice, type UISlice } from './ui.slice';
import { createWorkspaceSlice, type WorkspaceSlice } from './workspace.slice';
import { createCurriculumSlice, type CurriculumSlice } from './curriculum.slice';
import { createRevisionsSlice, type RevisionsSlice } from './revisions.slice';
import { createSettingsSlice, type SettingsSlice } from './settings.slice';

export type AppStoreState = UISlice & WorkspaceSlice & CurriculumSlice & RevisionsSlice & SettingsSlice;

export const useAppStore = create<AppStoreState>()((...a) => ({
    ...createUISlice(...a),
    ...createWorkspaceSlice(...a),
    ...createCurriculumSlice(...a),
    ...createRevisionsSlice(...a),
    ...createSettingsSlice(...a),
}));
