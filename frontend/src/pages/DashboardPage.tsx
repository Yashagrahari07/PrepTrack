import { Link } from 'react-router-dom';
import {
    Flame,
    BookOpen,
    RotateCcw,
    BarChart3,
    ArrowRight,
    Target,
    Sparkles,
    CheckCircle2,
    Clock,
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { Button } from '@/components/ui/button';

// Helper to determine heatmap cell intensity class
function getHeatmapColor(minutes: number): string {
    if (minutes === 0) return 'bg-muted/40 border border-white/5';
    if (minutes < 30) return 'bg-emerald-500/30 border border-emerald-500/40 text-emerald-300';
    if (minutes < 60) return 'bg-emerald-500/60 border border-emerald-500/70 text-emerald-200';
    if (minutes < 120) return 'bg-emerald-500/80 border border-emerald-400 text-emerald-100';
    return 'bg-emerald-400 border border-emerald-300 shadow-sm shadow-emerald-500/50 text-emerald-950 font-bold';
}

export default function DashboardPage() {
    const { data: user } = useCurrentUser();
    const { data: dashboard, isLoading } = useDashboard();

    const streakDays = dashboard?.streak_days ?? 0;
    const weeklyHours = dashboard?.weekly_hours ?? 0;
    const weeklyTargetHours = dashboard?.weekly_target_hours ?? 15.0;
    const weeklyProgressPct = Math.min(100, Math.round((weeklyHours / weeklyTargetHours) * 100));
    const revisionsDueCount = dashboard?.revisions_due_count ?? 0;
    const focusTopic = dashboard?.focus_topic ?? null;
    const categoryProgress = Array.isArray(dashboard?.category_progress) ? dashboard.category_progress : [];
    const heatmap = Array.isArray(dashboard?.heatmap) ? dashboard.heatmap : [];

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 animate-pulse">
                <div className="h-32 rounded-3xl bg-card border border-border" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-28 rounded-2xl bg-card border border-border" />
                    ))}
                </div>
                <div className="h-64 rounded-3xl bg-card border border-border" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            {/* ── Welcome Banner ─────────────────────────────────── */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 ambient-glow-indigo opacity-50 pointer-events-none" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
                            <span>Welcome back, {user?.display_name ?? 'Engineer'}!</span>
                            <Sparkles className="w-5 h-5 text-amber-400 animate-bounce" />
                        </h2>
                        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-xl">
                            Consistency is your greatest advantage. Keep building momentum towards your SDE 1 target.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link to="/app/curriculum">
                            <Button size="sm" className="gap-2 shadow-lg shadow-primary/20">
                                <BookOpen className="w-4 h-4" />
                                <span>Curriculum</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Stat Cards ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Day Streak */}
                <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between gap-3 border border-white/10 hover:border-amber-500/30 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                            Active Streak
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                            <Flame className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                            {streakDays} {streakDays === 1 ? 'Day' : 'Days'}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                            {streakDays > 0 ? (
                                <span className="text-amber-400 font-medium">🔥 Streak Active</span>
                            ) : (
                                <span>Log 30+ mins today to start</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Weekly Target Progress */}
                <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between gap-3 border border-white/10 hover:border-sky-500/30 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                            Weekly Goal
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
                            <BarChart3 className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                            {weeklyHours.toFixed(1)}h{' '}
                            <span className="text-xs text-muted-foreground font-normal">
                                / {weeklyTargetHours}h
                            </span>
                        </div>
                        <div className="w-full bg-muted/50 h-2 rounded-full mt-2 overflow-hidden">
                            <div
                                className="bg-sky-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${weeklyProgressPct}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Revisions Due Alert */}
                <Link
                    to="/app/revisions"
                    className="glass-panel rounded-2xl p-5 flex flex-col justify-between gap-3 border border-white/10 hover:border-rose-500/30 transition-all group"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                            Pending Revisions
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                            <RotateCcw className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                            {revisionsDueCount}
                        </div>
                        <p className="text-[11px] text-rose-400 font-medium mt-1 flex items-center gap-1">
                            <span>Review queue</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </p>
                    </div>
                </Link>

                {/* Domain Mastery */}
                <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between gap-3 border border-white/10 hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                            Domains Configured
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <Target className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                            {categoryProgress.length}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            {categoryProgress.reduce((acc, c) => acc + c.learned, 0)} topics learned
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Today's Focus & Revisions Alert Banner ──────────────── */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Focus Topic Card */}
                <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold text-foreground">Today&apos;s Focus Topic</h3>
                        </div>
                        {focusTopic && (
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                Recommended
                            </span>
                        )}
                    </div>

                    {focusTopic ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-card/60 p-4 border border-border">
                            <div className="flex flex-col gap-1 min-w-0">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    {focusTopic.category_name || 'Curriculum'}
                                </span>
                                <h4 className="text-base font-bold text-foreground truncate">
                                    {focusTopic.title}
                                </h4>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                    <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                                        ★ {focusTopic.confidence}/5 Confidence
                                    </span>
                                    <span>•</span>
                                    <span className="capitalize">{focusTopic.status.replace('_', ' ').toLowerCase()}</span>
                                </div>
                            </div>

                            <Link to={`/app/topics/${focusTopic.id}`}>
                                <Button size="sm" className="gap-2 shrink-0">
                                    <span>Study Topic</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-border p-6 text-center flex flex-col items-center gap-2">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-1" />
                            <h4 className="text-sm font-bold text-foreground">All Caught Up!</h4>
                            <p className="text-xs text-muted-foreground max-w-md">
                                You have no urgent topics pending. Select a topic from your curriculum or log a study session.
                            </p>
                        </div>
                    )}
                </div>

                {/* Quick Revision CTA */}
                <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-rose-400" />
                            <h3 className="text-sm font-bold text-foreground">Spaced Retention</h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {revisionsDueCount > 0
                                ? `You have ${revisionsDueCount} topic flashcard${revisionsDueCount > 1 ? 's' : ''} ready for interval revision today.`
                                : 'No flashcards currently due. Revisions are scheduled automatically when topics are marked as Learned.'}
                        </p>
                    </div>

                    <Link to="/app/revisions">
                        <Button
                            variant={revisionsDueCount > 0 ? 'default' : 'outline'}
                            className="w-full justify-between gap-2"
                        >
                            <span>Open Revisions</span>
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* ── 12-Week Activity Heatmap ─────────────────────────── */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h3 className="text-sm font-bold text-foreground">12-Week Consistency Matrix</h3>
                        <p className="text-xs text-muted-foreground">Daily study time tracking over the past 84 days</p>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span>Less</span>
                        <div className="w-3 h-3 rounded bg-muted/40 border border-white/5" />
                        <div className="w-3 h-3 rounded bg-emerald-500/30" />
                        <div className="w-3 h-3 rounded bg-emerald-500/60" />
                        <div className="w-3 h-3 rounded bg-emerald-500/80" />
                        <div className="w-3 h-3 rounded bg-emerald-400" />
                        <span>More</span>
                    </div>
                </div>

                {/* Heatmap Grid */}
                <div className="grid grid-cols-12 sm:grid-cols-[repeat(21,minmax(0,1fr))] md:grid-cols-[repeat(28,minmax(0,1fr))] gap-1.5 pt-2">
                    {heatmap.length === 0
                        ? Array.from({ length: 84 }, (_, i) => (
                              <div
                                  key={i}
                                  className="aspect-square rounded-md bg-muted/40 border border-white/5"
                              />
                          ))
                        : heatmap.map((day) => (
                              <div
                                  key={day.date}
                                  title={`${day.date}: ${day.minutes} mins`}
                                  className={`aspect-square rounded-md flex items-center justify-center transition-transform hover:scale-125 ${getHeatmapColor(
                                      day.minutes,
                                  )}`}
                              />
                          ))}
                </div>
            </div>

            {/* ── Category Mastery Progress Grid ──────────────────── */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-foreground">Curriculum Domain Progress</h3>
                        <p className="text-xs text-muted-foreground">Breakdown of topic states by domain</p>
                    </div>

                    <Link to="/app/curriculum" className="text-xs text-primary font-semibold hover:underline">
                        Manage Domains &rarr;
                    </Link>
                </div>

                {categoryProgress.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-4 text-center">
                        No domains found. Create domains in Curriculum Management to begin tracking.
                    </p>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryProgress.map((cat) => {
                            const total = cat.total_topics || 1;
                            const pctLearned = Math.round((cat.learned / total) * 100);

                            return (
                                <div
                                    key={cat.category_id}
                                    className="rounded-2xl bg-card/60 border border-border p-4 flex flex-col gap-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-full shrink-0"
                                                style={{ backgroundColor: cat.color }}
                                            />
                                            <span className="text-xs font-bold text-foreground truncate">
                                                {cat.category_name}
                                            </span>
                                        </div>
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            {pctLearned}%
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-muted/50 h-2 rounded-full overflow-hidden flex">
                                        <div
                                            className="h-full bg-emerald-400"
                                            style={{
                                                width: `${(cat.learned / total) * 100}%`,
                                            }}
                                            title={`Learned: ${cat.learned}`}
                                        />
                                        <div
                                            className="h-full bg-amber-400"
                                            style={{
                                                width: `${(cat.in_progress / total) * 100}%`,
                                            }}
                                            title={`In Progress: ${cat.in_progress}`}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                                        <span className="text-emerald-400">{cat.learned} Learned</span>
                                        <span className="text-amber-400">{cat.in_progress} In Progress</span>
                                        <span>{cat.not_started} New</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
