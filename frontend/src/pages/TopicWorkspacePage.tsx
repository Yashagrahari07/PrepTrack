import { useParams } from 'react-router-dom';
import { useCategories, useTopic } from '@/hooks/useCurriculum';
import { TopicHeader } from '@/components/workspace/TopicHeader';
import { ResourceList } from '@/components/workspace/ResourceList';
import { MarkdownNoteEditor } from '@/components/workspace/MarkdownNoteEditor';
import { StudyLogTimeline } from '@/components/workspace/StudyLogTimeline';
import { TopicFormModal } from '@/components/curriculum/TopicFormModal';
import { useAppStore } from '@/stores/app/app.store';

export default function TopicWorkspacePage() {
    const { id } = useParams<{ id: string }>();
    const { data: topic, isLoading } = useTopic(id || null);
    const { data: rawCategories } = useCategories();
    const categories = Array.isArray(rawCategories) ? rawCategories : [];
    const isTopicModalOpen = useAppStore((s) => s.isTopicModalOpen);
    const closeTopicModal = useAppStore((s) => s.closeTopicModal);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 animate-pulse">
                <div className="h-32 rounded-3xl bg-card border border-border" />
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="h-64 rounded-3xl bg-card border border-border" />
                    <div className="h-64 rounded-3xl bg-card border border-border" />
                </div>
            </div>
        );
    }

    if (!topic) {
        return (
            <div className="glass-panel rounded-3xl p-12 text-center text-muted-foreground border border-border">
                <p>Topic not found or unauthorized.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header with Title, Status & Confidence */}
            <TopicHeader topic={topic} />

            {/* 2-Column Studio Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Column: Curated Resources + Study Log History */}
                <div className="flex flex-col gap-6">
                    <ResourceList topicId={topic.id} />
                    <StudyLogTimeline topicId={topic.id} />
                </div>

                {/* Right Column: Markdown Revision Notes Editor */}
                <div className="flex flex-col gap-6">
                    <MarkdownNoteEditor topicId={topic.id} initialNotes={topic.notes_md || ''} />
                </div>
            </div>

            {/* Edit Topic Modal (store-owned edit state) */}
            <TopicFormModal
                isOpen={isTopicModalOpen}
                onClose={closeTopicModal}
                categories={categories}
            />
        </div>
    );
}
