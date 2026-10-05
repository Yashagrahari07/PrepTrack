// ============================================================
// PrepTrack — Shared TypeScript Types & Enums
// ============================================================

export interface User {
    id: string;
    display_name: string;
    email: string;
    created_at?: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface SignupRequest {
    display_name: string;
    email: string;
    password: string;
    invite_code: string;
}

export type TopicStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'LEARNED' | 'INTERVIEW_READY';

export type ResourceType = 'YOUTUBE_VIDEO' | 'YOUTUBE_PLAYLIST' | 'DEV_BLOG' | 'OFFICIAL_DOCS' | 'OTHER';
export type ResourceStatus = 'TODO' | 'DOING' | 'DONE';

export interface Category {
    id: string;
    name: string;
    color: string;
    position: number;
    topic_count?: number;
}

export interface Topic {
    id: string;
    category_id: string;
    category_name?: string;
    parent_id: string | null;
    title: string;
    status: TopicStatus;
    confidence: number;
    notes_md?: string;
    position: number;
    resource_count?: number;
    subtopics?: Topic[];
}

export interface Resource {
    id: string;
    user_id?: string;
    topic_id: string;
    type: ResourceType;
    title: string;
    url: string;
    est_minutes: number;
    status: ResourceStatus;
    created_at?: string;
}

export interface StudyLog {
    id: string;
    user_id?: string;
    topic_id: string;
    logged_on: string;
    minutes: number;
    comment?: string;
    created_at?: string;
}

export interface Revision {
    id: string;
    user_id?: string;
    topic_id: string;
    topic_title: string;
    category_name: string;
    notes_md?: string;
    due_on: string;
    done_on?: string | null;
    confidence?: number | null;
    days_overdue?: number;
}

export interface CategoryProgress {
    category_id: string;
    name: string;
    color: string;
    total_topics: number;
    interview_ready: number;
    learned: number;
    in_progress: number;
    not_started: number;
}

export interface HeatmapDay {
    date: string;
    minutes: number;
}

export interface TodaysFocus {
    topic_id: string;
    category_name: string;
    topic_title: string;
    confidence: number;
}

export interface DashboardData {
    streak: number;
    weekly_logged_minutes: number;
    weekly_target_minutes: number;
    todays_focus: TodaysFocus | null;
    revisions_due_count: number;
    category_progress: CategoryProgress[];
    heatmap: HeatmapDay[];
}

export interface UserSettings {
    weekly_target_hours: number;
    dsa_sheet_url: string;
}
