import React from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    defaultDropAnimation,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useDndSensors } from '@/hooks/useDndSensors';
import { cn } from '@/lib/utils';

const OverContext = React.createContext<string | null>(null);

interface HandleProps {
    onClick?: never;
    [key: string]: unknown;
}

export interface SortableItemBag {
    handleProps: HandleProps;
    isDragging: boolean;
}

interface SortableItemProps {
    id: string;
    disabled?: boolean;
    className?: string;
    children: (bag: SortableItemBag) => React.ReactNode;
}

// Wrapper div carries the sortable transform so wrapped content needs no changes.
// A dragging item dims itself; chevron-driven moves use the separate `moving` prop.
export function SortableItem({ id, disabled, className, children }: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
        disabled,
    });
    const overId = React.useContext(OverContext);

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn('relative', isDragging && 'opacity-40 z-20', className)}
        >
            {overId === id && !isDragging && (
                <span
                    aria-hidden="true"
                    className="absolute -top-1 left-4 right-4 h-0.5 rounded-full bg-primary z-10"
                />
            )}
            {children({ handleProps: { ...attributes, ...listeners } as HandleProps, isDragging })}
        </div>
    );
}

export function DragHandle({ handleProps, label }: { handleProps: HandleProps; label: string }) {
    return (
        <button
            type="button"
            {...handleProps}
            title="Drag to reorder"
            aria-label={label}
            className="p-1.5 rounded-xl text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 cursor-grab active:cursor-grabbing touch-none select-none transition-colors shrink-0"
        >
            <GripVertical className="w-4 h-4" />
        </button>
    );
}

interface SortableListProps {
    ids: string[];
    disabled?: boolean;
    overlayTitle: (id: string) => React.ReactNode;
    onReorder: (orderedIds: string[]) => void;
    children: React.ReactNode;
}

// One DndContext per sibling set. Cross-set drops are structurally impossible:
// `over` is null outside the active context, and membership is re-verified.
export function SortableList({ ids, disabled, overlayTitle, onReorder, children }: SortableListProps) {
    const sensors = useDndSensors();
    const reducedMotion = usePrefersReducedMotion();
    const [activeId, setActiveId] = React.useState<string | null>(null);
    const [overId, setOverId] = React.useState<string | null>(null);
    const idSet = React.useMemo(() => new Set(ids), [ids]);

    const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

    const handleDragEnd = (e: DragEndEvent) => {
        const over = e.over ? String(e.over.id) : null;
        const active = String(e.active.id);
        setActiveId(null);
        setOverId(null);
        if (disabled || !over || over === active) return;
        if (!idSet.has(active) || !idSet.has(over)) return;
        const from = ids.indexOf(active);
        const to = ids.indexOf(over);
        if (from === -1 || to === -1) return;
        const next = [...ids];
        next.splice(to, 0, ...next.splice(from, 1));
        onReorder(next);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={(e) => setOverId(e.over ? String(e.over.id) : null)}
            onDragEnd={handleDragEnd}
            onDragCancel={() => {
                setActiveId(null);
                setOverId(null);
            }}
        >
            <SortableContext items={ids} strategy={verticalListSortingStrategy} disabled={disabled}>
                <OverContext.Provider value={overId}>{children}</OverContext.Provider>
            </SortableContext>
            <DragOverlay dropAnimation={reducedMotion ? null : defaultDropAnimation}>
                {activeId ? (
                    <div aria-hidden="true" className="glass-panel rounded-2xl border border-primary/40 px-4 py-3 shadow-2xl text-sm font-semibold text-foreground opacity-95">
                        {overlayTitle(activeId)}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
