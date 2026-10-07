import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    BarChart3,
    BookOpen,
    RotateCcw,
    TrendingUp,
    Settings,
    Plus,
    ExternalLink,
    Sun,
    Moon,
    X,
} from 'lucide-react';
import { useAppStore } from '@/stores/app/app.store';
import { useCategories } from '@/hooks/useCurriculum';
import { useSettings } from '@/hooks/useSettings';

export function CommandMenu() {
    const navigate = useNavigate();
    const isCommandMenuOpen = useAppStore((s) => s.isCommandMenuOpen);
    const closeCommandMenu = useAppStore((s) => s.closeCommandMenu);
    const openCommandMenu = useAppStore((s) => s.openCommandMenu);
    const openQuickLog = useAppStore((s) => s.openQuickLog);
    const toggleTheme = useAppStore((s) => s.toggleTheme);
    const theme = useAppStore((s) => s.theme);
    const { data: categoriesData } = useCategories();
    const { data: userSettings } = useSettings();

    const [query, setQuery] = useState('');

    // Global keyboard listener for Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (isCommandMenuOpen) {
                    closeCommandMenu();
                } else {
                    openCommandMenu();
                }
            }
            if (e.key === 'Escape' && isCommandMenuOpen) {
                closeCommandMenu();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCommandMenuOpen, closeCommandMenu]);

    if (!isCommandMenuOpen) return null;

    const handleNavigate = (path: string) => {
        navigate(path);
        closeCommandMenu();
        setQuery('');
    };

    const referenceSheetUrl = userSettings?.reference_sheet_url || 'https://neetcode.io/practice/practice/neetcode150';
    const showReferenceSheet = userSettings?.show_reference_sheet ?? true;

    const navigationItems = [
        { label: 'Dashboard', path: '/home', icon: <BarChart3 className="w-4 h-4 text-primary" /> },
        { label: 'Curriculum', path: '/home/curriculum', icon: <BookOpen className="w-4 h-4 text-emerald-400" /> },
        { label: 'Revisions', path: '/home/revisions', icon: <RotateCcw className="w-4 h-4 text-rose-400" /> },
        { label: 'Stats Hub', path: '/home/stats', icon: <TrendingUp className="w-4 h-4 text-violet-400" /> },
        { label: 'Guide', path: '/home/guide', icon: <BookOpen className="w-4 h-4 text-amber-400" /> },
        { label: 'Settings', path: '/home/settings', icon: <Settings className="w-4 h-4 text-amber-400" /> },
    ];

    const filteredNav = navigationItems.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()),
    );

    const categoriesList = Array.isArray(categoriesData) ? categoriesData : [];
    const filteredCategories = categoriesList.filter((cat) =>
        cat.name.toLowerCase().includes(query.toLowerCase()),
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/60 backdrop-blur-md animate-fade-in"
            onClick={closeCommandMenu}
        >
            <div
                className="relative w-full max-w-xl bg-card border border-border rounded-3xl overflow-hidden shadow-2xl animate-fade-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Header */}
                <div className="relative flex items-center px-4 py-3 border-b border-border">
                    <Search className="w-5 h-5 text-muted-foreground ml-2 shrink-0" />
                    <input
                        type="text"
                        placeholder="Type a command or search curriculum..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                        className="w-full bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                    <button
                        onClick={closeCommandMenu}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content List */}
                <div className="max-h-96 overflow-y-auto p-2 flex flex-col gap-3">
                    {/* Navigation */}
                    {filteredNav.length > 0 && (
                        <div>
                            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Navigation
                            </div>
                            <div className="flex flex-col gap-0.5 mt-1">
                                {filteredNav.map((item) => (
                                    <button
                                        key={item.path}
                                        onClick={() => handleNavigate(item.path)}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-foreground hover:bg-primary/15 transition-colors text-left"
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Categories */}
                    {filteredCategories.length > 0 && (
                        <div>
                            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Categories
                            </div>
                            <div className="flex flex-col gap-0.5 mt-1">
                                {filteredCategories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleNavigate(`/home/curriculum`)}
                                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/60 transition-colors text-left"
                                    >
                                        <div
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: cat.color }}
                                        />
                                        <span>{cat.name}</span>
                                        <span className="ml-auto text-[10px] text-muted-foreground">
                                            {cat.topic_count ?? 0} topics
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div>
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Quick Actions
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1">
                            <button
                                onClick={() => {
                                    closeCommandMenu();
                                    openQuickLog();
                                }}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-foreground hover:bg-primary/15 transition-colors text-left"
                            >
                                <Plus className="w-4 h-4 text-primary" />
                                <span>Log Study Time</span>
                            </button>

                            {showReferenceSheet && (
                                <a
                                    href={referenceSheetUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={closeCommandMenu}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-foreground hover:bg-muted/60 transition-colors text-left"
                                >
                                    <ExternalLink className="w-4 h-4 text-sky-400" />
                                    <span>Open Reference Sheet</span>
                                </a>
                            )}

                            <button
                                onClick={() => {
                                    toggleTheme();
                                    closeCommandMenu();
                                }}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-foreground hover:bg-muted/60 transition-colors text-left"
                            >
                                {theme === 'dark' ? (
                                    <Sun className="w-4 h-4 text-amber-400" />
                                ) : (
                                    <Moon className="w-4 h-4 text-indigo-400" />
                                )}
                                <span>Toggle Theme ({theme === 'dark' ? 'Light' : 'Dark'})</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer hint */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground">
                    <span>Press <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded">ESC</kbd> to close</span>
                    <span>PrepTrack Quick Command</span>
                </div>
            </div>
        </div>
    );
}
