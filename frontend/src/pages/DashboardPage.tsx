import { Flame, BookOpen, RotateCcw, BarChart3, Settings, LogOut, Target, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser, useLogout } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

// ─── Nav Item ───────────────────────────────────────────────
function NavItem({ icon, label, to, disabled = false }: { icon: React.ReactNode; label: string; to: string; disabled?: boolean }) {
    if (disabled) {
        return (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground opacity-50 cursor-not-allowed">
                {icon}
                <span className="text-sm font-medium">{label}</span>
                <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Soon</span>
            </div>
        );
    }
    return (
        <Link
            to={to}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150"
        >
            {icon}
            <span className="text-sm font-medium">{label}</span>
        </Link>
    );
}

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
    const logout = useLogout();

    return (
        <div className="relative min-h-screen bg-background flex">
            {/* Background */}
            <div className="pointer-events-none fixed inset-0 ambient-glow-indigo opacity-60" aria-hidden="true" />

            {/* ── Sidebar ────────────────────────────────────── */}
            <aside className="relative z-10 hidden md:flex flex-col w-64 shrink-0 border-r border-border glass-panel rounded-none min-h-screen">
                {/* Logo */}
                <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <Target className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-foreground text-lg tracking-tight">PrepTrack</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 flex flex-col gap-1">
                    <div className="px-3 py-2 mb-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overview</span>
                    </div>
                    <NavItem icon={<BarChart3 className="w-4 h-4" />} label="Dashboard" to="/app" />

                    <div className="px-3 py-2 mt-3 mb-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prep</span>
                    </div>
                    <NavItem icon={<BookOpen className="w-4 h-4" />} label="Curriculum" to="/app/curriculum" disabled />
                    <NavItem icon={<RotateCcw className="w-4 h-4" />} label="Revisions" to="/app/revisions" disabled />
                    <NavItem icon={<BarChart3 className="w-4 h-4" />} label="Stats" to="/app/stats" disabled />
                    <NavItem icon={<Settings className="w-4 h-4" />} label="Settings" to="/app/settings" disabled />
                </nav>

                {/* User & Logout */}
                <div className="p-3 border-t border-border">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
                        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {user?.display_name?.[0]?.toUpperCase() ?? 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{user?.display_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* ── Main Content ────────────────────────────────── */}
            <main className="relative z-10 flex-1 flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div>
                        <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
                        <p className="text-xs text-muted-foreground">Good to see you back, {user?.display_name ?? 'there'}! 🎯</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Streak pill */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel text-sm border border-white/10">
                            <Flame className="w-4 h-4 text-status-in-progress animate-pulse-flame" />
                            <span className="font-semibold text-foreground text-xs">— Day Streak</span>
                        </div>
                        {/* Mobile logout */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={logout}
                            className="md:hidden text-muted-foreground hover:text-destructive"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 p-6 flex flex-col gap-6">
                    {/* Welcome banner */}
                    <div className="glass-panel rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                        <div className="absolute inset-0 ambient-glow-indigo opacity-50 pointer-events-none" />
                        <div className="relative flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <h2 className="text-xl font-bold text-foreground mb-1">
                                    Welcome to PrepTrack! 🚀
                                </h2>
                                <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                                    Your dashboard is being set up. The core pages (Curriculum, Revisions, Stats &amp; Settings)
                                    are coming next. For now, explore the layout and start building your routine.
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
                    <div className="glass-panel rounded-2xl p-6 border border-white/10">
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

                    {/* Coming Soon cards */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        {[
                            {
                                icon: <BookOpen className="w-5 h-5" />,
                                title: 'Curriculum',
                                desc: 'Build and manage your study plan across 8 domains.',
                                color: 'hsl(230 85% 62%)',
                                to: '/app/curriculum',
                            },
                            {
                                icon: <RotateCcw className="w-5 h-5" />,
                                title: 'Spaced Revisions',
                                desc: 'D+1, D+3, D+7, D+21 — never forget what you learned.',
                                color: 'hsl(160 84% 45%)',
                                to: '/app/revisions',
                            },
                        ].map((card) => (
                            <div
                                key={card.title}
                                className="glass-panel rounded-2xl p-5 border border-white/10 flex items-start gap-4"
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
            </main>
        </div>
    );
}
