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

export interface CategoryGroup {
    category_id: string;
    category_name: string;
    color: string;
    position: number;
    topics: Topic[];
}

export interface ReorderTopicsRequest {
    category_id: string;
    parent_id: string | null;
    ordered_ids: string[];
}

export interface ReorderResourcesRequest {
    topic_id: string;
    ordered_ids: string[];
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
    position: number;
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

export interface CategoryProgressItem {
    category_id: string;
    category_name: string;
    color: string;
    total_topics: number;
    learned: number;
    in_progress: number;
    not_started: number;
}

export interface HeatmapItem {
    date: string;
    minutes: number;
}

export interface DashboardResponse {
    streak_days: number;
    weekly_hours: number;
    weekly_target_hours: number;
    revisions_due_count: number;
    focus_topic: Topic | null;
    category_progress: CategoryProgressItem[];
    heatmap: HeatmapItem[];
}

export interface WeeklyChartItem {
    week_start: string;
    hours: number;
}

export interface TopTopicItem {
    topic_id: string;
    topic_title: string;
    category_name: string;
    total_minutes: number;
}

export interface StatsResponse {
    total_logged_minutes: number;
    total_sessions: number;
    weekly_hours_chart: WeeklyChartItem[];
    top_topics: TopTopicItem[];
    heatmap: HeatmapItem[];
}

export interface UserSettings {
    user_id?: string;
    weekly_target_hours: number;
    reference_sheet_url: string;
    goal_type: string | null;
    goal_custom_text: string | null;
    show_reference_sheet: boolean;
    updated_at?: string;
}

export interface UpdateSettingsRequest {
    weekly_target_hours?: number;
    reference_sheet_url?: string;
    goal_type?: string | null;
    goal_custom_text?: string | null;
    show_reference_sheet?: boolean;
}
