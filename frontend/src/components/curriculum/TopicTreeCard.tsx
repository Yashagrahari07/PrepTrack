import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ChevronDown,
    ChevronRight,
    Star,
    BookOpen,
    Clock,
    Plus,
    Trash2,
    CheckCircle2,
    Circle,
    PlayCircle,
    Flame,
    ExternalLink,
} from 'lucide-react';
import { useUpdateTopic, useDeleteTopic } from '@/hooks/useCurriculum';
import { useUIStore } from '@/stores/uiStore';
import type { Topic, TopicStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TopicTreeCardProps {
    topic: Topic;
    categoryColor?: string;
    onAddSubtopic: (parentTopic: Topic) => void;
}

const statusBadgeStyles: Record<TopicStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    NOT_STARTED: {
        label: 'Not Started',
        bg: 'bg-muted/50 border-muted-foreground/20',
        text: 'text-muted-foreground',
        icon: <Circle className="w-3 h-3" />,
    },
    IN_PROGRESS: {
        label: 'In Progress',
        bg: 'bg-amber-500/10 border-amber-500/30',
        text: 'text-amber-400',
        icon: <PlayCircle className="w-3 h-3" />,
    },
    LEARNED: {
        label: 'Learned',
        bg: 'bg-sky-500/10 border-sky-500/30',
        text: 'text-sky-400',
        icon: <CheckCircle2 className="w-3 h-3" />,
    },
    INTERVIEW_READY: {
        label: 'Interview Ready',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        text: 'text-emerald-400',
        icon: <Flame className="w-3 h-3 text-emerald-400 animate-pulse-flame" />,
    },
};

export function TopicTreeCard({ topic, categoryColor = '#6366f1', onAddSubtopic }: TopicTreeCardProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const { mutate: updateTopic } = useUpdateTopic();
    const { mutate: deleteTopic } = useDeleteTopic();
    const { openQuickLog } = useUIStore();

    const subtopics = topic.subtopics || [];

    const handleStatusChange = (newStatus: TopicStatus) => {
        updateTopic({ id: topic.id, data: { status: newStatus } });
    };

    const handleConfidenceChange = (newConf: number) => {
        updateTopic({ id: topic.id, data: { confidence: newConf } });
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete "${topic.title}"?`)) {
            deleteTopic(topic.id);
        }
    };

    const currentStatusConfig = statusBadgeStyles[topic.status] || statusBadgeStyles.NOT_STARTED;

    return (
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-border flex flex-col gap-3 transition-all duration-200 hover:border-border/80">
            {/* Main Topic Row */}
            <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                {/* Title & Expand toggle */}
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    {subtopics.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setIsExpanded((prev) => !prev)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors mt-0.5 shrink-0"
                            aria-label="Expand or collapse subtopics"
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>
                    )}

                    <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: categoryColor }}
                            />
                            <Link
                                to={`/app/topics/${topic.id}`}
                                className="font-semibold text-foreground text-sm sm:text-base hover:text-primary transition-colors truncate flex items-center gap-1.5"
                                title="Click to open Topic Studio (Resources & Notes)"
                            >
                                <span className="truncate">{topic.title}</span>
                            </Link>
                        </div>

                        {/* Metadata row */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <Link
                                to={`/app/topics/${topic.id}`}
                                className="flex items-center gap-1 hover:text-primary transition-colors"
                                title="Attached Resources"
                            >
                                <BookOpen className="w-3 h-3 text-sky-400" />
                                <span>{topic.resource_count ?? 0} resources</span>
                            </Link>

                            {/* Confidence Star Rating */}
                            <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => handleConfidenceChange(star)}
                                        className="text-muted-foreground/40 hover:text-amber-400 transition-colors"
                                        title={`Set confidence to ${star}/5`}
                                    >
                                        <Star
                                            className={cn(
                                                'w-3 h-3',
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

                {/* Right Actions: Workspace link, Status Dropdown & Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                    {/* Open Workspace Studio Button */}
                    <Link
                        to={`/app/topics/${topic.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium border border-primary/20 transition-all"
                        title="Open Topic Studio to attach resources, write markdown notes, & view logs"
                    >
                        <span>Studio</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    {/* Status Dropdown */}
                    <select
                        value={topic.status}
                        onChange={(e) => handleStatusChange(e.target.value as TopicStatus)}
                        className={cn(
                            'px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer focus:outline-none transition-all',
                            currentStatusConfig.bg,
                            currentStatusConfig.text,
                        )}
                    >
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="LEARNED">Learned</option>
                        <option value="INTERVIEW_READY">Interview Ready</option>
                    </select>

                    {/* Quick Log button */}
                    <button
                        type="button"
                        onClick={() => openQuickLog(topic.id)}
                        className="p-1.5 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Log study time for this topic"
                    >
                        <Clock className="w-4 h-4" />
                    </button>

                    {/* Add Subtopic */}
                    <button
                        type="button"
                        onClick={() => onAddSubtopic(topic)}
                        className="p-1.5 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Add subtopic under this topic"
                    >
                        <Plus className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="p-1.5 rounded-xl hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete topic"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Nested Subtopics Accordion */}
            {isExpanded && subtopics.length > 0 && (
                <div className="mt-2 pl-4 border-l-2 border-border/60 flex flex-col gap-2">
                    {subtopics.map((sub) => {
                        const subStatus = statusBadgeStyles[sub.status] || statusBadgeStyles.NOT_STARTED;
                        return (
                            <div
                                key={sub.id}
                                className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                                    <Link
                                        to={`/app/topics/${sub.id}`}
                                        className="text-xs font-medium text-foreground hover:text-primary transition-colors truncate"
                                        title="Open Subtopic Studio (Resources & Notes)"
                                    >
                                        {sub.title}
                                    </Link>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <Link
                                        to={`/app/topics/${sub.id}`}
                                        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors px-1.5 py-0.5 rounded bg-muted/40"
                                        title="Open Subtopic Studio"
                                    >
                                        <span>Studio</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </Link>

                                    <select
                                        value={sub.status}
                                        onChange={(e) =>
                                            updateTopic({
                                                id: sub.id,
                                                data: { status: e.target.value as TopicStatus },
                                            })
                                        }
                                        className={cn(
                                            'px-2 py-0.5 rounded-lg text-[10px] font-medium border cursor-pointer focus:outline-none',
                                            subStatus.bg,
                                            subStatus.text,
                                        )}
                                    >
                                        <option value="NOT_STARTED">Not Started</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="LEARNED">Learned</option>
                                        <option value="INTERVIEW_READY">Interview Ready</option>
                                    </select>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
