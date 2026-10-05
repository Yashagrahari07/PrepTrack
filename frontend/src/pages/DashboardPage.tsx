import { Flame, BookOpen, RotateCcw, BarChart3, ChevronRight } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useAuth';

// ─── Stat Card Placeholder ──────────────────────────────────
function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
    return (
        <div className="glass-panel rounded-2xl p-5 flex flex-col gap-3 hover:scale-[1.01] transition-transform duration-200">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
                    {icon}
                </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{value}</div>
        </div>
    );
}

// ─── Main Dashboard Page ────────────────────────────────────
export default function DashboardPage() {
    const { data: user } = useCurrentUser();

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Welcome banner */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 ambient-glow-indigo opacity-50 pointer-events-none" />
                <div className="relative flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                            Good to see you back, {user?.display_name ?? 'there'}! 🎯
                        </h2>
                        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-xl">
                            Your preparation control center is active. Browse your Curriculum domain tree, track your study consistency, or launch quick revisions.
                        </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Day Streak"
                    value="— Days"
                    color="hsl(38 92% 54%)"
                    icon={<Flame className="w-3.5 h-3.5" />}
                />
                <StatCard
                    label="This Week"
                    value="0 / 15h"
                    color="hsl(230 85% 62%)"
                    icon={<BarChart3 className="w-3.5 h-3.5" />}
                />
                <StatCard
                    label="Topics"
                    value="0 / 0"
                    color="hsl(160 84% 45%)"
                    icon={<BookOpen className="w-3.5 h-3.5" />}
                />
                <StatCard
                    label="Revisions Due"
                    value="0"
                    color="hsl(340 82% 58%)"
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                />
            </div>

            {/* Heatmap placeholder */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">12-Week Consistency Heatmap</h3>
                    <span className="text-xs text-muted-foreground">Coming soon as you log study time</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: 84 }, (_, i) => (
                        <div
                            key={i}
                            className="w-4 h-4 rounded-[3px] bg-muted/50"
                        />
                    ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-muted-foreground">Less</span>
                    {['bg-muted/50', 'bg-primary/25', 'bg-primary/50', 'bg-primary/80', 'bg-primary'].map((c) => (
                        <div key={c} className={`w-3.5 h-3.5 rounded-[3px] ${c}`} />
                    ))}
                    <span className="text-xs text-muted-foreground">More</span>
                </div>
            </div>

            {/* Feature shortcuts */}
            <div className="grid sm:grid-cols-2 gap-4">
                {[
                    {
                        icon: <BookOpen className="w-5 h-5" />,
                        title: 'Curriculum Management',
                        desc: 'Build and manage your SDE 1 study plan across 8 core domains.',
                        color: 'hsl(230 85% 62%)',
                        to: '/app/curriculum',
                    },
                    {
                        icon: <RotateCcw className="w-5 h-5" />,
                        title: 'Spaced Revisions',
                        desc: 'D+1, D+3, D+7, D+21 — automated retention schedule based on 1-5 star confidence.',
                        color: 'hsl(160 84% 45%)',
                        to: '/app/revisions',
                    },
                ].map((card) => (
                    <div
                        key={card.title}
                        className="glass-panel rounded-3xl p-5 border border-white/10 flex items-start gap-4"
                    >
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${card.color}20`, color: card.color }}
                        >
                            {card.icon}
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground text-sm mb-1">{card.title}</h3>
                            <p className="text-muted-foreground text-xs leading-relaxed">{card.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
