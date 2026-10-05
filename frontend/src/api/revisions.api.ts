import apiClient from '@/lib/axios';
import type { Revision } from '@/lib/types';

export interface CompleteRevisionResponse {
    message: string;
    next_due_date: string;
    confidence: number;
}

// GET /api/revisions/due -> returns { revisions: Revision[] }
export async function getDueRevisionsApi(): Promise<Revision[]> {
    const response = await apiClient.get<{ revisions?: Revision[] }>('/api/revisions/due');
    return response.data.revisions || [];
}

// POST /api/revisions/:id/complete -> returns { message, next_due_date, confidence }
export async function completeRevisionApi(
    revisionId: string,
    confidence: number,
): Promise<CompleteRevisionResponse> {
    const response = await apiClient.post<CompleteRevisionResponse>(
        `/api/revisions/${revisionId}/complete`,
        { confidence },
    );
    return response.data;
}
