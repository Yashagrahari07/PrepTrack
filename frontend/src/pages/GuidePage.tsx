import React from 'react';
import {
    BookOpen,
    Flame,
    RotateCcw,
    Settings,
    Keyboard,
    ChevronDown,
    ChevronUp,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GUIDE_SECTIONS = [
    {
        id: 'getting-started',
        title: 'Getting Started',
        icon: Sparkles,
        items: [
            {
                title: 'Create your first category',
                description: 'Categories organize your syllabus into high-level domains (e.g., "Data Structures", "System Design", "Algebra"). Click "New Category" in the Curriculum page, pick a color, and set its position.',
            },
            {
                title: 'Add topics and subtopics',
                description: 'Inside each category, add topics (e.g., "Arrays", "Binary Trees"). Topics can have subtopics for two-level nesting, perfect for breaking down complex subjects.',
            },
            {
                title: 'Attach resources (max 3 per topic)',
                description: 'Each topic supports up to 3 curated resources: YouTube videos, playlists, blog posts, official docs, or other links. Add status (TODO/DOING/DONE) and estimated minutes.',
            },
        ],
    },
    {
        id: 'daily-workflow',
        title: 'Daily Workflow',
        icon: Flame,
        items: [
            {
                title: 'Log a study session',
                description: 'Click "Log Session" (top nav or ⌘K → "Log Study Time") to record minutes spent on a topic. Add an optional comment and date. Sessions feed your streak, heatmap, and weekly target.',
            },
            {
                title: 'Track streaks and heatmap',
                description: 'The dashboard shows your active streak (≥30 min/day, with 1 grace day/week) and a 12-week GitHub-style heatmap. Green = more minutes; grey = rest day.',
            },
            {
                title: 'Mark topics as Learned / Mastery',
                description: 'When you finish a topic, set its status to "Learned". This triggers the spaced revision scheduler (D+1, D+3, D+7, D+21). Two consecutive confidence-5 ratings promote it to "Mastery".',
            },
        ],
    },
    {
        id: 'spaced-revision',
        title: 'Spaced Revision System',
        icon: RotateCcw,
        items: [
            {
                title: 'How D+1, D+3, D+7, D+21 works',
                description: 'When you mark a topic "Learned", a revision is scheduled for tomorrow (D+1). Complete it, rate confidence from 1 to 5, and the next interval is scheduled automatically (1: D+1, 2: D+1, 3: D+3, 4: D+7, 5: D+21).',
            },
            {
                title: 'Confidence rating (1 to 5) and scheduling',
                description: 'Low confidence (1 to 2) resets to D+1 and may revert the topic to "In Progress". High confidence (4 to 5) extends the interval. Two consecutive 5s earn "Mastery" status.',
            },
            {
                title: 'Reaching Mastery / Interview Ready',
                description: 'A topic reaches "Mastery" after two consecutive confidence-5 ratings. The dashboard "Revisions" badge shows pending count. Click to review and rate.',
            },
        ],
    },
    {
        id: 'settings-personalization',
        title: 'Settings & Personalization',
        icon: Settings,
        items: [
            {
                title: 'Set your preparation goal',
                description: 'Open Settings → "Preparation Goal" dropdown. Choose from SDE Backend/Frontend/Full-Stack, DSA/Competitive, JEE, GATE, Cloud Certs, Language Learning, or Custom. Your goal tailors the dashboard welcome message and suggests a weekly target.',
            },
            {
                title: 'Weekly target hours (presets + custom)',
                description: 'Set hours per week (0.5 to 168). Presets: 10, 15, 20, 30. The dashboard shows a progress bar (current vs target) and a weekly hours chart.',
            },
            {
                title: 'Reference sheet shortcut toggle & URL',
                description: 'Toggle "Reference Sheet Shortcut" to show/hide the navbar pill and ⌘K entry. Default URL is NeetCode; change to LeetCode, GeeksforGeeks, or any custom link. For non-DSA goals, the toggle defaults OFF.',
            },
            {
                title: 'Dark / Light theme',
                description: 'Click the sun/moon icon in the top nav (or ⌘K → "Toggle Theme") to switch. Preference persists in localStorage.',
            },
        ],
    },
    {
        id: 'keyboard-shortcuts',
        title: 'Keyboard Shortcuts',
        icon: Keyboard,
        items: [
            {
                title: 'Command palette',
                description: 'Jump anywhere: navigate pages, search categories, log time, toggle theme, open reference sheet.',
                keys: ['⌘K', 'Ctrl K'],
            },
            {
                title: 'Quick log from anywhere',
                description: 'Open the command palette and choose "Log Study Time" to open the quick-log modal without leaving your current page.',
                keys: ['Esc'],
            },
        ],
    },
];

function KeyChip({ label }: { label: string }) {
    return (
        <kbd className="inline-flex items-center rounded-md bg-muted border border-border px-2 py-0.5 font-mono text-[11px] font-semibold text-foreground shadow-sm">
            {label}
        </kbd>
    );
}

function GuideItem({ title, description, keys }: { title: string; description: string; keys?: string[] }) {
    return (
        <div className="flex gap-3 py-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-2 shrink-0" />
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    {keys && (
                        <span className="flex items-center gap-1">
                            {keys.map((k) => (
                                <KeyChip key={k} label={k} />
                            ))}
                        </span>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

function GuideSection({
    id,
    index,
    title,
    icon: Icon,
    items,
}: {
    id: string;
    index: number;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    items: { title: string; description: string; keys?: string[] }[];
}) {
    const [open, setOpen] = React.useState(true);

    return (
        <section id={id} className="glass-panel rounded-2xl border border-white/10 overflow-hidden animate-fade-up scroll-mt-24">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-3 p-5 sm:p-6 text-left"
                aria-expanded={open}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-bold tabular-nums text-muted-foreground/70">
                        {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
                        <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
                </div>
                {open ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />}
            </button>
            {open && (
                <div className="px-5 sm:px-6 pb-6 pt-0 border-t border-border/30">
                    <div className="flex flex-col gap-3 pt-2">
                        {items.map((item) => (
                            <GuideItem key={item.title} title={item.title} description={item.description} keys={item.keys} />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

export default function GuidePage() {
    const totalGuides = GUIDE_SECTIONS.reduce((acc, s) => acc + s.items.length, 0);
    const [activeId, setActiveId] = React.useState(GUIDE_SECTIONS[0].id);

    const scrollTo = (id: string) => {
        setActiveId(id);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Scroll-spy: highlight the section currently in view in both navs.
    // The trailing sentinel pins the last (short) section active once the
    // user reaches the bottom, where it can never fill the observer band.
    // It uses its own full-viewport observer: the band-restricted one would
    // never see it, since it rests below the band at max scroll.
    const LAST_ID = GUIDE_SECTIONS[GUIDE_SECTIONS.length - 1].id;
    const endVisible = React.useRef(false);
    React.useEffect(() => {
        const sectionObserver = new IntersectionObserver(
            (entries) => {
                if (endVisible.current) return;
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                }
            },
            { rootMargin: '-20% 0px -70% 0px' },
        );

        const endObserver = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.target.id !== 'guide-end') continue;
                    endVisible.current = entry.isIntersecting;
                    if (entry.isIntersecting) {
                        setActiveId(LAST_ID);
                    }
                }
            },
            { threshold: 0 },
        );

        GUIDE_SECTIONS.forEach((s) => {
            const el = document.getElementById(s.id);
            if (el) sectionObserver.observe(el);
        });
        const end = document.getElementById('guide-end');
        if (end) endObserver.observe(end);

        return () => {
            sectionObserver.disconnect();
            endObserver.disconnect();
        };
    }, [LAST_ID]);

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            {/* ── Page Header ───────────────────────────────────── */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 ambient-glow-indigo opacity-50 pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-1 flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-primary" />
                            <span>User Guide</span>
                        </h2>
                        <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                            Learn how to get the most out of PrepTrack. Expand each section to explore.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary">
                            {GUIDE_SECTIONS.length} sections
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                            {totalGuides} guides
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Mobile section nav ──────────────────────────────── */}
            <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {GUIDE_SECTIONS.map((s, i) => (
                    <button
                        key={s.id}
                        onClick={() => scrollTo(s.id)}
                        className={cn(
                            'shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all',
                            activeId === s.id
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-card border-border text-muted-foreground',
                        )}
                    >
                        <span className="tabular-nums opacity-70">{String(i + 1).padStart(2, '0')}</span>
                        {s.title}
                    </button>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] items-start">
                {/* ── Sticky section nav ──────────────────────────── */}
                <nav aria-label="Guide sections" className="hidden lg:block sticky top-24">
                    <div className="glass-panel rounded-2xl border border-white/10 p-2.5 flex flex-col gap-1">
                        <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                            On this page
                        </p>
                        {GUIDE_SECTIONS.map((s, i) => (
                            <button
                                key={s.id}
                                onClick={() => scrollTo(s.id)}
                                className={cn(
                                    'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all',
                                    activeId === s.id
                                        ? 'bg-primary/15 text-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                                )}
                            >
                                <span className={cn(
                                    'text-[11px] font-bold tabular-nums',
                                    activeId === s.id ? 'text-primary' : 'text-muted-foreground/60',
                                )}>
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <span className="truncate">{s.title}</span>
                                {activeId === s.id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* ── Guide Sections ──────────────────────────────── */}
                <div className="flex flex-col gap-4 min-w-0">
                    {GUIDE_SECTIONS.map((section, i) => (
                        <GuideSection
                            key={section.id}
                            id={section.id}
                            index={i}
                            title={section.title}
                            icon={section.icon}
                            items={section.items}
                        />
                    ))}
                    <div id="guide-end" aria-hidden="true" className="h-1" />
                </div>
            </div>
        </div>
    );
}
