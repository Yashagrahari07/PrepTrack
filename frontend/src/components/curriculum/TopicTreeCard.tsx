import { Link } from 'react-router-dom';
import {
    ChevronDown,
    ChevronRight,
    ChevronUp,
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
import { useUpdateTopic } from '@/hooks/useCurriculum';
import { useAppStore } from '@/stores/app/app.store';
import type { Topic, TopicStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DragHandle, SortableItem, SortableList } from '@/components/ui/SortableList';

export interface PendingDelete {
    kind: 'topic' | 'subtopic' | 'category' | 'resource';
    id: string;
    title: string;
}

interface TopicTreeCardProps {
    topic: Topic;
    categoryColor?: string;
    onAddSubtopic: (parentTopic: Topic) => void;
    onRequestDelete: (kind: 'topic' | 'subtopic', id: string, title: string) => void;
    dragHandle?: React.ReactNode;
    isFirst?: boolean;
    isLast?: boolean;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    moving?: boolean;
    reorderBusy?: boolean;
    subOrder?: {
        onReorder: (parentId: string, orderedIds: string[]) => void;
        movingId: string | null;
        busy: boolean;
        overlayTitle: (id: string) => React.ReactNode;
        onMove: (subId: string, dir: -1 | 1) => void;
        isFirst: (subId: string) => boolean;
        isLast: (subId: string) => boolean;
    } | null;
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

interface SubtopicRowProps {
    sub: Topic;
    index: number;
    total: number;
    dragHandle: React.ReactNode;
    moving: boolean;
    reorderBusy: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onStatusChange: (id: string, status: TopicStatus) => void;
    onRequestDelete: (id: string, title: string) => void;
}

function SubtopicRow({
    sub,
    index,
    total,
    dragHandle,
    moving,
    reorderBusy,
    onMoveUp,
    onMoveDown,
    onStatusChange,
    onRequestDelete,
}: SubtopicRowProps) {
    const subStatus = statusBadgeStyles[sub.status] || statusBadgeStyles.NOT_STARTED;
    return (
        <div
            className={cn(
                'flex items-center justify-between gap-2 flex-wrap py-1.5 px-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors',
                moving && 'opacity-60 motion-safe:animate-pulse',
            )}
        >
            <div className="flex items-center gap-2 min-w-0">
                {dragHandle}
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                <Link
                    to={`/home/topics/${sub.id}`}
                    className="text-xs font-medium text-foreground hover:text-primary transition-colors truncate"
                    title="Open Subtopic Studio (Resources & Notes)"
                >
                    {sub.title}
                </Link>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                <span className="flex items-center shrink-0" role="group" aria-label={`Reorder ${sub.title}`}>
                    <button
                        type="button"
                        onClick={onMoveUp}
                        disabled={reorderBusy || index === 0}
                        title="Move up"
                        aria-label={`Move ${sub.title} up`}
                        className="p-1 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                        <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={onMoveDown}
                        disabled={reorderBusy || index === total - 1}
                        title="Move down"
                        aria-label={`Move ${sub.title} down`}
                        className="p-1 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                </span>
                <Link
                    to={`/home/topics/${sub.id}`}
                    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors px-1.5 py-0.5 rounded bg-muted/40"
                    title="Open Subtopic Studio"
                >
                    <span>Studio</span>
                    <ExternalLink className="w-3 h-3" />
                </Link>

                <select
                    value={sub.status}
                    onChange={(e) => onStatusChange(sub.id, e.target.value as TopicStatus)}
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

                <button
                    type="button"
                    onClick={() => onRequestDelete(sub.id, sub.title)}
                    className="p-1 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete subtopic"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

export function TopicTreeCard({
    topic,
    categoryColor = '#6366f1',
    onAddSubtopic,
    onRequestDelete,
    dragHandle,
    isFirst = false,
    isLast = false,
    onMoveUp,
    onMoveDown,
    moving = false,
    reorderBusy = false,
    subOrder = null,
}: TopicTreeCardProps) {
    const { mutate: updateTopic } = useUpdateTopic();
    const openQuickLog = useAppStore((s) => s.openQuickLog);

    // ── Curriculum slice: persist expanded state globally ─────────────────
    const expandedTopicIds = useAppStore((s) => s.expandedTopicIds);
    const toggleTopicExpanded = useAppStore((s) => s.toggleTopicExpanded);
    const isExpanded = expandedTopicIds.includes(topic.id);

    const subtopics = topic.subtopics || [];

    const handleStatusChange = (newStatus: TopicStatus) => {
        updateTopic({ id: topic.id, data: { status: newStatus } });
    };

    const handleSubStatusChange = (id: string, status: TopicStatus) => {
        updateTopic({ id, data: { status } });
    };

    const handleConfidenceChange = (newConf: number) => {
        updateTopic({ id: topic.id, data: { confidence: newConf } });
    };

    const currentStatusConfig = statusBadgeStyles[topic.status] || statusBadgeStyles.NOT_STARTED;

    return (
        <div
            className={cn(
                'glass-panel rounded-2xl p-4 sm:p-5 border border-border flex flex-col gap-3 transition-all duration-200 hover:border-border/80',
                moving && 'opacity-60 motion-safe:animate-pulse',
            )}
        >
            {/* Main Topic Row */}
            <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                {/* Title & Expand toggle */}
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    {dragHandle}
                    {subtopics.length > 0 && (
                        <button
                            type="button"
                            onClick={() => toggleTopicExpanded(topic.id)}
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
                                to={`/home/topics/${topic.id}`}
                                className="font-semibold text-foreground text-sm sm:text-base hover:text-primary transition-colors truncate flex items-center gap-1.5"
                                title="Click to open Topic Studio (Resources & Notes)"
                            >
                                <span className="truncate">{topic.title}</span>
                            </Link>
                        </div>

                        {/* Metadata row */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <Link
                                to={`/home/topics/${topic.id}`}
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
                    {/* Reorder chevrons */}
                    {onMoveUp && onMoveDown && (
                        <span className="flex items-center shrink-0" role="group" aria-label={`Reorder ${topic.title}`}>
                            <button
                                type="button"
                                onClick={onMoveUp}
                                disabled={reorderBusy || isFirst}
                                title="Move up"
                                aria-label={`Move ${topic.title} up`}
                                className="p-1.5 rounded-xl text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                            >
                                <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={onMoveDown}
                                disabled={reorderBusy || isLast}
                                title="Move down"
                                aria-label={`Move ${topic.title} down`}
                                className="p-1.5 rounded-xl text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </span>
                    )}

                    {/* Open Workspace Studio Button */}
                    <Link
                        to={`/home/topics/${topic.id}`}
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
                        onClick={() => onRequestDelete('topic', topic.id, topic.title)}
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
                    {subOrder ? (
                        <SortableList
                            ids={subtopics.map((s) => s.id)}
                            disabled={subOrder.busy}
                            overlayTitle={(id) => subtopics.find((s) => s.id === id)?.title ?? 'Subtopic'}
                            onReorder={(ids) => subOrder.onReorder(topic.id, ids)}
                        >
                            {subtopics.map((sub, i) => (
                                <SortableItem key={sub.id} id={sub.id} disabled={subOrder.busy}>
                                    {({ handleProps, isDragging }) => (
                                        <SubtopicRow
                                            sub={sub}
                                            index={i}
                                            total={subtopics.length}
                                            dragHandle={
                                                <DragHandle
                                                    handleProps={handleProps}
                                                    label={`Drag subtopic ${sub.title} to reorder`}
                                                />
                                            }
                                            moving={subOrder.movingId === sub.id || isDragging}
                                            reorderBusy={subOrder.busy}
                                            onMoveUp={() => subOrder.onMove(sub.id, -1)}
                                            onMoveDown={() => subOrder.onMove(sub.id, 1)}
                                            onStatusChange={handleSubStatusChange}
                                            onRequestDelete={(id, title) => onRequestDelete('subtopic', id, title)}
                                        />
                                    )}
                                </SortableItem>
                            ))}
                        </SortableList>
                    ) : (
                        subtopics.map((sub, i) => (
                            <SubtopicRow
                                key={sub.id}
                                sub={sub}
                                index={i}
                                total={subtopics.length}
                                dragHandle={null}
                                moving={false}
                                reorderBusy
                                onMoveUp={() => {}}
                                onMoveDown={() => {}}
                                onStatusChange={handleSubStatusChange}
                                onRequestDelete={(id, title) => onRequestDelete('subtopic', id, title)}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
