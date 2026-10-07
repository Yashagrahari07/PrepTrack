import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Target, ArrowRight, Flame, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/hooks/useAuth';

export default function LoginPage() {
    const { mutate: login, isPending } = useLogin();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
            {/* Background layers */}
            <div className="pointer-events-none fixed inset-0 ambient-glow-indigo" aria-hidden="true" />
            <div className="pointer-events-none fixed inset-0 bg-dot-pattern fade-mask-radial opacity-30" aria-hidden="true" />

            {/* Back to home */}
            <Link
                to="/"
                className="absolute top-6 left-6 flex items-center gap-2.5 rounded-full bg-card/70 backdrop-blur border border-border pl-1.5 pr-4 py-1.5 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all text-sm"
            >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-md shadow-primary/30">
                    <Target className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold">PrepTrack</span>
            </Link>

            {/* Card */}
            <div className="relative z-10 w-full max-w-md">
                <div className="glass-panel relative overflow-hidden rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl shadow-primary/10 animate-fade-up" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                    <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" aria-hidden="true" />

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-lg shadow-primary/30">
                                <Flame className="w-5 h-5 text-white animate-pulse-flame" />
                            </div>
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-2">Sign in</p>
                        <h1 className="text-[28px] font-bold tracking-tight text-foreground mb-1.5">Welcome back</h1>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Sign in to continue your prep streak.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="pr-11"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            isLoading={isPending}
                            className="w-full mt-1 group"
                        >
                            {!isPending && (
                                <>
                                    Sign in
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                            {isPending && 'Signing in...'}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 border-t border-border" />
                        <span className="text-muted-foreground text-xs">or</span>
                        <div className="flex-1 border-t border-border" />
                    </div>

                    {/* Signup link */}
                    <p className="text-center text-muted-foreground text-sm">
                        Don&apos;t have an account?{' '}
                        <Link to="/signup" className="text-primary hover:underline font-medium">
                            Create an account
                        </Link>
                    </p>
                    <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80">
                        <Lock className="w-3 h-3" />
                        Your data stays private to your account.
                    </p>
                </div>
            </div>
        </div>
    );
}
