import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardPage from '@/pages/DashboardPage';

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
                            <Route path="/app" element={<DashboardPage />} />
                            {/* Additional /app/* routes will be added here */}
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
