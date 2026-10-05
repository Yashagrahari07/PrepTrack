import apiClient from '@/lib/axios';
import type { StudyLog } from '@/lib/types';

export interface CreateStudyLogRequest {
    topic_id: string;
    minutes: number;
    comment?: string;
    logged_on?: string;
}

// POST /api/study-logs -> returns { log: StudyLog }
export async function createStudyLogApi(data: CreateStudyLogRequest): Promise<StudyLog> {
    const response = await apiClient.post<{ log: StudyLog }>('/api/study-logs', data);
    return response.data.log;
}

// GET /api/topics/:id/logs -> returns { logs: StudyLog[] }
export async function getTopicStudyLogsApi(topicId: string): Promise<StudyLog[]> {
    const response = await apiClient.get<{ logs?: StudyLog[] }>(`/api/topics/${topicId}/logs`);
    return response.data.logs || [];
}
