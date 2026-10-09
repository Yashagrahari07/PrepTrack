import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Target, ArrowRight, UserPlus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSignup } from '@/hooks/useAuth';

export default function SignupPage() {
    const { mutate: signup, isPending } = useSignup();

    const [formData, setFormData] = useState({
        display_name: '',
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        signup(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="relative min-h-screen bg-background flex items-center justify-center p-4 max-sm:py-6 max-sm:flex-col max-sm:justify-start max-sm:gap-5">
            {/* Background layers */}
            <div className="pointer-events-none fixed inset-0 ambient-glow-indigo" aria-hidden="true" />
            <div className="pointer-events-none fixed inset-0 ambient-glow-emerald" aria-hidden="true" />
            <div className="pointer-events-none fixed inset-0 bg-dot-pattern fade-mask-radial opacity-30" aria-hidden="true" />

            {/* Back to home */}
            <Link
                to="/"
                className="absolute top-6 left-6 max-sm:static max-sm:self-start flex items-center gap-2.5 rounded-full bg-card/70 backdrop-blur border border-border pl-1.5 pr-4 py-1.5 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all text-sm"
            >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-md shadow-primary/30">
                    <Target className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold">PrepTrack</span>
            </Link>

            {/* Card */}
            <div className="relative z-10 w-full max-w-md">
                <div
                    className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl shadow-primary/10 animate-fade-up"
                    style={{ opacity: 0, animationFillMode: 'forwards' }}
                >
                    <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" aria-hidden="true" />

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-lg shadow-primary/30">
                                <UserPlus className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-2">Get started</p>
                        <h1 className="text-[28px] font-bold tracking-tight text-foreground mb-1.5">Create your account</h1>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Free to join. Set up your account to start tracking your prep.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="display_name">Full Name</Label>
                            <Input
                                id="display_name"
                                name="display_name"
                                type="text"
                                autoComplete="name"
                                placeholder="Yash"
                                value={formData.display_name}
                                onChange={handleChange}
                                required
                            />
                        </div>

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
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Min. 8 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="pr-11"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors"
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
                                    Create Account
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                            {isPending && 'Creating account...'}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 border-t border-border" />
                        <span className="text-muted-foreground text-xs">or</span>
                        <div className="flex-1 border-t border-border" />
                    </div>

                    {/* Login link */}
                    <p className="text-center text-muted-foreground text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary hover:underline font-medium">
                            Sign in
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
