import { Search, Plus, BookOpen, Sparkles, FolderPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCategories, useCategoryTopics } from '@/hooks/useCurriculum';
import { useSettings } from '@/hooks/useSettings';
import { GOAL_LABELS } from '@/lib/constants';
import { CategoryTabList } from '@/components/curriculum/CategoryTabList';
import { TopicTreeCard } from '@/components/curriculum/TopicTreeCard';
import { TopicFormModal } from '@/components/curriculum/TopicFormModal';
import { CategoryFormModal } from '@/components/curriculum/CategoryFormModal';
import { useAppStore } from '@/stores/app/app.store';

export default function CurriculumPage() {
    const { data: rawCategories, isLoading: isLoadingCategories } = useCategories();
    const categories = Array.isArray(rawCategories) ? rawCategories : [];
    const { data: settings } = useSettings();

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
    const closeTopicModal = useAppStore((s) => s.closeTopicModal);

    // ── UI slice – Category modal ──────────────────────────────────────────
    const isCategoryModalOpen = useAppStore((s) => s.isCategoryModalOpen);
    const openCategoryModal = useAppStore((s) => s.openCategoryModal);
    const closeCategoryModal = useAppStore((s) => s.closeCategoryModal);

    // Default to first category if none selected
    const activeCategory =
        categories.find((c) => c.id === selectedCategoryId) || categories[0] || null;
    const activeCategoryId = activeCategory?.id || null;

    const { data: rawTopics, isLoading: isLoadingTopics } = useCategoryTopics(activeCategoryId);
    const topics = Array.isArray(rawTopics) ? rawTopics : [];

    // Filter topics by title
    const filteredTopics = topics.filter((t) =>
        t.title.toLowerCase().includes(curriculumSearch.toLowerCase()),
    );

    const handleOpenCreateTopic = () => {
        openTopicModal({ categoryId: activeCategoryId ?? undefined });
    };

    const handleOpenAddSubtopic = (parent: import('@/lib/types').Topic) => {
        openTopicModal({ parentTopic: parent });
    };

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

                    <Button onClick={handleOpenCreateTopic} className="gap-2 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4" />
                        <span>Add Topic</span>
                    </Button>
                </div>
            </div>

            {/* Domain Tabs Bar */}
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
                    onSelectCategory={(id) => setSelectedCategoryId(id)}
                    onAddCategory={openCategoryModal}
                />
            )}

            {/* Controls Bar: Search & Counts */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search topics in this category..."
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
                    Showing <span className="text-foreground font-bold">{filteredTopics.length}</span> topics
                </div>
            </div>

            {/* Topic List */}
            {isLoadingTopics ? (
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
                            : 'This domain has no topics yet. Click "Add Topic" to build your curriculum.'}
                    </p>
                    <Button size="sm" onClick={handleOpenCreateTopic} className="mt-2 gap-1.5">
                        <Plus className="w-4 h-4" />
                        Create First Topic
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filteredTopics.map((topic) => (
                        <TopicTreeCard
                            key={topic.id}
                            topic={topic}
                            categoryColor={activeCategory?.color || '#6366f1'}
                            onAddSubtopic={handleOpenAddSubtopic}
                        />
                    ))}
                </div>
            )}

            {/* Create Topic / Subtopic Modal */}
            <TopicFormModal
                isOpen={isTopicModalOpen}
                onClose={closeTopicModal}
                categories={categories}
                defaultCategoryId={topicModalCategoryId ?? activeCategoryId}
                parentTopic={topicModalParent}
            />

            {/* Create Category / Domain Modal */}
            <CategoryFormModal
                isOpen={isCategoryModalOpen}
                onClose={closeCategoryModal}
            />
        </div>
    );
}
