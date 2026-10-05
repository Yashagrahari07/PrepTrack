import type { Category } from '@/lib/types';

interface CategoryTabListProps {
    categories: Category[];
    selectedCategoryId: string | null;
    onSelectCategory: (id: string | null) => void;
}

export function CategoryTabList({
    categories,
    selectedCategoryId,
    onSelectCategory,
}: CategoryTabListProps) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
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
                    <button
                        key={cat.id}
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
                );
            })}
        </div>
    );
}
