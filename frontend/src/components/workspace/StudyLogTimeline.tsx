import { Clock, Plus, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTopicStudyLogs } from '@/hooks/useStudyLogs';
import { useAppStore } from '@/stores/app/app.store';
import type { StudyLog } from '@/lib/types';

interface StudyLogTimelineProps {
    topicId: string;
}

export function StudyLogTimeline({ topicId }: StudyLogTimelineProps) {
    const { data: rawLogs = [], isLoading } = useTopicStudyLogs(topicId);
    const logs = Array.isArray(rawLogs) ? rawLogs : [];
    const openQuickLog = useAppStore((s) => s.openQuickLog);

    const totalMinutes = logs.reduce((acc: number, l: StudyLog) => acc + (l.minutes || 0), 0);

    return (
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-foreground text-sm sm:text-base">Study History</h3>
                    <span className="text-xs text-muted-foreground font-semibold">
                        ({totalMinutes} mins total)
                    </span>
                </div>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openQuickLog(topicId)}
                    className="gap-1.5 text-xs"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Session</span>
                </Button>
            </div>

            {/* Timeline List */}
            {isLoading ? (
                <div className="flex flex-col gap-2">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-12 rounded-xl bg-card border border-border animate-pulse" />
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    <p>No study logs recorded for this topic yet.</p>
                </div>
            ) : (
                <div className="relative pl-4 border-l-2 border-primary/30 flex flex-col gap-3 my-1">
                    {logs.map((log: StudyLog) => (
                        <div key={log.id} className="relative flex items-start justify-between gap-3 group">
                            {/* Dot indicator */}
                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />

                            <div className="flex flex-col gap-0.5 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-foreground">
                                        {log.logged_on}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                        <Flame className="w-3 h-3" />
                                        {log.minutes} mins
                                    </span>
                                </div>

                                {log.comment && (
                                    <p className="text-xs text-muted-foreground italic truncate">
                                        &ldquo;{log.comment}&rdquo;
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
