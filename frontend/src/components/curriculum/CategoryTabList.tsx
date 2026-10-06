import { Plus, Trash2 } from 'lucide-react';
import type { Category } from '@/lib/types';
import { useDeleteCategory } from '@/hooks/useCurriculum';

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
    const { mutate: deleteCategory } = useDeleteCategory();

    const handleDeleteCategory = (cat: Category, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete domain "${cat.name}" and all its topics?`)) {
            deleteCategory(cat.id);
            if (selectedCategoryId === cat.id) {
                onSelectCategory(null);
            }
        }
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
                All Domains
            </button>

            {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                    <div key={cat.id} className="relative flex items-center group">
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
                            {isSelected && (
                                <span
                                    role="button"
                                    onClick={(e) => handleDeleteCategory(cat, e)}
                                    className="ml-1 p-0.5 rounded text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    title={`Delete domain "${cat.name}"`}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </span>
                            )}
                        </button>
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
                    <span>New Domain</span>
                </button>
            )}
        </div>
    );
}
