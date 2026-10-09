import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { useCompleteRevision } from '@/hooks/useRevisions';
import type { Revision } from '@/lib/types';

interface RevisionQueueCardProps {
    revision: Revision;
}

export function RevisionQueueCard({ revision }: RevisionQueueCardProps) {
    const { mutate: completeRevision, isPending } = useCompleteRevision();
    const [selectedStars, setSelectedStars] = useState<number | null>(null);

    const handleRate = (rating: number) => {
        setSelectedStars(rating);
        completeRevision({ revisionId: revision.id, confidence: rating });
    };

    const isOverdue = revision.days_overdue && revision.days_overdue > 0;

    return (
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-4 transition-all hover:border-border/80">
            {/* Category & Overdue Badge */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    {revision.category_name}
                </span>

                {isOverdue ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                        <AlertTriangle className="w-3 h-3" />
                        {revision.days_overdue} days overdue
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted/40 px-2.5 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        Due today ({revision.due_on})
                    </span>
                )}
            </div>

            {/* Topic Title & Workspace link */}
            <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-foreground text-base sm:text-lg tracking-tight min-w-0 break-words">
                    {revision.topic_title}
                </h3>

                <Link
                    to={`/home/topics/${revision.topic_id}`}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 shrink-0 font-medium"
                    title="Open Topic Workspace"
                >
                    <span>Notes</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                </Link>
            </div>

            {/* Notes preview if available */}
            {revision.notes_md && (
                <div className="p-3 rounded-2xl bg-card border border-border text-xs text-muted-foreground line-clamp-3 leading-relaxed font-mono">
                    {revision.notes_md}
                </div>
            )}

            {/* Self-Rating Rating Bar */}
            <div className="mt-2 pt-4 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-semibold text-foreground">
                    Rate retention to complete revision:
                </span>

                <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                        { stars: 1, label: '1 - Poor (D+1)', color: 'hover:bg-rose-500/20 text-rose-400' },
                        { stars: 2, label: '2 - Hard (D+1)', color: 'hover:bg-rose-500/20 text-rose-400' },
                        { stars: 3, label: '3 - Good (D+3)', color: 'hover:bg-amber-500/20 text-amber-400' },
                        { stars: 4, label: '4 - Solid (D+7)', color: 'hover:bg-sky-500/20 text-sky-400' },
                        { stars: 5, label: '5 - Mastered (D+21)', color: 'hover:bg-emerald-500/20 text-emerald-400' },
                    ].map((btn) => (
                        <button
                            key={btn.stars}
                            type="button"
                            disabled={isPending}
                            onClick={() => handleRate(btn.stars)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-border bg-card transition-all ${btn.color} ${
                                selectedStars === btn.stars ? 'ring-2 ring-primary' : ''
                            }`}
                            title={btn.label}
                        >
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{btn.stars}★</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
