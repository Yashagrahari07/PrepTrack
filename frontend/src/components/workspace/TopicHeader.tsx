import { Link } from 'react-router-dom';
import { ArrowLeft, Star, Flame, CheckCircle2, PlayCircle, Circle } from 'lucide-react';
import { useUpdateTopic } from '@/hooks/useCurriculum';
import type { Topic, TopicStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TopicHeaderProps {
    topic: Topic;
}

const statusBadgeStyles: Record<TopicStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    NOT_STARTED: {
        label: 'Not Started',
        bg: 'bg-muted/50 border-muted-foreground/20',
        text: 'text-muted-foreground',
        icon: <Circle className="w-3.5 h-3.5" />,
    },
    IN_PROGRESS: {
        label: 'In Progress',
        bg: 'bg-amber-500/10 border-amber-500/30',
        text: 'text-amber-400',
        icon: <PlayCircle className="w-3.5 h-3.5" />,
    },
    LEARNED: {
        label: 'Learned',
        bg: 'bg-sky-500/10 border-sky-500/30',
        text: 'text-sky-400',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    INTERVIEW_READY: {
        label: 'Interview Ready',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        text: 'text-emerald-400',
        icon: <Flame className="w-3.5 h-3.5 text-emerald-400 animate-pulse-flame" />,
    },
};

export function TopicHeader({ topic }: TopicHeaderProps) {
    const { mutate: updateTopic } = useUpdateTopic();

    const handleStatusChange = (newStatus: TopicStatus) => {
        updateTopic({ id: topic.id, data: { status: newStatus } });
    };

    const handleConfidenceChange = (newConf: number) => {
        updateTopic({ id: topic.id, data: { confidence: newConf } });
    };

    const currentStatusConfig = statusBadgeStyles[topic.status] || statusBadgeStyles.NOT_STARTED;

    return (
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-4">
            {/* Back link */}
            <div>
                <Link
                    to="/app/curriculum"
                    className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Curriculum</span>
                </Link>
            </div>

            {/* Title & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                    {topic.category_name && (
                        <div className="inline-flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                                {topic.category_name}
                            </span>
                        </div>
                    )}
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                        {topic.title}
                    </h1>
                </div>

                {/* Status Dropdown & Confidence Rating */}
                <div className="flex items-center gap-4 flex-wrap">
                    {/* Status Dropdown */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                            Topic Status
                        </span>
                        <select
                            value={topic.status}
                            onChange={(e) => handleStatusChange(e.target.value as TopicStatus)}
                            className={cn(
                                'px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer focus:outline-none transition-all',
                                currentStatusConfig.bg,
                                currentStatusConfig.text,
                            )}
                        >
                            <option value="NOT_STARTED">Not Started</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="LEARNED">Learned</option>
                            <option value="INTERVIEW_READY">Interview Ready</option>
                        </select>
                    </div>

                    {/* Confidence Stars */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                            Confidence ({topic.confidence}/5)
                        </span>
                        <div className="flex items-center gap-1 bg-muted/30 px-3 py-1.5 rounded-xl border border-border">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleConfidenceChange(star)}
                                    className="text-muted-foreground/40 hover:text-amber-400 transition-colors"
                                    title={`Rate confidence ${star}/5`}
                                >
                                    <Star
                                        className={cn(
                                            'w-4 h-4',
                                            star <= topic.confidence
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'text-muted-foreground/30',
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
