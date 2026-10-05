import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Target, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react';
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
        invite_code: '',
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
        <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
            {/* Background layers */}
            <div className="pointer-events-none fixed inset-0 ambient-glow-indigo" aria-hidden="true" />
            <div className="pointer-events-none fixed inset-0 ambient-glow-emerald" aria-hidden="true" />
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
                <div
                    className="glass-panel rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl shadow-primary/10 animate-fade-up"
                    style={{ opacity: 0, animationFillMode: 'forwards' }}
                >

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                                <KeyRound className="w-5 h-5 text-primary" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-1.5">Create your account</h1>
                        <p className="text-muted-foreground text-sm">
                            Prep is invite-only. Enter your invite code to get started.
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
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="invite_code">Invite Code</Label>
                            <Input
                                id="invite_code"
                                name="invite_code"
                                type="text"
                                autoComplete="off"
                                placeholder="Enter your invite code"
                                value={formData.invite_code}
                                onChange={handleChange}
                                className="font-mono tracking-widest"
                                required
                            />
                        </div>

                        {/* Tip */}
                        <div className="flex items-start gap-2 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                PrepTrack is closed to the public. You need an invite code from an existing member.
                            </p>
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
                </div>
            </div>
        </div>
    );
}
