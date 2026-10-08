import React from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { Category } from '@/lib/types';
import { useDeleteCategory } from '@/hooks/useCurriculum';
import { queryKeys } from '@/api/queryKeys';
import { useAppStore } from '@/stores/app/app.store';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { CategoryFormModal } from '@/components/curriculum/CategoryFormModal';

interface CategoryTabListProps {
    categories: Category[];
    selectedCategoryId: string | null;
    onSelectCategory: (id: string | null) => void;
    onAddCategory?: () => void;
}

export function CategoryTabList({
    categories,
    selectedCategoryId,
    onSelectCategory,
    onAddCategory,
}: CategoryTabListProps) {
    const qc = useQueryClient();
    const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategory();
    const [deletingCat, setDeletingCat] = React.useState<Category | null>(null);
    const [editingCat, setEditingCat] = React.useState<Category | null>(null);
    const isCategoryModalOpen = useAppStore((s) => s.isCategoryModalOpen);
    const closeCategoryModal = useAppStore((s) => s.closeCategoryModal);

    const handleConfirmDelete = () => {
        if (!deletingCat || isDeleting) return;
        const target = deletingCat;
        deleteCategory(target.id, {
            onSuccess: () => {
                setDeletingCat(null);
                qc.invalidateQueries({ queryKey: queryKeys.categories.tree() });
                if (selectedCategoryId === target.id) {
                    onSelectCategory(null);
                }
            },
        });
    };

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none items-center">
            <button
                type="button"
                onClick={() => onSelectCategory(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategoryId === null
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
            >
                All Categories
            </button>

            {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                    <div key={cat.id} className="relative flex items-center group gap-1">
                        <button
                            type="button"
                            onClick={() => onSelectCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                                isSelected
                                    ? 'bg-card border-primary text-foreground shadow-md shadow-primary/10'
                                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
                            }`}
                        >
                            <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: cat.color }}
                            />
                            <span>{cat.name}</span>
                            {cat.topic_count !== undefined && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                                    {cat.topic_count}
                                </span>
                            )}
                        </button>
                        {isSelected && (
                            <span className="flex items-center shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setEditingCat(cat)}
                                    className="p-0.5 rounded text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors"
                                    title={`Edit category "${cat.name}"`}
                                    aria-label={`Edit category ${cat.name}`}
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeletingCat(cat)}
                                    className="p-0.5 rounded text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    title={`Delete category "${cat.name}"`}
                                    aria-label={`Delete category ${cat.name}`}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        )}
                    </div>
                );
            })}

            {onAddCategory && (
                <button
                    type="button"
                    onClick={onAddCategory}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-all whitespace-nowrap"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Category</span>
                </button>
            )}

            <ConfirmModal
                isOpen={deletingCat !== null}
                title="Delete category?"
                description={
                    deletingCat
                        ? `Delete category "${deletingCat.name}"? Its topics, subtopics, resources, and study logs will also be removed. This cannot be undone.`
                        : ''
                }
                onConfirm={handleConfirmDelete}
                onClose={() => {
                    if (!isDeleting) setDeletingCat(null);
                }}
                isPending={isDeleting}
            />

            <CategoryFormModal
                isOpen={editingCat !== null}
                onClose={() => setEditingCat(null)}
                editingCategory={editingCat}
            />

            <CategoryFormModal isOpen={isCategoryModalOpen} onClose={closeCategoryModal} />
        </div>
    );
}
