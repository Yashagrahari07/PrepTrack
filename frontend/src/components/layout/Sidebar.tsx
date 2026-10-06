import { Link, useLocation } from 'react-router-dom';
import {
    Target,
    BarChart3,
    BookOpen,
    RotateCcw,
    TrendingUp,
    Settings,
    LogOut,
    X,
} from 'lucide-react';
import { useCurrentUser, useLogout } from '@/hooks/useAuth';
import { useAppStore } from '@/stores/app/app.store';
import { cn } from '@/lib/utils';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    to: string;
    active: boolean;
    onClick?: () => void;
}

function NavItem({ icon, label, to, active, onClick }: NavItemProps) {
    return (
        <Link
            to={to}
            onClick={onClick}
            className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150',
                active
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
            )}
        >
            <div className="shrink-0">{icon}</div>
            <span className="truncate">{label}</span>
        </Link>
    );
}

export function Sidebar() {
    const location = useLocation();
    const { data: user } = useCurrentUser();
    const logout = useLogout();
    const isSidebarOpen = useAppStore((s) => s.isSidebarOpen);
    const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);

    const currentPath = location.pathname;

    const navItems = [
        { label: 'Dashboard', to: '/home', icon: <BarChart3 className="w-4 h-4" /> },
        { label: 'Curriculum', to: '/home/curriculum', icon: <BookOpen className="w-4 h-4" /> },
        { label: 'Revisions', to: '/home/revisions', icon: <RotateCcw className="w-4 h-4" /> },
        { label: 'Stats Hub', to: '/home/stats', icon: <TrendingUp className="w-4 h-4" /> },
        { label: 'Settings', to: '/home/settings', icon: <Settings className="w-4 h-4" /> },
    ];

    return (
        <>
            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar drawer */}
            <aside
                className={cn(
                    'fixed md:static inset-y-0 left-0 z-50 flex flex-col w-64 shrink-0 bg-card border-r border-border transition-transform duration-200 ease-in-out md:translate-x-0 h-full',
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                {/* Logo & Close button */}
                <div className="flex items-center justify-between px-5 py-5 border-b border-border">
                    <Link to="/home" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <Target className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-foreground text-lg tracking-tight">PrepTrack</span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="md:hidden text-muted-foreground hover:text-foreground p-1"
                        aria-label="Close sidebar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation links */}
                <nav className="flex-1 p-3 flex flex-col gap-1.5 overflow-y-auto min-h-0">
                    <div className="px-3 py-1.5 mb-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Control Center
                        </span>
                    </div>

                    {navItems.map((item) => {
                        const isActive =
                            item.to === '/home'
                                ? currentPath === '/home'
                                : currentPath.startsWith(item.to);
                        return (
                            <NavItem
                                key={item.to}
                                icon={item.icon}
                                label={item.label}
                                to={item.to}
                                active={isActive}
                                onClick={() => setSidebarOpen(false)}
                            />
                        );
                    })}
                </nav>

                {/* User footer */}
                <div className="p-3 border-t border-border bg-muted/20">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-1">
                        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {user?.display_name?.[0]?.toUpperCase() ?? 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                                {user?.display_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150 text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
