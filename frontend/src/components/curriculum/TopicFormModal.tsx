import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, BookPlus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateTopic, useUpdateTopic } from '@/hooks/useCurriculum';
import { useAppStore } from '@/stores/app/app.store';
import type { Category, Topic } from '@/lib/types';

interface TopicFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    defaultCategoryId?: string | null;
    parentTopic?: Topic | null;
}

export function TopicFormModal({
    isOpen,
    onClose,
    categories,
    defaultCategoryId,
    parentTopic,
}: TopicFormModalProps) {
    const { mutate: createTopic, isPending: isCreating } = useCreateTopic();
    const { mutate: updateTopic, isPending: isUpdating } = useUpdateTopic();
    const editingTopic = useAppStore((s) => s.editingTopic);
    const isPending = isCreating || isUpdating;
    const isEdit = editingTopic !== null;

    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState(defaultCategoryId || categories[0]?.id || '');
    const initRef = useRef<string | null>(null);

    // Create-mode sync (unchanged behavior)
    useEffect(() => {
        if (isEdit) return;
        if (parentTopic) {
            setCategoryId(parentTopic.category_id);
        } else if (defaultCategoryId) {
            setCategoryId(defaultCategoryId);
        } else if (categories.length > 0 && !categoryId) {
            setCategoryId(categories[0].id);
        }
    }, [defaultCategoryId, parentTopic, categories, categoryId, isEdit]);

    // Edit-mode prefill, once per opened topic (never clobbered by refetches)
    useEffect(() => {
        if (isOpen && editingTopic && initRef.current !== editingTopic.id) {
            initRef.current = editingTopic.id;
            setTitle(editingTopic.title);
            setCategoryId(editingTopic.category_id);
        }
        if (!isOpen) {
            initRef.current = null;
            if (!editingTopic) setTitle('');
        }
    }, [isOpen, editingTopic]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isPending) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isPending, onClose]);

    if (!isOpen) return null;

    const handleBackdropClick = () => {
        if (!isPending) {
            onClose();
        }
    };

    const trimmedTitle = title.trim();
    const categoryChanged = isEdit && !!editingTopic && categoryId !== editingTopic.category_id;
    const isSubtopic = isEdit
        ? editingTopic?.parent_id != null
        : parentTopic != null;
    const dirty = isEdit
        ? !!editingTopic && (trimmedTitle !== editingTopic.title || !!categoryChanged)
        : true;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!trimmedTitle || !categoryId || isPending) return;

        if (isEdit && editingTopic) {
            if (!dirty) {
                onClose();
                return;
            }
            const data: { title?: string; category_id?: string } = {};
            if (trimmedTitle !== editingTopic.title) data.title = trimmedTitle;
            if (categoryChanged) data.category_id = categoryId;
            updateTopic(
                { id: editingTopic.id, data },
                { onSuccess: () => onClose() },
            );
            return;
        }

        if (!trimmedTitle || !categoryId || isPending) return;
        createTopic(
            {
                category_id: categoryId,
                parent_id: parentTopic ? parentTopic.id : null,
                title: trimmedTitle,
            },
            {
                onSuccess: () => {
                    setTitle('');
                    onClose();
                },
            },
        );
    };

    const heading = isEdit
        ? editingTopic?.parent_id
            ? 'Edit Subtopic'
            : 'Edit Topic'
        : parentTopic
          ? `Add Subtopic to "${parentTopic.title}"`
          : 'Create New Topic';

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
            onClick={handleBackdropClick}
        >
            <div
                className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain bg-card border border-border rounded-3xl p-6 shadow-2xl animate-fade-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            {isEdit ? <Pencil className="w-5 h-5" /> : <BookPlus className="w-5 h-5" />}
                        </div>
                        <h2 className="text-base font-bold text-foreground">{heading}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        aria-label="Close"
                        className="text-muted-foreground hover:text-foreground p-1 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {isEdit && isSubtopic && (
                        <p className="text-xs text-muted-foreground rounded-xl bg-muted/40 border border-border px-3 py-2">
                            Subtopic. Parent stays unchanged.
                        </p>
                    )}
                    {!parentTopic && (
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="category">Category</Label>
                        <select
                            id="category"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            disabled={isPending}
                            className="h-11 w-full rounded-xl border border-border bg-input/30 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            required
                        >
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id} className="bg-card text-foreground">
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    )}
                    {isEdit && isSubtopic && categoryChanged && (
                        <p className="text-xs text-amber-400 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2">
                            Moving to another category makes it a top-level topic.
                        </p>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="title">Topic Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Distributed Lock Manager (DLM)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isPending}
                            required
                            autoFocus
                        />
                    </div>

                    {isEdit ? (
                        <div className="flex justify-end gap-2 mt-2">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="lg"
                                isLoading={isPending}
                                loadingText="Updating..."
                                className="mt-0"
                            >
                                Update
                            </Button>
                        </div>
                    ) : (
                        <Button
                            type="submit"
                            size="lg"
                            isLoading={isPending}
                            loadingText={parentTopic ? 'Adding Subtopic...' : 'Creating Topic...'}
                            className="mt-2"
                        >
                            Create {parentTopic ? 'Subtopic' : 'Topic'}
                        </Button>
                    )}
                </form>
            </div>
        </div>,
        document.body,
    );
}
