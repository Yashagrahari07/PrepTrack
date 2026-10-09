import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Search, X, Check, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/stores/app/app.store';
import { useCategories, useCategoryTopics } from '@/hooks/useCurriculum';
import { useCreateStudyLog } from '@/hooks/useStudyLogs';
import type { Topic } from '@/lib/types';

export function QuickLogModal() {
    const isQuickLogOpen = useAppStore((s) => s.isQuickLogOpen);
    const activeTopicId = useAppStore((s) => s.quickLogTopicId);
    const closeQuickLog = useAppStore((s) => s.closeQuickLog);
    const { data: rawCategories } = useCategories();
    const { mutate: logStudyTime, isPending } = useCreateStudyLog();

    const categories = Array.isArray(rawCategories) ? rawCategories : [];

    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [selectedTopicId, setSelectedTopicId] = useState<string | null>(activeTopicId);
    const [minutes, setMinutes] = useState<number>(45);
    const [comment, setComment] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Pre-select category if topics are loaded or activeTopicId is set
    useEffect(() => {
        if (activeTopicId) {
            setSelectedTopicId(activeTopicId);
        } else if (categories.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(categories[0].id);
        }
    }, [activeTopicId, categories, selectedCategoryId]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isQuickLogOpen && !isPending) {
                closeQuickLog();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isQuickLogOpen, isPending, closeQuickLog]);

    const { data: rawCategoryTopics } = useCategoryTopics(selectedCategoryId);
    const categoryTopics = Array.isArray(rawCategoryTopics) ? rawCategoryTopics : [];

    // Filter topics by search query
    const filteredTopics = categoryTopics.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (!isQuickLogOpen) return null;

    const handleBackdropClick = () => {
        if (!isPending) {
            closeQuickLog();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTopicId || minutes <= 0 || isPending) return;

        logStudyTime(
            { topic_id: selectedTopicId, minutes: Number(minutes), comment: comment || undefined },
            {
                onSuccess: () => {
                    closeQuickLog();
                    setComment('');
                },
            },
        );
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
            onClick={handleBackdropClick}
        >
            <div
                className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto overscroll-contain bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Log Study Time</h2>
                            <p className="text-xs text-muted-foreground">Keep your streak alive (≥30 mins/day)</p>
                        </div>
                    </div>
                    <button
                        onClick={closeQuickLog}
                        disabled={isPending}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* Category Selector */}
                    <div className="flex flex-col gap-1.5">
                        <Label>Category</Label>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => {
                                        setSelectedCategoryId(cat.id);
                                        setSelectedTopicId(null);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                        selectedCategoryId === cat.id
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Topic Search & Selection */}
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <Label>Select Topic</Label>
                            <span className="text-[10px] text-muted-foreground">
                                {filteredTopics.length} topics available
                            </span>
                        </div>

                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search topic..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                disabled={isPending}
                                className="pl-9 h-9 text-xs"
                            />
                        </div>

                        <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-muted/20 p-1 flex flex-col gap-1 mt-1">
                            {filteredTopics.length === 0 ? (
                                <p className="text-xs text-muted-foreground p-3 text-center">
                                    No topics found for this category.
                                </p>
                            ) : (
                                filteredTopics.map((topic: Topic) => {
                                    const isSelected = selectedTopicId === topic.id;
                                    return (
                                        <button
                                            key={topic.id}
                                            type="button"
                                            disabled={isPending}
                                            onClick={() => setSelectedTopicId(topic.id)}
                                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                                                isSelected
                                                    ? 'bg-primary/20 text-primary font-semibold border border-primary/30'
                                                    : 'text-foreground hover:bg-muted/60'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            <span className="truncate">{topic.title}</span>
                                            {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Duration Preset Buttons & Custom Input */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="minutes">Duration (Minutes)</Label>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                            {[15, 30, 45, 60].map((mins) => (
                                <button
                                    key={mins}
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => setMinutes(mins)}
                                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                                        minutes === mins
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {mins}m
                                </button>
                            ))}
                        </div>
                        <Input
                            id="minutes"
                            type="number"
                            min={1}
                            max={600}
                            value={minutes}
                            onChange={(e) => setMinutes(Number(e.target.value))}
                            disabled={isPending}
                            required
                        />
                    </div>

                    {/* Optional Comment */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="comment">Comment / Takeaway (Optional)</Label>
                        <Input
                            id="comment"
                            placeholder="e.g. Understood B+ Tree node splitting and page layouts."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            disabled={isPending}
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        size="lg"
                        isLoading={isPending}
                        loadingText="Logging Time..."
                        disabled={!selectedTopicId || minutes <= 0}
                        className="mt-2"
                    >
                        <Flame className="w-4 h-4 mr-1 text-amber-400" />
                        Log {minutes} Minutes
                    </Button>
                </form>
            </div>
        </div>,
        document.body,
    );
}
