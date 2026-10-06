import { useState, useEffect } from 'react';
import { Settings, Target, Link2, RotateCcw, Save } from 'lucide-react';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DEFAULT_DSA_URL = 'https://neetcode.io/practice/practice/neetcode150';

export default function SettingsPage() {
    const { data: settings, isLoading } = useSettings();
    const { mutate: updateSettings, isPending } = useUpdateSettings();

    const [weeklyTargetHours, setWeeklyTargetHours] = useState<number>(15);
    const [dsaSheetUrl, setDsaSheetUrl] = useState<string>(DEFAULT_DSA_URL);

    useEffect(() => {
        if (settings) {
            setWeeklyTargetHours(settings.weekly_target_hours ?? 15);
            setDsaSheetUrl(settings.dsa_sheet_url ?? DEFAULT_DSA_URL);
        }
    }, [settings]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateSettings({
            weekly_target_hours: Number(weeklyTargetHours),
            dsa_sheet_url: dsaSheetUrl.trim(),
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 animate-pulse">
                <div className="h-28 rounded-3xl bg-card border border-border" />
                <div className="h-64 rounded-3xl bg-card border border-border" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in max-w-4xl pb-8">
            {/* ── Page Header ───────────────────────────────────── */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 ambient-glow-indigo opacity-50 pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
                            <Settings className="w-6 h-6 text-primary" />
                            <span>User Settings & Goal Preferences</span>
                        </h2>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                            Customize your weekly study target and external DSA problem sheet link.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Settings Form ──────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Weekly Target Hours Panel */}
                <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-sky-500/20 flex items-center justify-center text-sky-400">
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-foreground">Weekly Target Hours</h3>
                            <p className="text-xs text-muted-foreground">
                                Set your weekly goal for study hours (used in dashboard progress metrics).
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <Input
                                type="number"
                                step="0.5"
                                min="0.5"
                                max="168"
                                value={weeklyTargetHours}
                                onChange={(e) => setWeeklyTargetHours(Number(e.target.value))}
                                className="w-32 h-11 text-base font-bold text-foreground text-center"
                                required
                            />
                            <span className="text-sm font-semibold text-muted-foreground">Hours / Week</span>
                        </div>

                        {/* Presets */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            <span className="text-xs text-muted-foreground self-center mr-1 font-medium">Quick Presets:</span>
                            {[10, 15, 20, 30].map((hours) => (
                                <button
                                    key={hours}
                                    type="button"
                                    onClick={() => setWeeklyTargetHours(hours)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                        weeklyTargetHours === hours
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-card border-border text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {hours} Hours
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* DSA Sheet Link Panel */}
                <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <Link2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground">DSA Problem Sheet URL</h3>
                                <p className="text-xs text-muted-foreground">
                                    Direct link used in the top navbar &quot;DSA&quot; shortcut pill.
                                </p>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDsaSheetUrl(DEFAULT_DSA_URL)}
                            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset to Default</span>
                        </Button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="dsa-url">Sheet URL</Label>
                        <Input
                            id="dsa-url"
                            type="url"
                            placeholder="https://..."
                            value={dsaSheetUrl}
                            onChange={(e) => setDsaSheetUrl(e.target.value)}
                            className="h-11 text-xs font-mono"
                            required
                        />
                    </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end pt-2">
                    <Button size="lg" type="submit" isLoading={isPending} className="gap-2 px-8 shadow-lg shadow-primary/20">
                        <Save className="w-4 h-4" />
                        <span>Save Preferences</span>
                    </Button>
                </div>
            </form>
        </div>
    );
}
