import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Target, ArrowRight, Flame } from 'lucide-react';
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
                className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
                <div className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center">
                    <Target className="w-3.5 h-3.5 text-primary" />
                </div>
                PrepTrack
            </Link>

            {/* Card */}
            <div className="relative z-10 w-full max-w-md">
                <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl shadow-primary/10 animate-fade-up" style={{ opacity: 0, animationFillMode: 'forwards' }}>

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                                <Flame className="w-5 h-5 text-primary animate-pulse-flame" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-1.5">Welcome back</h1>
                        <p className="text-muted-foreground text-sm">
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
                            Sign up with invite code
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
