import { useState, useEffect, useRef } from 'react';
import { FileText, Eye, Edit3, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpdateTopic } from '@/hooks/useCurriculum';
import { useAppStore } from '@/stores/app/app.store';

interface MarkdownNoteEditorProps {
    topicId: string;
    initialNotes?: string;
}

export function MarkdownNoteEditor({ topicId, initialNotes = '' }: MarkdownNoteEditorProps) {
    // ── Workspace slice: draft notes persist across navigations ───────────
    const draftNotes = useAppStore((s) => s.draftNotes);
    const setDraftNote = useAppStore((s) => s.setDraftNote);

    // Initialise draft from store if present, otherwise fall back to server value
    const notes = draftNotes[topicId] ?? initialNotes;

    const [mode, setMode] = useState<'edit' | 'preview'>('edit');
    const [isSaved, setIsSaved] = useState(false);
    const savedTimerRef = useRef<number | null>(null);

    const { mutate: updateTopic, isPending } = useUpdateTopic();

    // When the server-fetched initialNotes arrives for the first time (or topic changes),
    // seed the draft only if we have no unsaved draft yet.
    useEffect(() => {
        if (draftNotes[topicId] === undefined) {
            setDraftNote(topicId, initialNotes || '');
        }
    // Only run when topicId or the freshly-fetched initialNotes changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topicId, initialNotes]);

    // Reset the transient "Saved!" indicator when switching topics.
    useEffect(() => {
        setIsSaved(false);
        if (savedTimerRef.current !== null) {
            window.clearTimeout(savedTimerRef.current);
            savedTimerRef.current = null;
        }
    }, [topicId]);

    // Clear the "Saved!" timer on unmount to avoid setting state on an unmounted component.
    useEffect(() => {
        return () => {
            if (savedTimerRef.current !== null) {
                window.clearTimeout(savedTimerRef.current);
            }
        };
    }, []);

    // Visual indicator: draft differs from saved server value
    const hasDraft = draftNotes[topicId] !== undefined && draftNotes[topicId] !== initialNotes;
    const isDirty = hasDraft;
    // Grey-out until there is something to save; also lock while saving / showing Saved!.
    const isSaveDisabled = !isDirty || isPending || isSaved;

    const handleSave = () => {
        if (!isDirty || isPending) return;
        const snapshot = notes;
        updateTopic(
            { id: topicId, data: { notes_md: snapshot } },
            {
                onSuccess: () => {
                    // Keep the draft at the just-saved value instead of clearing it.
                    // Clearing would fall back to the stale `initialNotes` prop until
                    // React Query refetches, flashing old content. Keeping it stable
                    // means `hasDraft` flips to false naturally once `initialNotes`
                    // catches up to the saved value.
                    setDraftNote(topicId, snapshot);
                    setIsSaved(true);
                    if (savedTimerRef.current !== null) {
                        window.clearTimeout(savedTimerRef.current);
                    }
                    savedTimerRef.current = window.setTimeout(() => {
                        setIsSaved(false);
                        savedTimerRef.current = null;
                    }, 2000);
                },
            },
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        // Typing after a save immediately clears "Saved!" and re-enables the button.
        if (isSaved) {
            setIsSaved(false);
            if (savedTimerRef.current !== null) {
                window.clearTimeout(savedTimerRef.current);
                savedTimerRef.current = null;
            }
        }
        setDraftNote(topicId, e.target.value);
    };

    const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            if (!isSaveDisabled) handleSave();
        }
    };

    // Simple markdown renderer helper for preview
    const renderMarkdown = (content: string) => {
        if (!content.trim()) {
            return <p className="text-muted-foreground italic text-xs">No notes written yet.</p>;
        }

        const lines = content.split('\n');
        return lines.map((line, idx) => {
            if (line.startsWith('# ')) {
                return (
                    <h1 key={idx} className="text-lg font-bold text-foreground mt-3 mb-1">
                        {line.replace('# ', '')}
                    </h1>
                );
            }
            if (line.startsWith('## ')) {
                return (
                    <h2 key={idx} className="text-base font-bold text-foreground mt-3 mb-1">
                        {line.replace('## ', '')}
                    </h2>
                );
            }
            if (line.startsWith('### ')) {
                return (
                    <h3 key={idx} className="text-sm font-bold text-foreground mt-2 mb-1">
                        {line.replace('### ', '')}
                    </h3>
                );
            }
            if (line.startsWith('- ') || line.startsWith('* ')) {
                return (
                    <li key={idx} className="ml-4 list-disc text-xs text-foreground leading-relaxed">
                        {line.substring(2)}
                    </li>
                );
            }
            if (line.startsWith('```')) {
                return null;
            }
            return (
                <p key={idx} className="text-xs text-muted-foreground leading-relaxed my-1">
                    {line}
                </p>
            );
        });
    };

    return (
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-4">
            {/* Header with Mode Switcher & Save Button */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-foreground text-sm sm:text-base">Revision Notes</h3>
                    {hasDraft && (
                        <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                            Unsaved draft
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Tab Switcher */}
                    <div className="flex bg-muted/30 p-1 rounded-xl border border-border">
                        <button
                            type="button"
                            onClick={() => setMode('edit')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                mode === 'edit'
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('preview')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                mode === 'preview'
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                        </button>
                    </div>

                    {/* Save Button — greyed out until there are changes to save */}
                    <Button
                        size="sm"
                        onClick={handleSave}
                        isLoading={isPending}
                        loadingText="Saving..."
                        disabled={isSaveDisabled}
                        title={isDirty ? 'Save notes (Ctrl+S / ⌘S)' : 'No changes to save'}
                        className="gap-1.5 text-xs"
                    >
                        {isSaved ? (
                            <span aria-live="polite" className="inline-flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Saved!</span>
                            </span>
                        ) : (
                            <>
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Notes</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Mode Content */}
            {mode === 'edit' ? (
                <textarea
                    value={notes}
                    onChange={handleChange}
                    onKeyDown={handleEditorKeyDown}
                    placeholder={`Write key takeaways, SQL queries, or architectural formulas here in Markdown...\n\n## Key Concepts\n- Bullet points...`}
                    rows={12}
                    className="w-full bg-input/20 rounded-2xl border border-border p-4 text-xs max-sm:text-base font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30 leading-relaxed resize-y"
                />
            ) : (
                <div className="min-h-[200px] p-4 rounded-2xl bg-card border border-border overflow-y-auto">
                    {renderMarkdown(notes)}
                </div>
            )}
        </div>
    );
}
