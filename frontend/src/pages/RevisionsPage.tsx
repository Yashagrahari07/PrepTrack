import { RotateCcw, CheckCircle2 } from 'lucide-react';
import { useDueRevisions } from '@/hooks/useRevisions';
import { RevisionQueueCard } from '@/components/revisions/RevisionQueueCard';
import type { Revision } from '@/lib/types';

export default function RevisionsPage() {
    const { data: rawRevisions = [], isLoading } = useDueRevisions();
    const revisions = Array.isArray(rawRevisions) ? rawRevisions : [];

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-3xl p-6 border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 ambient-glow-indigo opacity-40 pointer-events-none" />
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold mb-2 border border-rose-500/20">
                        <RotateCcw className="w-3.5 h-3.5" />
                        SM-2 Spaced Repetition Engine
                    </div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                        Spaced Revision Queue
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
                        Review concepts at D+1, D+3, D+7, and D+21 intervals. Rate retention to schedule your next review or achieve Interview-Ready status.
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-2xl border border-border shrink-0">
                    <span className="text-xs font-medium text-muted-foreground">Due Today:</span>
                    <span className="text-lg font-bold text-rose-400">{revisions.length}</span>
                </div>
            </div>

            {/* Revision Cards List */}
            {isLoading ? (
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-44 rounded-3xl bg-card border border-border animate-pulse" />
                    ))}
                </div>
            ) : revisions.length === 0 ? (
                <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3 border border-border">
                    <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-foreground text-lg">All Revisions Caught Up! 🎉</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                        Great job maintaining retention! No pending revisions due today. Mark new topics as &ldquo;Learned&rdquo; in Curriculum to schedule upcoming revision cycles.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {revisions.map((rev: Revision) => (
                        <RevisionQueueCard key={rev.id} revision={rev} />
                    ))}
                </div>
            )}
        </div>
    );
}
