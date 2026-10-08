import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useReorderTopics } from '@/hooks/useCurriculum';
import type { Topic } from '@/lib/types';
import { TopicTreeCard } from '@/components/curriculum/TopicTreeCard';
import { DragHandle, SortableItem, SortableList } from '@/components/ui/SortableList';

interface CategoryTopicGroupProps {
    listKey: readonly unknown[];
    categoryId: string;
    color?: string;
    header?: React.ReactNode;
    topics: Topic[];
    emptyNote?: React.ReactNode;
    onRequestDelete: (kind: 'topic' | 'subtopic', id: string, title: string) => void;
    onAddSubtopic: (parentTopic: Topic) => void;
}

// One reorder mutation per sibling-set scope (a category list or one All-view
// group). Owns the moving indicator and the single-in-flight guard.
export function CategoryTopicGroup({
    listKey,
    categoryId,
    color,
    header,
    topics,
    emptyNote,
    onRequestDelete,
    onAddSubtopic,
}: CategoryTopicGroupProps) {
    const qc = useQueryClient();
    const reorder = useReorderTopics();
    const [movingId, setMovingId] = React.useState<string | null>(null);
    const busy = reorder.isPending;

    const siblingIds = React.useCallback(
        (parentId: string | null): string[] => {
            const cached = qc.getQueryData<unknown>(listKey);
            let arr: Topic[] | undefined;
            if (Array.isArray(cached) && cached.length > 0 && 'topics' in (cached[0] as object)) {
                arr = (cached as { category_id: string; topics: Topic[] }[]).find(
                    (g) => g.category_id === categoryId,
                )?.topics;
            } else if (Array.isArray(cached)) {
                arr = cached as Topic[];
            }
            const list = arr ?? topics;
            if (!parentId) return list.map((t) => t.id);
            return list.find((t) => t.id === parentId)?.subtopics?.map((s) => s.id) ?? [];
        },
        [qc, listKey, categoryId, topics],
    );

    const fireReorder = (parentId: string | null, orderedIds: string[], moving?: string) => {
        if (reorder.isPending) return;
        if (moving) setMovingId(moving);
        reorder.mutate(
            { listKey, category_id: categoryId, parent_id: parentId, ordered_ids: orderedIds },
            { onSettled: () => setMovingId(null) },
        );
    };

    const move = (parentId: string | null, id: string, dir: -1 | 1) => {
        if (busy) return;
        const arr = siblingIds(parentId);
        const i = arr.indexOf(id);
        const j = i + dir;
        if (i === -1 || j < 0 || j >= arr.length) return;
        const next = [...arr];
        next.splice(j, 0, ...next.splice(i, 1));
        fireReorder(parentId, next, id);
    };

    const subIdsOf = (parentId: string): string[] => siblingIds(parentId);

    return (
        <div className="flex flex-col gap-3">
            {header}
            {topics.length === 0 ? (
                emptyNote ?? null
            ) : (
                <SortableList
                    ids={topics.map((t) => t.id)}
                    disabled={busy}
                    overlayTitle={(id) => topics.find((t) => t.id === id)?.title ?? 'Topic'}
                    onReorder={(ids) => fireReorder(null, ids)}
                >
                    {topics.map((t, i) => (
                        <SortableItem key={t.id} id={t.id} disabled={busy}>
                            {({ handleProps }) => (
                                <TopicTreeCard
                                    topic={t}
                                    categoryColor={color}
                                    onAddSubtopic={onAddSubtopic}
                                    onRequestDelete={onRequestDelete}
                                    dragHandle={
                                        <DragHandle
                                            handleProps={handleProps}
                                            label={`Drag topic ${t.title} to reorder`}
                                        />
                                    }
                                    isFirst={i === 0}
                                    isLast={i === topics.length - 1}
                                    onMoveUp={() => move(null, t.id, -1)}
                                    onMoveDown={() => move(null, t.id, 1)}
                                    moving={movingId === t.id}
                                    reorderBusy={busy}
                                    subOrder={{
                                        onReorder: (pid, ids) => fireReorder(pid, ids),
                                        movingId,
                                        busy,
                                        overlayTitle: (id) =>
                                            topics
                                                .flatMap((x) => x.subtopics ?? [])
                                                .find((s) => s.id === id)?.title ?? 'Subtopic',
                                        onMove: (sid, dir) => move(t.id, sid, dir),
                                        isFirst: (sid) => subIdsOf(t.id)[0] === sid,
                                        isLast: (sid) => {
                                            const arr = subIdsOf(t.id);
                                            return arr[arr.length - 1] === sid;
                                        },
                                    }}
                                />
                            )}
                        </SortableItem>
                    ))}
                </SortableList>
            )}
        </div>
    );
}
