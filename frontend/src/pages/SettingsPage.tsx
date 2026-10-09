import { useEffect } from 'react';
import {
    Settings,
    Target,
    Link2,
    RotateCcw,
    Save,
    Trophy,
    Check,
    Server,
    MonitorSmartphone,
    Layers,
    GraduationCap,
    BookOpen,
    Cloud,
    Languages,
    PenLine,
    type LucideIcon,
} from 'lucide-react';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/app/app.store';
import {
    GOAL_GROUPS,
    DEFAULT_REFERENCE_URL,
} from '@/lib/constants';

const GOAL_ICONS: Record<string, LucideIcon> = {
    sde_backend: Server,
    sde_frontend: MonitorSmartphone,
    sde_fullstack: Layers,
    dsa_competitive: Trophy,
    jee_advanced: GraduationCap,
    gate_cs: BookOpen,
    certification_aws: Cloud,
    certification_gcp: Cloud,
    certification_azure: Cloud,
    language_learning: Languages,
    custom: PenLine,
};

export default function SettingsPage() {
    const { data: settings, isLoading } = useSettings();
    const { mutate: updateSettings, isPending } = useUpdateSettings();

    // ── Settings slice: form drafts survive navigation ─────────────────────
    const weeklyTargetHoursDraft = useAppStore((s) => s.weeklyTargetHoursDraft);
    const setWeeklyTargetHoursDraft = useAppStore((s) => s.setWeeklyTargetHoursDraft);
    const referenceSheetUrlDraft = useAppStore((s) => s.referenceSheetUrlDraft);
    const setReferenceSheetUrlDraft = useAppStore((s) => s.setReferenceSheetUrlDraft);
    const goalTypeDraft = useAppStore((s) => s.goalTypeDraft);
    const setGoalTypeDraft = useAppStore((s) => s.setGoalTypeDraft);
    const goalCustomTextDraft = useAppStore((s) => s.goalCustomTextDraft);
    const setGoalCustomTextDraft = useAppStore((s) => s.setGoalCustomTextDraft);
    const showReferenceSheetDraft = useAppStore((s) => s.showReferenceSheetDraft);
    const setShowReferenceSheetDraft = useAppStore((s) => s.setShowReferenceSheetDraft);

    // Resolved display values: prefer in-progress draft, fall back to server data
    const weeklyTargetHours = weeklyTargetHoursDraft ?? settings?.weekly_target_hours ?? 15;
    const referenceSheetUrl = referenceSheetUrlDraft ?? settings?.reference_sheet_url ?? DEFAULT_REFERENCE_URL;
    const goalType = goalTypeDraft ?? settings?.goal_type ?? null;
    const goalCustomText = goalCustomTextDraft ?? settings?.goal_custom_text ?? '';
    const showReferenceSheet = showReferenceSheetDraft ?? settings?.show_reference_sheet ?? true;

    // Dirty tracking: enable Save only when something differs from the server
    const isDirty =
        Number(weeklyTargetHours) !== (settings?.weekly_target_hours ?? 15) ||
        referenceSheetUrl.trim() !== (settings?.reference_sheet_url ?? DEFAULT_REFERENCE_URL) ||
        goalType !== (settings?.goal_type ?? null) ||
        (goalCustomText.trim() || '') !== (settings?.goal_custom_text ?? '') ||
        showReferenceSheet !== (settings?.show_reference_sheet ?? true);

    // Seed the draft fields once server data arrives (only if user hasn't touched them yet)
    useEffect(() => {
        if (settings) {
            if (weeklyTargetHoursDraft === null) {
                setWeeklyTargetHoursDraft(settings.weekly_target_hours ?? 15);
            }
            if (referenceSheetUrlDraft === null) {
                setReferenceSheetUrlDraft(settings.reference_sheet_url ?? DEFAULT_REFERENCE_URL);
            }
            if (goalTypeDraft === null) {
                setGoalTypeDraft(settings.goal_type ?? null);
            }
            if (goalCustomTextDraft === null) {
                setGoalCustomTextDraft(settings.goal_custom_text ?? '');
            }
            if (showReferenceSheetDraft === null) {
                setShowReferenceSheetDraft(settings.show_reference_sheet ?? true);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings]);

    // Smart default for reference sheet toggle based on goal type
    useEffect(() => {
        if (showReferenceSheetDraft === null && goalTypeDraft !== null) {
            const isSDEGoal = ['sde_backend', 'sde_frontend', 'sde_fullstack', 'dsa_competitive'].includes(goalTypeDraft);
            setShowReferenceSheetDraft(isSDEGoal);
        }
    }, [goalTypeDraft]);

    // Auto-suggest weekly target when goal changes
    useEffect(() => {
        if (goalTypeDraft !== null && weeklyTargetHoursDraft === null) {
            const goalTargets: Record<string, number> = {
                sde_backend: 15,
                sde_frontend: 12,
                sde_fullstack: 18,
                dsa_competitive: 20,
                jee_advanced: 25,
                gate_cs: 20,
                certification_aws: 10,
                certification_gcp: 10,
                certification_azure: 10,
                language_learning: 7,
                custom: 10,
            };
            const suggested = goalTargets[goalTypeDraft] ?? 15;
            toast.info(`Suggested weekly target for ${suggested}h/week`, {
                // Action toasts need extra dwell time so users can read + click Apply.
                duration: 8000,
                action: {
                    label: 'Apply',
                    onClick: () => setWeeklyTargetHoursDraft(suggested),
                },
            });
        }
    }, [goalTypeDraft]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            if (isDirty && !isPending) {
                handleSubmit(e as unknown as React.FormEvent);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateSettings(
            {
                weekly_target_hours: Number(weeklyTargetHours),
                reference_sheet_url: referenceSheetUrl.trim(),
                goal_type: goalType,
                goal_custom_text: goalCustomText.trim() || null,
                show_reference_sheet: showReferenceSheet,
            },
            {
                onSuccess: () => {
                    setWeeklyTargetHoursDraft(null);
                    setReferenceSheetUrlDraft(null);
                    setGoalTypeDraft(null);
                    setGoalCustomTextDraft(null);
                    setShowReferenceSheetDraft(null);
                },
            },
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 animate-pulse">
                <div className="h-28 rounded-3xl bg-card border border-border" />
                <div className="grid gap-6 xl:grid-cols-2">
                    <div className="h-80 rounded-3xl bg-card border border-border" />
                    <div className="flex flex-col gap-6">
                        <div className="h-56 rounded-3xl bg-card border border-border" />
                        <div className="h-56 rounded-3xl bg-card border border-border" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            {/* ── Settings Form ──────────────────────────────────── */}
            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-6">
                {/* ── Page Header ───────────────────────────────────── */}
                <div className="glass-panel rounded-3xl p-6 border border-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 ambient-glow-indigo opacity-50 pointer-events-none" />
                    <div className="relative">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-1 flex items-center gap-2">
                            <Settings className="w-6 h-6 text-primary" />
                            <span>User Settings & Goal Preferences</span>
                        </h2>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                            Customize your preparation goal, weekly target, and reference sheet shortcut.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
                    <div>
                        {/* Goal Preference Panel */}
                <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold tabular-nums text-muted-foreground/70">01</span>
                        <div className="w-10 h-10 rounded-2xl bg-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold tracking-tight text-foreground">Preparation Goal</h3>
                            <p className="text-xs text-muted-foreground">
                                Your goal personalizes the dashboard message and suggests a weekly target.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Label>What are you preparing for?</Label>
                        {GOAL_GROUPS.map((group) => (
                            <div key={group.group}>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">
                                    {group.group}
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {group.items.map((item) => {
                                        const ItemIcon = GOAL_ICONS[item.value] ?? PenLine;
                                        const selected = goalType === item.value;
                                        return (
                                            <button
                                                key={item.value}
                                                type="button"
                                                onClick={() => setGoalTypeDraft(item.value)}
                                                aria-pressed={selected}
                                                className={`relative flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-all duration-150 active:scale-[0.98] ${
                                                    selected
                                                        ? 'bg-primary/10 border-primary shadow-md shadow-primary/10'
                                                        : 'bg-card border-border hover:border-primary/40 hover:bg-muted/40'
                                                }`}
                                            >
                                                {selected && (
                                                    <span className="absolute right-2 top-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                        <Check className="w-3 h-3 text-primary-foreground" />
                                                    </span>
                                                )}
                                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                    selected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                                                }`}>
                                                    <ItemIcon className="w-4 h-4" />
                                                </span>
                                                <span>
                                                    <span className={`block text-xs font-semibold leading-tight ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                        {item.label}
                                                    </span>
                                                    <span className="block text-[10px] text-muted-foreground mt-0.5">
                                                        {item.targetHours}h / week
                                                    </span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {goalType === 'custom' && (
                            <div className="flex flex-col gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                                <Label htmlFor="goal-custom">Describe your goal</Label>
                                <Input
                                    id="goal-custom"
                                    type="text"
                                    placeholder="e.g., Crack SDE 2 at FAANG, Pass JLPT N2, Get PMP certified"
                                    value={goalCustomText}
                                    onChange={(e) => setGoalCustomTextDraft(e.target.value)}
                                    maxLength={200}
                                    className="h-11 text-xs bg-card"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    {goalCustomText.length}/200 characters
                                </p>
                            </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                            Your goal tailors the dashboard welcome message and suggested weekly target.
                            This is private. Only you see it.
                        </p>
                    </div>
                </div>
                </div>
                <div className="flex flex-col gap-6">

                {/* Weekly Target Hours Panel */}
                <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold tabular-nums text-muted-foreground/70">02</span>
                        <div className="w-10 h-10 rounded-2xl bg-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
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
                                onChange={(e) => setWeeklyTargetHoursDraft(Number(e.target.value))}
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
                                    onClick={() => setWeeklyTargetHoursDraft(hours)}
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

                {/* Reference Sheet Shortcut Panel */}
                <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="text-[11px] font-bold tabular-nums text-muted-foreground/70">03</span>
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                <Link2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground">Reference Sheet Shortcut</h3>
                                <p className="text-xs text-muted-foreground">
                                    Quick-access link in the top navbar and command palette.
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={showReferenceSheet}
                            onChange={(checked) => setShowReferenceSheetDraft(checked)}
                            id="ref-sheet-toggle"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="reference-url">Sheet URL</Label>
                        <Input
                            id="reference-url"
                            type="url"
                            placeholder="https://..."
                            value={referenceSheetUrl}
                            onChange={(e) => setReferenceSheetUrlDraft(e.target.value)}
                            className="h-11 text-xs font-mono"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Used in the top navbar "Reference Sheet" pill and ⌘K command palette.
                        </p>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setReferenceSheetUrlDraft(DEFAULT_REFERENCE_URL)}
                        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset to Default (NeetCode)</span>
                    </Button>
                </div>
                </div>
                </div>

                {/* ── Sticky action bar ─────────────────────────────── */}
                <div className="sticky bottom-0 max-sm:bottom-3 z-10 glass-panel rounded-2xl border border-white/10 px-4 py-3 max-sm:pb-[env(safe-area-inset-bottom)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        {isDirty && !isPending ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                Unsaved changes
                            </span>
                        ) : (
                            <span className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground/70">
                                Press
                                <kbd className="rounded-md bg-muted border border-border px-1.5 py-0.5 font-mono text-[10px] font-semibold">Ctrl S</kbd>
                                to save
                            </span>
                        )}
                    </div>
                    <Button
                        type="submit"
                        isLoading={isPending}
                        disabled={!isDirty}
                        className="gap-2 rounded-2xl px-7 shadow-xl shadow-primary/30 hover:shadow-primary/50 disabled:shadow-none"
                    >
                        <Save className="w-4 h-4" />
                        <span>Save Preferences</span>
                    </Button>
                </div>
            </form>
        </div>
    );
}