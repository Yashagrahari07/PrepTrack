import { Link } from 'react-router-dom';
import {
    Flame,
    BookOpen,
    RotateCcw,
    BarChart3,
    ArrowRight,
    CheckCircle2,
    Zap,
    Target,
    Calendar,
    Sparkles,
    Sun,
    Moon,
} from 'lucide-react';
import { useAppStore } from '@/stores/app/app.store';

// ─── Feature Card ──────────────────────────────────────────
interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    accentColor: string;
    delay?: string;
}

function FeatureCard({ icon, title, description, accentColor, delay = '0ms' }: FeatureCardProps) {
    return (
        <div
            className="glass-panel rounded-2xl p-6 flex flex-col gap-4 animate-fade-up hover:scale-[1.02] transition-transform duration-300"
            style={{ animationDelay: delay, opacity: 0, animationFillMode: 'forwards' }}
        >
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
                {icon}
            </div>
            <div>
                <h3 className="text-foreground font-semibold text-lg mb-1">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

// ─── Stat Item ─────────────────────────────────────────────
function StatItem({ value, label }: { value: string; label: string }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <span className="text-4xl font-bold text-foreground tracking-tight">{value}</span>
            <span className="text-muted-foreground text-sm">{label}</span>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();

export default function LandingPage() {
    const theme = useAppStore((s) => s.theme);
    const toggleTheme = useAppStore((s) => s.toggleTheme);

    return (
        <div className="relative min-h-screen bg-background overflow-x-hidden">
            {/* Background layers */}
            <div className="pointer-events-none fixed inset-0 ambient-glow-indigo" aria-hidden="true" />
            <div className="pointer-events-none fixed inset-0 ambient-glow-emerald" aria-hidden="true" />
            <div className="pointer-events-none fixed inset-0 bg-dot-pattern fade-mask-radial opacity-40" aria-hidden="true" />

            {/* ── Nav ─────────────────────────────────────────── */}
            <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <Target className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-foreground text-xl tracking-tight">PrepTrack</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                    <Link
                        to="/login"
                        className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium px-4 py-2"
                    >
                        Sign in
                    </Link>
                    <Link
                        to="/signup"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-primary/40"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* ── Hero ────────────────────────────────────────── */}
            <section className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-24 flex flex-col items-center text-center">
{/* Badge */}
                <div className="animate-fade-up" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-xs font-medium text-accent-foreground mb-8">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        Preparation Control Center
                    </div>
                </div>

                {/* Headline */}
                <h1
                    className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-foreground leading-[1.1] tracking-tight max-w-4xl animate-fade-up animation-delay-100"
                    style={{ opacity: 0, animationFillMode: 'forwards' }}
                >
                    Turn scattered prep into{' '}
                    <span className="bg-gradient-to-r from-primary via-violet-400 to-sky-400 bg-clip-text text-transparent">
                        structured mastery
                    </span>
                </h1>

                {/* Subheading */}
                <p
                    className="mt-6 text-muted-foreground text-lg sm:text-xl max-w-2xl leading-relaxed animate-fade-up animation-delay-200"
                    style={{ opacity: 0, animationFillMode: 'forwards' }}
                >
                    PrepTrack orchestrates preparation for any syllabus and any goal in a single
                    dashboard with streak tracking, spaced revision, and daily momentum.
                </p>

                {/* CTAs */}
                <div
                    className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-fade-up animation-delay-300"
                    style={{ opacity: 0, animationFillMode: 'forwards' }}
                >
                    <Link
                        to="/signup"
                        className="group flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-4 rounded-2xl transition-all duration-200 shadow-xl shadow-primary/30 hover:shadow-primary/50 animate-glow-pulse"
                    >
                        Start Tracking Free
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        to="/login"
                        className="flex items-center gap-2 glass-panel text-foreground font-medium px-8 py-4 rounded-2xl hover:border-white/20 transition-all duration-200"
                    >
                        Sign in
                    </Link>
                </div>

                {/* Trust line */}
                <div
                    className="mt-8 flex items-center gap-2 text-muted-foreground text-sm animate-fade-up animation-delay-400"
                    style={{ opacity: 0, animationFillMode: 'forwards' }}
                >
                    <CheckCircle2 className="w-4 h-4 text-status-interview-ready" />
                    Free to join. Built for serious prep.
                </div>

                {/* Dashboard Preview */}
                <div
                    className="mt-16 w-full max-w-4xl animate-fade-up animation-delay-500"
                    style={{ opacity: 0, animationFillMode: 'forwards' }}
                >
                    <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl shadow-primary/10">
                        {/* Fake dashboard header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-destructive/70" />
                                    <div className="w-3 h-3 rounded-full bg-status-in-progress/70" />
                                    <div className="w-3 h-3 rounded-full bg-status-interview-ready/70" />
                                </div>
                                <span className="text-muted-foreground text-xs font-mono">PrepTrack / Dashboard</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel text-xs">
                                    <Flame className="w-3.5 h-3.5 animate-pulse-flame text-status-in-progress" />
                                    <span className="text-foreground font-semibold">14 Days</span>
                                </div>
                                <div className="w-24 h-7 rounded-lg bg-primary/20 animate-pulse" />
                            </div>
                        </div>
                        {/* Fake stat cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                            {[
                                { label: 'Day Streak', value: '14 🔥', color: 'var(--status-in-progress)' },
                                { label: 'This Week', value: '11.5 / 15h', color: 'var(--primary)' },
                                { label: 'Topics Done', value: '24 / 45', color: 'var(--cat-dbms)' },
                                { label: 'Revision Rate', value: '92%', color: 'var(--cat-devops)' },
                            ].map((s) => (
                                <div key={s.label} className="rounded-xl bg-card p-3 border border-border">
                                    <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                                    <div className="font-bold text-sm" style={{ color: s.color }}>{s.value}</div>
                                </div>
                            ))}
                        </div>
                        {/* Fake heatmap */}
                        <div className="rounded-xl bg-card p-4 border border-border">
                            <div className="text-xs text-muted-foreground mb-3">12-Week Consistency Heatmap</div>
                            <div className="flex gap-1 flex-wrap">
                                {Array.from({ length: 84 }, (_, i) => {
                                    const intensity = Math.random();
                                    const color = intensity < 0.3
                                        ? 'bg-muted'
                                        : intensity < 0.55
                                          ? 'bg-primary/30'
                                          : intensity < 0.75
                                            ? 'bg-primary/60'
                                            : 'bg-primary';
                                    return <div key={i} className={`w-3 h-3 rounded-[3px] ${color}`} />;
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Row ───────────────────────────────────── */}
            <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
                <div className="glass-panel rounded-3xl px-8 py-10">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-border">
                        <StatItem value="∞" label="Categories" />
                        <StatItem value="∞" label="Topics" />
                        <StatItem value="D+21" label="Spaced Revision Cycle" />
                        <StatItem value="100%" label="Your Prep, Your Pace" />
                    </div>
                </div>
            </section>

            {/* ── Features ────────────────────────────────────── */}
            <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-16 scroll-mt-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                        Everything you need to go from scattered to{' '}
                        <span className="text-primary">mastery</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        PrepTrack handles the orchestration. You handle the learning.
                    </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <FeatureCard
                        icon={<Flame className="w-6 h-6" />}
                        title="Daily Streak & Heatmap"
                        description="Track your consistency with a GitHub-style 12-week heatmap and flame streak counter. Log 30+ mins to keep the chain alive."
                        accentColor="hsl(38 92% 54%)"
                        delay="0ms"
                    />
                    <FeatureCard
                        icon={<BookOpen className="w-6 h-6" />}
                        title="Structured Curriculum"
                        description="Create your own categories, topics, and subtopics for any syllabus. Each with curated resources capped at 3 per topic."
                        accentColor="hsl(230 85% 62%)"
                        delay="100ms"
                    />
                    <FeatureCard
                        icon={<RotateCcw className="w-6 h-6" />}
                        title="Spaced Revision System"
                        description="Automated D+1, D+3, D+7, D+21 revision queues. Self-rate confidence from 1 to 5 stars and the system schedules what is next."
                        accentColor="hsl(160 84% 45%)"
                        delay="200ms"
                    />
                    <FeatureCard
                        icon={<BarChart3 className="w-6 h-6" />}
                        title="Progress Analytics"
                        description="Weekly hours vs target, category mastery bars, revision rate, and top studied topics, all in one stats hub."
                        accentColor="hsl(262 83% 62%)"
                        delay="300ms"
                    />
                    <FeatureCard
                        icon={<Target className="w-6 h-6" />}
                        title="Topic Workspaces"
                        description="Each topic has a deep-work studio: attach resources, write markdown notes, log study time, and track confidence level."
                        accentColor="hsl(199 89% 52%)"
                        delay="400ms"
                    />
                    <FeatureCard
                        icon={<Calendar className="w-6 h-6" />}
                        title="Weekly Targets"
                        description="Set a weekly hour goal and watch the progress bar fill. Configurable targets with a visual push to stay consistent."
                        accentColor="hsl(340 82% 58%)"
                        delay="500ms"
                    />
                </div>
            </section>

            {/* ── CTA Bottom ──────────────────────────────────── */}
            <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
                <div className="glass-panel rounded-[2rem] px-8 py-16 sm:py-20 text-center relative overflow-hidden border-white/10 shadow-2xl shadow-primary/10">
                    <div className="absolute inset-0 ambient-glow-indigo pointer-events-none" />
                    <div className="absolute inset-0 ambient-glow-emerald opacity-60 pointer-events-none" />
                    <div className="absolute inset-0 bg-dot-pattern fade-mask-radial opacity-30 pointer-events-none" />
                    <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" aria-hidden="true" />
                    <div className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-6">
                        <Sparkles className="w-3.5 h-3.5" />
                        Free to join
                    </div>
                    <h2 className="relative text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                        Ready to prep with{' '}
                        <span className="bg-gradient-to-r from-primary via-violet-400 to-sky-400 bg-clip-text text-transparent">
                            purpose?
                        </span>
                    </h2>
                    <p className="relative text-muted-foreground text-lg mb-8 max-w-md mx-auto leading-relaxed">
                        Create a free account and get your prep structured in minutes.
                    </p>
                    <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            to="/signup"
                            className="group inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-10 py-4 rounded-2xl transition-all duration-200 shadow-xl shadow-primary/30 hover:shadow-primary/50"
                        >
                            Create Your Account
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 glass-panel text-foreground font-medium px-10 py-4 rounded-2xl hover:border-white/20 transition-all duration-200"
                        >
                            Sign in
                        </Link>
                    </div>
                    <div className="relative mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-status-in-progress" />
                            Daily streaks
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <RotateCcw className="w-3.5 h-3.5 text-status-interview-ready" />
                            Spaced revision
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5 text-primary" />
                            Progress analytics
                        </span>
                    </div>
                </div>
            </section>

            {/* ── Footer ──────────────────────────────────────── */}
            <footer className="relative z-10 border-t border-border/60">
                <div className="max-w-6xl mx-auto px-6 py-12 grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
                    <div>
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <Target className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <span className="font-bold text-foreground tracking-tight">PrepTrack</span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                            Built for focused preparation. Any goal. Any syllabus.
                        </p>
                    </div>
                    <nav aria-label="Product">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-4">Product</p>
                        <ul className="flex flex-col gap-2.5 text-sm">
                            <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                            <li><Link to="/signup" className="text-muted-foreground hover:text-foreground transition-colors">Get started</Link></li>
                            <li><Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">Sign in</Link></li>
                        </ul>
                    </nav>
                    <nav aria-label="Account">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-4">Account</p>
                        <ul className="flex flex-col gap-2.5 text-sm">
                            <li><Link to="/signup" className="text-muted-foreground hover:text-foreground transition-colors">Create account</Link></li>
                            <li><Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">Sign in</Link></li>
                        </ul>
                    </nav>
                </div>
                <div className="border-t border-border/60">
                    <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>© {CURRENT_YEAR} PrepTrack. All rights reserved.</span>
                        <span className="inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-interview-ready animate-pulse" />
                            Made for consistent learners
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
