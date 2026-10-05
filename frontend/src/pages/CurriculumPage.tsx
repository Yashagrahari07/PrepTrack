import { useState } from 'react';
import { Search, Plus, BookOpen, Sparkles, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCategories, useCategoryTopics } from '@/hooks/useCurriculum';
import { CategoryTabList } from '@/components/curriculum/CategoryTabList';
import { TopicTreeCard } from '@/components/curriculum/TopicTreeCard';
import { TopicFormModal } from '@/components/curriculum/TopicFormModal';
import { CategoryFormModal } from '@/components/curriculum/CategoryFormModal';
import type { Topic } from '@/lib/types';

export default function CurriculumPage() {
    const { data: rawCategories, isLoading: isLoadingCategories } = useCategories();
    const categories = Array.isArray(rawCategories) ? rawCategories : [];

    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Topic Modal state
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [parentTopicForSubtopic, setParentTopicForSubtopic] = useState<Topic | null>(null);

    // Category Modal state
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    // Default to first category if none selected
    const activeCategory =
        categories.find((c) => c.id === selectedCategoryId) || categories[0] || null;
    const activeCategoryId = activeCategory?.id || null;

    const { data: rawTopics, isLoading: isLoadingTopics } = useCategoryTopics(activeCategoryId);
    const topics = Array.isArray(rawTopics) ? rawTopics : [];

    // Filter topics by title
    const filteredTopics = topics.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const handleOpenCreateTopic = () => {
        setParentTopicForSubtopic(null);
        setIsFormModalOpen(true);
    };

    const handleOpenAddSubtopic = (parent: Topic) => {
        setParentTopicForSubtopic(parent);
        setIsFormModalOpen(true);
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-3xl p-6 border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 ambient-glow-indigo opacity-40 pointer-events-none" />
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        SDE 1 Curriculum Control
                    </div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                        Curriculum Management
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
                        Organize your backend prep across domains. Click any topic or &ldquo;Studio&rdquo; to attach resources (YouTube, blogs, docs) and write markdown notes.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                    <Button
                        variant="outline"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="gap-1.5 text-xs"
                    >
                        <FolderPlus className="w-4 h-4 text-primary" />
                        <span>Add Domain</span>
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
                    onAddCategory={() => setIsCategoryModalOpen(true)}
                />
            )}

            {/* Controls Bar: Search & Counts */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search topics in this domain..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 text-xs sm:text-sm bg-card/60"
                    />
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
                        {searchQuery
                            ? `No topics match "${searchQuery}" in this category.`
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
                isOpen={isFormModalOpen}
                onClose={() => {
                    setIsFormModalOpen(false);
                    setParentTopicForSubtopic(null);
                }}
                categories={categories}
                defaultCategoryId={activeCategoryId}
                parentTopic={parentTopicForSubtopic}
            />

            {/* Create Category / Domain Modal */}
            <CategoryFormModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
            />
        </div>
    );
}
