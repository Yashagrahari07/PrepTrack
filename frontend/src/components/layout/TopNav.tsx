import { useLocation, Link } from 'react-router-dom';
import {
    Flame,
    RotateCcw,
    Plus,
    Search,
    Sun,
    Moon,
    ExternalLink,
    Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app/app.store';
import { useSettings } from '@/hooks/useSettings';

export function TopNav() {
    const location = useLocation();
    const toggleSidebar = useAppStore((s) => s.toggleSidebar);
    const theme = useAppStore((s) => s.theme);
    const toggleTheme = useAppStore((s) => s.toggleTheme);
    const openQuickLog = useAppStore((s) => s.openQuickLog);
    const openCommandMenu = useAppStore((s) => s.openCommandMenu);
    const { data: settings } = useSettings();

    const getPageTitle = (path: string) => {
        if (path === '/home') return 'Dashboard';
        if (path.startsWith('/home/curriculum')) return 'Curriculum';
        if (path.startsWith('/home/revisions')) return 'Spaced Revisions';
        if (path.startsWith('/home/stats')) return 'Stats Hub';
        if (path.startsWith('/home/settings')) return 'Settings';
        if (path.startsWith('/home/guide')) return 'Guide';
        if (path.startsWith('/home/topics')) return 'Topic Workspace';
        return 'Navigation';
    };

    const referenceSheetUrl = settings?.reference_sheet_url || 'https://neetcode.io/practice/practice/neetcode150';
    const showReferenceSheet = settings?.show_reference_sheet ?? true;

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 px-4 sm:px-6 py-3.5 bg-card/80 backdrop-blur-md border-b border-border">
            {/* Left: Mobile menu toggle & page title */}
            <div className="flex items-center gap-3 max-sm:gap-2 min-w-0">
                <button
                    onClick={toggleSidebar}
                    className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    aria-label="Toggle Navigation Sidebar"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="min-w-0">
                    <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight max-sm:truncate max-sm:max-w-[38vw]">
                        {getPageTitle(location.pathname)}
                    </h1>
                </div>
            </div>

            {/* Right: Actions, Streak & Log Time */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Reference Sheet Shortcut */}
                {showReferenceSheet && (
                    <a
                        href={referenceSheetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all border border-border/50"
                    >
                        <span>Reference Sheet</span>
                        <ExternalLink className="w-3 h-3" />
                    </a>
                )}
                {/* Streak Pill */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-in-progress/10 text-status-in-progress text-xs font-semibold border border-status-in-progress/20">
                    <Flame className="w-3.5 h-3.5 animate-pulse-flame" />
                    <span>Streak</span>
                </div>

                {/* Revisions Link Badge */}
                <Link
                    to="/home/revisions"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revisions</span>
                </Link>

                {/* Log Session CTA */}
                <Button
                    size="sm"
                    onClick={() => openQuickLog()}
                    className="gap-1.5 shadow-md shadow-primary/20"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Log Session</span>
                </Button>

                {/* Command Menu Shortcut Trigger — premium Linear-style search + dual kbd */}
                <button
                    onClick={openCommandMenu}
                    aria-label="Open command palette (Control or Command K)"
                    title="Open Command Palette (Ctrl+K / ⌘K)"
                    className="group hidden md:flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-xl bg-muted/40 hover:bg-muted/80 text-muted-foreground border border-border/60 hover:border-primary/30 shadow-sm hover:shadow-md hover:shadow-primary/10 active:scale-[0.97] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                    <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="flex items-center gap-1" aria-hidden="true">
                        <kbd className="font-mono text-[10px] font-semibold px-1 py-0.5 rounded-[6px] bg-background border border-border/70 shadow-[0_1px_0_rgba(0,0,0,0.08)] text-muted-foreground group-hover:text-foreground group-hover:border-primary/30 leading-none transition-colors">
                            ⌘
                        </kbd>
                        <kbd className="font-mono text-[10px] font-semibold px-1 py-0.5 rounded-[6px] bg-background border border-border/70 shadow-[0_1px_0_rgba(0,0,0,0.08)] text-muted-foreground group-hover:text-foreground group-hover:border-primary/30 leading-none transition-colors">
                            K
                        </kbd>
                    </span>
                </button>

                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
            </div>
        </header>
    );
}
