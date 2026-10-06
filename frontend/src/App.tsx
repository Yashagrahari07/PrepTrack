import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
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
                        {/* ── Public Routes ───────────────────────── */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />

                        {/* ── Protected Routes ────────────────────── */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<AppLayout />}>
                                <Route path="/app" element={<DashboardPage />} />
                                <Route path="/app/curriculum" element={<CurriculumPage />} />
                                <Route path="/app/topics/:id" element={<TopicWorkspacePage />} />
                                <Route path="/app/revisions" element={<RevisionsPage />} />
                                <Route path="/app/stats" element={<StatsPage />} />
                                <Route path="/app/settings" element={<SettingsPage />} />
                            </Route>
                        </Route>

                        {/* ── Catch-all ───────────────────────────── */}
                        <Route path="*" element={<Navigate to="/" replace />} />
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
