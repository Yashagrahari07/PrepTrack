import React from 'react';
import { Search, Plus, BookOpen, Sparkles, FolderPlus, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useCategories, useCategoryTopics, useAllTopics, useDeleteTopic } from '@/hooks/useCurriculum';
import { useSettings } from '@/hooks/useSettings';
import { queryKeys } from '@/api/queryKeys';
import { GOAL_LABELS } from '@/lib/constants';
import { CategoryTabList } from '@/components/curriculum/CategoryTabList';
import { CategoryTopicGroup } from '@/components/curriculum/CategoryTopicGroup';
import { TopicFormModal } from '@/components/curriculum/TopicFormModal';
import { useAppStore } from '@/stores/app/app.store';
import type { PendingDelete } from '@/components/curriculum/TopicTreeCard';
import type { Topic } from '@/lib/types';

export default function CurriculumPage() {
    const qc = useQueryClient();
    const { data: rawCategories, isLoading: isLoadingCategories } = useCategories();
    const categories = Array.isArray(rawCategories) ? rawCategories : [];
    const { data: settings } = useSettings();
    const { mutate: deleteTopic, isPending: isDeleting } = useDeleteTopic();

    // Dynamic goal label for header copy (null when the user has not set a goal yet)
    const goalLabel =
        settings?.goal_type === 'custom'
            ? settings?.goal_custom_text?.trim() || 'Custom Goal'
            : settings?.goal_type
              ? GOAL_LABELS[settings.goal_type as keyof typeof GOAL_LABELS]
              : null;

    // ── Curriculum slice ───────────────────────────────────────────────────
    const selectedCategoryId = useAppStore((s) => s.selectedCategoryId);
    const setSelectedCategoryId = useAppStore((s) => s.setSelectedCategoryId);
    const curriculumSearch = useAppStore((s) => s.curriculumSearch);
    const setCurriculumSearch = useAppStore((s) => s.setCurriculumSearch);

    // ── UI slice – Topic modal ─────────────────────────────────────────────
    const isTopicModalOpen = useAppStore((s) => s.isTopicModalOpen);
    const topicModalParent = useAppStore((s) => s.topicModalParent);
    const topicModalCategoryId = useAppStore((s) => s.topicModalCategoryId);
    const openTopicModal = useAppStore((s) => s.openTopicModal);
    const openEditTopicModal = useAppStore((s) => s.openEditTopicModal);
    const closeTopicModal = useAppStore((s) => s.closeTopicModal);

    // ── UI slice – Category modal ──────────────────────────────────────────
    const openCategoryModal = useAppStore((s) => s.openCategoryModal);

    // The All tab is an explicit null choice; a fresh null still defaults to
    // the first category (previous behavior) until the user picks All.
    const touchedAll = React.useRef(false);
    React.useEffect(() => {
        if (categories.length > 0 && selectedCategoryId === null && !touchedAll.current) {
            setSelectedCategoryId(categories[0].id);
        }
    }, [categories, selectedCategoryId, setSelectedCategoryId]);

    const isAll = selectedCategoryId === null;
    const activeCategory = isAll
        ? null
        : categories.find((c) => c.id === selectedCategoryId) || categories[0] || null;
    const activeCategoryId = activeCategory?.id || null;

    const { data: rawTopics, isLoading: isLoadingTopics } = useCategoryTopics(isAll ? null : activeCategoryId);
    const topics = Array.isArray(rawTopics) ? rawTopics : [];

    const { data: rawGroups, isLoading: isLoadingGroups } = useAllTopics(isAll && categories.length > 0);
    const groups = Array.isArray(rawGroups) ? rawGroups : [];

    // ── Lifted delete confirmation (one modal for all topic/subtopic rows) ──
    const [pendingDelete, setPendingDelete] = React.useState<PendingDelete | null>(null);

    const handleRequestDelete = (kind: 'topic' | 'subtopic', id: string, title: string) => {
        setPendingDelete({ kind, id, title });
    };

    const handleConfirmDelete = () => {
        if (!pendingDelete || isDeleting) return;
        const target = pendingDelete;
        deleteTopic(target.id, {
            onSuccess: () => {
                setPendingDelete(null);
                qc.invalidateQueries({ queryKey: queryKeys.categories.tree() });
                if (activeCategoryId) {
                    qc.invalidateQueries({ queryKey: queryKeys.categories.byId(activeCategoryId) });
                }
            },
        });
    };

    const deleteDescription =
        pendingDelete?.kind === 'subtopic'
            ? `Delete subtopic "${pendingDelete?.title}"? This cannot be undone.`
            : `Delete topic "${pendingDelete?.title}"? Its subtopics, resources, and study logs will also be removed. This cannot be undone.`;

    // Filter topics by title
    const q = curriculumSearch.toLowerCase();
    const filteredTopics = topics.filter((t) => t.title.toLowerCase().includes(q));
    const filteredGroups = groups
        .map((g) => ({ ...g, topics: g.topics.filter((t) => t.title.toLowerCase().includes(q)) }))
        .filter((g) => g.topics.length > 0 || q === '');

    const handleOpenCreateTopic = () => {
        openTopicModal({ categoryId: activeCategoryId ?? undefined });
    };

    const handleOpenAddSubtopic = (parent: Topic) => {
        openTopicModal({ parentTopic: parent });
    };

    const listKey = isAll ? queryKeys.categories.tree() : queryKeys.categories.byId(activeCategoryId ?? '');

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-3xl p-6 border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 ambient-glow-indigo opacity-40 pointer-events-none" />
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        {goalLabel ?? 'Study Plan'}
                    </div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                        Curriculum Management
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
                        {goalLabel
                            ? `Organize your ${goalLabel} preparation across categories. Click any topic or \u201cStudio\u201d to attach resources (YouTube, blogs, docs) and write markdown notes.`
                            : `Organize your preparation across categories. Click any topic or \u201cStudio\u201d to attach resources (YouTube, blogs, docs) and write markdown notes.`}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                    <Button
                        variant="outline"
                        onClick={openCategoryModal}
                        className="gap-1.5 text-xs"
                    >
                        <FolderPlus className="w-4 h-4 text-primary" />
                        <span>Add Category</span>
                    </Button>

                    <Button
                        onClick={handleOpenCreateTopic}
                        disabled={isAll}
                        title={isAll ? 'Select a category to add topics' : undefined}
                        className="gap-2 shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Topic</span>
                    </Button>
                </div>
            </div>

            {/* Category Tabs Bar */}
            {isLoadingCategories ? (
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-9 w-28 rounded-xl bg-muted/40 animate-pulse" />
                    ))}
                </div>
            ) : (
                <CategoryTabList
                    categories={categories}
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={(id) => {
                        if (id === null) touchedAll.current = true;
                        setSelectedCategoryId(id);
                    }}
                    onAddCategory={openCategoryModal}
                />
            )}

            {/* Controls Bar: Search & Counts */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={isAll ? 'Search topics across all categories...' : 'Search topics in this category...'}
                        value={curriculumSearch}
                        onChange={(e) => setCurriculumSearch(e.target.value)}
                        className="pl-10 pr-9 h-10 text-xs sm:text-sm bg-card/60"
                    />
                    {curriculumSearch && (
                        <button
                            type="button"
                            onClick={() => setCurriculumSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md transition-colors"
                            title="Clear search"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <div className="text-xs text-muted-foreground font-medium">
                    {isAll ? (
                        <>
                            Showing <span className="text-foreground font-bold">{filteredGroups.reduce((n, g) => n + g.topics.length, 0)}</span> topics
                            in <span className="text-foreground font-bold">{filteredGroups.length}</span> categories
                        </>
                    ) : (
                        <>
                            Showing <span className="text-foreground font-bold">{filteredTopics.length}</span> topics
                        </>
                    )}
                </div>
            </div>

            {/* Topic List */}
            {isAll ? (
                isLoadingGroups ? (
                    <div className="flex flex-col gap-6">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex flex-col gap-3">
                                <div className="h-5 w-40 rounded-lg bg-muted/40 animate-pulse" />
                                <div className="h-24 rounded-2xl bg-card border border-border animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3 border border-border">
                        <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-foreground text-base">No topics found</h3>
                        <p className="text-xs text-muted-foreground max-w-sm">
                            {curriculumSearch
                                ? `No topics match "${curriculumSearch}" in any category.`
                                : 'No categories have topics yet. Select a category and click "Add Topic" to begin.'}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {filteredGroups.map((g) => (
                            <section key={g.category_id} aria-label={g.category_name}>
                                <div className="flex items-center gap-2 mb-3">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: g.color }}
                                    />
                                    <h2 className="text-sm font-bold text-foreground">{g.category_name}</h2>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                                        {g.topics.length}
                                    </span>
                                </div>
                                {g.topics.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic pl-5">
                                        No topics in this category yet.
                                    </p>
                                ) : (
                                    <CategoryTopicGroup
                                        listKey={listKey}
                                        categoryId={g.category_id}
                                        color={g.color}
                                        topics={g.topics}
                                        onRequestDelete={handleRequestDelete}
                                        onRequestEdit={openEditTopicModal}
                                        onAddSubtopic={handleOpenAddSubtopic}
                                    />
                                )}
                            </section>
                        ))}
                    </div>
                )
            ) : isLoadingTopics ? (
                <div className="flex flex-col gap-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 rounded-2xl bg-card border border-border animate-pulse" />
                    ))}
                </div>
            ) : filteredTopics.length === 0 ? (
                <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3 border border-border">
                    <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-foreground text-base">No topics found</h3>
                    <p className="text-xs text-muted-foreground max-w-sm">
                        {curriculumSearch
                            ? `No topics match "${curriculumSearch}" in this category.`
                            : 'This category has no topics yet. Click "Add Topic" to build your curriculum.'}
                    </p>
                    <Button size="sm" onClick={handleOpenCreateTopic} className="mt-2 gap-1.5">
                        <Plus className="w-4 h-4" />
                        Create First Topic
                    </Button>
                </div>
            ) : (
                <CategoryTopicGroup
                    listKey={listKey}
                    categoryId={activeCategoryId ?? ''}
                    color={activeCategory?.color}
                    topics={filteredTopics}
                    onRequestDelete={handleRequestDelete}
                    onRequestEdit={openEditTopicModal}
                    onAddSubtopic={handleOpenAddSubtopic}
                />
            )}

            {/* Delete confirmation */}
            <ConfirmModal
                isOpen={pendingDelete !== null}
                title={pendingDelete?.kind === 'subtopic' ? 'Delete subtopic?' : 'Delete topic?'}
                description={deleteDescription}
                onConfirm={handleConfirmDelete}
                onClose={() => {
                    if (!isDeleting) setPendingDelete(null);
                }}
                isPending={isDeleting}
            />

            {/* Create Topic / Subtopic Modal */}
            <TopicFormModal
                isOpen={isTopicModalOpen}
                onClose={closeTopicModal}
                categories={categories}
                defaultCategoryId={topicModalCategoryId ?? activeCategoryId}
                parentTopic={topicModalParent}
            />

        </div>
    );
}
