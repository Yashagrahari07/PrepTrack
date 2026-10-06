import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { GuestRoute } from '@/components/GuestRoute';
import AppLayout from '@/components/layout/AppLayout';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardPage from '@/pages/DashboardPage';
import CurriculumPage from '@/pages/CurriculumPage';
import TopicWorkspacePage from '@/pages/TopicWorkspacePage';
import RevisionsPage from '@/pages/RevisionsPage';
import StatsPage from '@/pages/StatsPage';
import SettingsPage from '@/pages/SettingsPage';

export default function App() {
    return (
        <QueryProvider>
            <BrowserRouter>
                <ThemeProvider>
                    <Routes>
                        {/* ── Guest Only Routes (Redirect logged in users to /home) ── */}
                        <Route element={<GuestRoute />}>
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/signup" element={<SignupPage />} />
                        </Route>

                        {/* ── Protected Application Routes ────────────────────── */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<AppLayout />}>
                                <Route path="/home" element={<DashboardPage />} />
                                <Route path="/home/curriculum" element={<CurriculumPage />} />
                                <Route path="/home/topics/:id" element={<TopicWorkspacePage />} />
                                <Route path="/home/revisions" element={<RevisionsPage />} />
                                <Route path="/home/stats" element={<StatsPage />} />
                                <Route path="/home/settings" element={<SettingsPage />} />
                            </Route>
                        </Route>

                        {/* ── Legacy /app fallback redirects to /home ──────────── */}
                        <Route path="/app/*" element={<Navigate to="/home" replace />} />
                        <Route path="/app" element={<Navigate to="/home" replace />} />

                        {/* ── Catch-all ───────────────────────────── */}
                        <Route path="*" element={<Navigate to="/home" replace />} />
                    </Routes>

                    {/* Global toast notifications */}
                    <Toaster
                        position="bottom-right"
                        theme="dark"
                        richColors
                        toastOptions={{
                            duration: 4000,
                        }}
                    />
                </ThemeProvider>
            </BrowserRouter>
        </QueryProvider>
    );
}
