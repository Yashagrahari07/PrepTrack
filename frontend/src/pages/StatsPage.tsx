import { Link } from 'react-router-dom';
import {
    BarChart3,
    Clock,
    Flame,
    Trophy,
    BookOpen,
    ExternalLink,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';
import { useStats } from '@/hooks/useStats';

function getHeatmapColor(minutes: number): string {
    if (minutes === 0) return 'bg-muted/40 border border-white/5';
    if (minutes < 30) return 'bg-emerald-500/30 border border-emerald-500/40 text-emerald-300';
    if (minutes < 60) return 'bg-emerald-500/60 border border-emerald-500/70 text-emerald-200';
    if (minutes < 120) return 'bg-emerald-500/80 border border-emerald-400 text-emerald-100';
    return 'bg-emerald-400 border border-emerald-300 shadow-sm shadow-emerald-500/50 text-emerald-950 font-bold';
}

export default function StatsPage() {
    const { data: stats, isLoading } = useStats();

    const totalLoggedMinutes = stats?.total_logged_minutes ?? 0;
    const totalSessions = stats?.total_sessions ?? 0;
    const totalHours = (totalLoggedMinutes / 60).toFixed(1);
    const avgSessionMins = totalSessions > 0 ? Math.round(totalLoggedMinutes / totalSessions) : 0;
    const weeklyChartData = Array.isArray(stats?.weekly_hours_chart) ? stats.weekly_hours_chart : [];
    const topTopics = Array.isArray(stats?.top_topics) ? stats.top_topics : [];
    const heatmap = Array.isArray(stats?.heatmap) ? stats.heatmap : [];

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 animate-pulse">
                <div className="h-28 rounded-3xl bg-card border border-border" />
                <div className="h-80 rounded-3xl bg-card border border-border" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            {/* ── Page Header ───────────────────────────────────── */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 ambient-glow-indigo opacity-50 pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-primary" />
                            <span>Preparation Analytics & Stats Hub</span>
                        </h2>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                            Quantitative insights on study time distribution, session counts, and top focus topics.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Summary Cards ─────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Total Hours Logged
                        </span>
                        <div className="text-2xl font-extrabold text-foreground mt-0.5">
                            {totalHours} hrs
                        </div>
                        <span className="text-[11px] text-muted-foreground">({totalLoggedMinutes} minutes)</span>
                    </div>
                </div>

                <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <Flame className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Study Sessions
                        </span>
                        <div className="text-2xl font-extrabold text-foreground mt-0.5">
                            {totalSessions}
                        </div>
                        <span className="text-[11px] text-muted-foreground">Recorded sessions</span>
                    </div>
                </div>

                <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Avg. Session Time
                        </span>
                        <div className="text-2xl font-extrabold text-foreground mt-0.5">
                            {avgSessionMins} mins
                        </div>
                        <span className="text-[11px] text-muted-foreground">Per logged session</span>
                    </div>
                </div>
            </div>

            {/* ── Weekly Hours Bar Chart ─────────────────────────── */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-4">
                <div>
                    <h3 className="text-sm font-bold text-foreground">Weekly Study Hours (Last 8 Weeks)</h3>
                    <p className="text-xs text-muted-foreground">Total study time aggregated by week</p>
                </div>

                <div className="h-72 w-full pt-4">
                    {weeklyChartData.length === 0 ? (
                        <div className="h-full rounded-2xl border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                            No study hours recorded in the past 8 weeks.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="week_start"
                                    stroke="hsl(215 16% 47%)"
                                    fontSize={11}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="hsl(215 16% 47%)"
                                    fontSize={11}
                                    tickLine={false}
                                    unit="h"
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        borderColor: '#334155',
                                        borderRadius: '12px',
                                        color: '#f8fafc',
                                        fontSize: '12px',
                                    }}
                                    formatter={(val) => [`${Number(val ?? 0).toFixed(1)} Hours`, 'Study Time']}
                                    labelFormatter={(label) => `Week of ${label}`}
                                />
                                <Bar
                                    dataKey="hours"
                                    fill="hsl(230 85% 62%)"
                                    radius={[8, 8, 0, 0]}
                                    maxBarSize={48}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ── Top Studied Topics Table ────────────────────────── */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-4">
                <div>
                    <h3 className="text-sm font-bold text-foreground">Top Focus Topics</h3>
                    <p className="text-xs text-muted-foreground">Topics with the highest cumulative study time</p>
                </div>

                {topTopics.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-4 text-center">
                        No topic sessions logged yet.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-border text-muted-foreground font-semibold">
                                    <th className="pb-3 px-3">#</th>
                                    <th className="pb-3 px-3">Topic Title</th>
                                    <th className="pb-3 px-3">Category Domain</th>
                                    <th className="pb-3 px-3 text-right">Logged Time</th>
                                    <th className="pb-3 px-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {topTopics.map((topic, index) => (
                                    <tr key={topic.topic_id} className="hover:bg-muted/20 transition-colors">
                                        <td className="py-3 px-3 font-bold text-muted-foreground">
                                            {index + 1}
                                        </td>
                                        <td className="py-3 px-3 font-semibold text-foreground">
                                            {topic.topic_title}
                                        </td>
                                        <td className="py-3 px-3 text-muted-foreground">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium text-[11px]">
                                                <BookOpen className="w-3 h-3" />
                                                {topic.category_name}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-right font-bold text-foreground">
                                            {topic.total_minutes} mins ({(topic.total_minutes / 60).toFixed(1)}h)
                                        </td>
                                        <td className="py-3 px-3 text-right">
                                            <Link
                                                to={`/app/topics/${topic.topic_id}`}
                                                className="inline-flex items-center gap-1 text-primary hover:underline text-[11px] font-semibold"
                                            >
                                                <span>Studio</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Extended Activity Heatmap Matrix ───────────────── */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-4">
                <div>
                    <h3 className="text-sm font-bold text-foreground">84-Day Activity Log Grid</h3>
                    <p className="text-xs text-muted-foreground">Daily activity intensity map</p>
                </div>

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
                                  className={`aspect-square rounded-md transition-transform hover:scale-125 ${getHeatmapColor(
                                      day.minutes,
                                  )}`}
                              />
                          ))}
                </div>
            </div>
        </div>
    );
}
