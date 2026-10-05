import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/api/queryKeys';
import { createStudyLogApi, getTopicStudyLogsApi, type CreateStudyLogRequest } from '@/api/studyLogs.api';

export function useTopicStudyLogs(topicId: string | null) {
    return useQuery({
        queryKey: topicId ? queryKeys.studyLogs.byTopic(topicId) : ['studyLogs', 'none'],
        queryFn: () => getTopicStudyLogsApi(topicId!),
        enabled: Boolean(topicId),
        staleTime: 1000 * 60 * 2,
    });
}

export function useCreateStudyLog() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateStudyLogRequest) => createStudyLogApi(data),
        onSuccess: (newLog) => {
            qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
            qc.invalidateQueries({ queryKey: queryKeys.studyLogs.all });
            qc.invalidateQueries({ queryKey: queryKeys.topics.byId(newLog.topic_id) });
            toast.success(`Logged ${newLog.minutes} mins! Streak & stats updated. 🔥`);
        },
        onError: () => {
            toast.error('Failed to log study time.');
        },
    });
}
