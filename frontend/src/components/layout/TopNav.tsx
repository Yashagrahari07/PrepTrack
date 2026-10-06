import { useLocation, Link } from 'react-router-dom';
import {
    Flame,
    RotateCcw,
    Plus,
    Command,
    Sun,
    Moon,
    ExternalLink,
    Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';
import { useSettings } from '@/hooks/useSettings';

export function TopNav() {
    const location = useLocation();
    const { toggleSidebar, theme, toggleTheme, openQuickLog, openCommandMenu } = useUIStore();
    const { data: settings } = useSettings();

    const getPageTitle = (path: string) => {
        if (path === '/app') return 'Dashboard';
        if (path.startsWith('/app/curriculum')) return 'Curriculum';
        if (path.startsWith('/app/revisions')) return 'Spaced Revisions';
        if (path.startsWith('/app/stats')) return 'Stats Hub';
        if (path.startsWith('/app/settings')) return 'Settings';
        if (path.startsWith('/app/topics')) return 'Topic Workspace';
        return 'Control Center';
    };

    const dsaUrl = settings?.dsa_sheet_url || 'https://neetcode.io/practice/practice/neetcode150';

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-card/80 backdrop-blur-md border-b border-border">
            {/* Left: Mobile menu toggle & page title */}
            <div className="flex items-center gap-3">
                <button
                    onClick={toggleSidebar}
                    className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    aria-label="Toggle Navigation Sidebar"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div>
                    <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                        {getPageTitle(location.pathname)}
                    </h1>
                </div>
            </div>

            {/* Center: External Quick Links (Hidden on small screens) */}
            <div className="hidden lg:flex items-center gap-2">
                <a
                    href={dsaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-all border border-border/50"
                >
                    <span>DSA Sheet</span>
                    <ExternalLink className="w-3 h-3" />
                </a>
            </div>

            {/* Right: Actions, Streak & Log Time */}
            <div className="flex items-center gap-2 sm:gap-3">
                {/* Streak Pill */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-in-progress/10 text-status-in-progress text-xs font-semibold border border-status-in-progress/20">
                    <Flame className="w-3.5 h-3.5 animate-pulse-flame" />
                    <span>Streak</span>
                </div>

                {/* Revisions Link Badge */}
                <Link
                    to="/app/revisions"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revisions</span>
                </Link>

                {/* Log Time CTA */}
                <Button
                    size="sm"
                    onClick={() => openQuickLog()}
                    className="gap-1.5 shadow-md shadow-primary/20"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Log Time</span>
                </Button>

                {/* Command Menu Shortcut Trigger */}
                <button
                    onClick={openCommandMenu}
                    className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground text-xs font-medium border border-border/60 transition-colors"
                    title="Open Command Palette (Ctrl+K)"
                >
                    <Command className="w-3.5 h-3.5" />
                    <span className="font-mono text-[10px]">⌘K</span>
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
