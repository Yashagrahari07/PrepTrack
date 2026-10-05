import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, BookPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateTopic } from '@/hooks/useCurriculum';
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
    const { mutate: createTopic, isPending } = useCreateTopic();

    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState(defaultCategoryId || categories[0]?.id || '');

    useEffect(() => {
        if (parentTopic) {
            setCategoryId(parentTopic.category_id);
        } else if (defaultCategoryId) {
            setCategoryId(defaultCategoryId);
        } else if (categories.length > 0 && !categoryId) {
            setCategoryId(categories[0].id);
        }
    }, [defaultCategoryId, parentTopic, categories, categoryId]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !categoryId) return;

        createTopic(
            {
                category_id: categoryId,
                parent_id: parentTopic ? parentTopic.id : null,
                title: title.trim(),
            },
            {
                onSuccess: () => {
                    setTitle('');
                    onClose();
                },
            },
        );
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl animate-fade-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            <BookPlus className="w-5 h-5" />
                        </div>
                        <h2 className="text-base font-bold text-foreground">
                            {parentTopic ? `Add Subtopic to "${parentTopic.title}"` : 'Create New Topic'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {!parentTopic && (
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="category">Category Domain</Label>
                            <select
                                id="category"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="h-11 w-full rounded-xl border border-border bg-input/30 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
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

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="title">Topic Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Distributed Lock Manager (DLM)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <Button type="submit" size="lg" isLoading={isPending} className="mt-2">
                        Create {parentTopic ? 'Subtopic' : 'Topic'}
                    </Button>
                </form>
            </div>
        </div>,
        document.body,
    );
}
