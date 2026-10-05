import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { QuickLogModal } from './QuickLogModal';
import { CommandMenu } from './CommandMenu';

export function AppLayout() {
    return (
        <div className="relative min-h-screen bg-background flex flex-col md:flex-row overflow-x-hidden">
            {/* Background glowing gradients */}
            <div className="pointer-events-none fixed inset-0 ambient-glow-indigo opacity-50" aria-hidden="true" />

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="relative z-10 flex-1 flex flex-col min-w-0 min-h-screen">
                {/* Header TopNav */}
                <TopNav />

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                    <Outlet />
                </main>
            </div>

            {/* Global Overlays */}
            <QuickLogModal />
            <CommandMenu />
        </div>
    );
}
export default AppLayout;
