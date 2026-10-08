import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
    ExternalLink,
    Plus,
    Pencil,
    Trash2,
    Video,
    FileText,
    BookOpen,
    Link2,
    CheckCircle2,
    Clock,
    Circle,
    X,
    ChevronUp,
    ChevronDown,
    Loader2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { DragHandle, SortableItem, SortableList } from '@/components/ui/SortableList';
import { queryKeys } from '@/api/queryKeys';
import {
    useTopicResources,
    useCreateResource,
    useUpdateResource,
    useDeleteResource,
    useReorderResources,
    useYoutubeMetadata,
} from '@/hooks/useResources';
import type { Resource, ResourceType, ResourceStatus } from '@/lib/types';
import { cn, formatMinutes } from '@/lib/utils';
import { hasPlaylistParam, isYouTubeUrl } from '@/lib/youtube';

interface ResourceListProps {
    topicId: string;
}

const typeIcons: Record<ResourceType, React.ReactNode> = {
    YOUTUBE_VIDEO: <Video className="w-4 h-4 text-red-500" />,
    YOUTUBE_PLAYLIST: <Video className="w-4 h-4 text-red-400" />,
    DEV_BLOG: <FileText className="w-4 h-4 text-emerald-400" />,
    OFFICIAL_DOCS: <BookOpen className="w-4 h-4 text-sky-400" />,
    OTHER: <Link2 className="w-4 h-4 text-indigo-400" />,
};

const statusStyles: Record<ResourceStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    TODO: {
        label: 'To Do',
        bg: 'bg-muted/50 border-muted-foreground/20',
        text: 'text-muted-foreground',
        icon: <Circle className="w-3 h-3" />,
    },
    DOING: {
        label: 'Doing',
        bg: 'bg-amber-500/10 border-amber-500/30',
        text: 'text-amber-400',
        icon: <Clock className="w-3 h-3" />,
    },
    DONE: {
        label: 'Done',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        text: 'text-emerald-400',
        icon: <CheckCircle2 className="w-3 h-3" />,
    },
};

export function ResourceList({ topicId }: ResourceListProps) {
    const qc = useQueryClient();
    const { data: rawResources = [], isLoading } = useTopicResources(topicId);
    const resources = Array.isArray(rawResources) ? rawResources : [];

    const { mutate: createResource, isPending: isCreating } = useCreateResource(topicId);
    const { mutate: updateResource, isPending: isUpdating } = useUpdateResource(topicId);
    const { mutate: deleteResource, isPending: isDeleting } = useDeleteResource(topicId);
    const isPending = isCreating || isUpdating;
    const reorder = useReorderResources(topicId);
    const [movingId, setMovingId] = useState<string | null>(null);
    const [deletingRes, setDeletingRes] = useState<Resource | null>(null);
    const reorderBusy = reorder.isPending;

    const siblingIds = (): string[] => {
        const cached = qc.getQueryData<Resource[]>(queryKeys.topics.resources(topicId));
        return (cached ?? resources).map((r) => r.id);
    };

    const fireReorder = (orderedIds: string[], moving?: string) => {
        if (reorder.isPending) return;
        if (moving) setMovingId(moving);
        reorder.mutate(orderedIds, { onSettled: () => setMovingId(null) });
    };

    const move = (id: string, dir: -1 | 1) => {
        if (reorderBusy) return;
        const arr = siblingIds();
        const i = arr.indexOf(id);
        const j = i + dir;
        if (i === -1 || j < 0 || j >= arr.length) return;
        const next = [...arr];
        next.splice(j, 0, ...next.splice(i, 1));
        fireReorder(next, id);
    };

    const handleConfirmDelete = () => {
        if (!deletingRes || isDeleting) return;
        const target = deletingRes;
        deleteResource(target.id, {
            onSuccess: () => setDeletingRes(null),
        });
    };

    // Form Modal state (dual create/edit mode)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [type, setType] = useState<ResourceType>('DEV_BLOG');
    const [estHours, setEstHours] = useState(0);
    const [estMinutes, setEstMinutes] = useState(30);
    const isEdit = editingResource !== null;

    const resetPrefetchRefs = () => {
        lastAutoTitleRef.current = null;
        titleTouchedRef.current = false;
        initialUrlRef.current = '';
    };

    const openCreateModal = () => {
        setEditingResource(null);
        setTitle('');
        setUrl('');
        setType('DEV_BLOG');
        setEstHours(0);
        setEstMinutes(30);
        resetPrefetchRefs();
        setIsAddModalOpen(true);
    };

    const openEditModal = (res: Resource) => {
        setEditingResource(res);
        setTitle(res.title);
        setUrl(res.url);
        setType(res.type);
        setEstHours(Math.floor(res.est_minutes / 60));
        setEstMinutes(Math.round((res.est_minutes % 60) * 10) / 10);
        resetPrefetchRefs();
        initialUrlRef.current = res.url;
        setIsAddModalOpen(true);
    };

    const closeModal = () => {
        if (isPending) return;
        setIsAddModalOpen(false);
        setEditingResource(null);
        resetPrefetchRefs();
        setDebouncedUrl(null);
    };

    const totalEstMinutes = () => {
        const h = Number.isFinite(estHours) ? Math.max(0, Math.floor(estHours)) : 0;
        const m = Number.isFinite(estMinutes) ? Math.max(0, estMinutes) : 0;
        const total = Math.round((h * 60 + m) * 10) / 10;
        return total > 0 ? total : 30;
    };

    // ── YouTube title prefetch (titles only; user text is never overwritten) ──
    // Each pasted URL gets its own query cache key, so a slow earlier fetch can
    // never clobber a later paste: responses land in different cache entries and
    // only the subscribed (latest) one is ever applied below.
    const lastAutoTitleRef = useRef<string | null>(null);
    const titleTouchedRef = useRef(false);
    const initialUrlRef = useRef('');
    const [debouncedUrl, setDebouncedUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!isAddModalOpen) {
            setDebouncedUrl(null);
            return;
        }
        if (type !== 'YOUTUBE_VIDEO' && type !== 'YOUTUBE_PLAYLIST') {
            setDebouncedUrl(null);
            return;
        }
        if (!isYouTubeUrl(url) || url.trim() === initialUrlRef.current) {
            setDebouncedUrl(null);
            return;
        }
        const timer = setTimeout(() => setDebouncedUrl(url.trim()), 600);
        return () => clearTimeout(timer);
    }, [url, type, isAddModalOpen]);

    const prefetch = useYoutubeMetadata(debouncedUrl, isAddModalOpen && debouncedUrl !== null);

    useEffect(() => {
        if (!prefetch.data || !debouncedUrl) return;
        const fetched = prefetch.data.title.trim();
        if (!fetched || titleTouchedRef.current) return;
        if (title.trim() && title !== lastAutoTitleRef.current) return;
        setTitle(fetched);
        lastAutoTitleRef.current = fetched;
        toast.success(
            prefetch.data.kind === 'playlist' ? 'Playlist title fetched' : 'Video details fetched',
            { id: 'yt-prefetch' },
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prefetch.data, debouncedUrl]);

    const showTypeHint = type === 'YOUTUBE_VIDEO' && hasPlaylistParam(url);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isAddModalOpen && !isPending) {
                closeModal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAddModalOpen, isPending]);

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !url.trim() || isPending) return;

        if (isEdit && editingResource) {
            updateResource(
                {
                    id: editingResource.id,
                    data: { type, title: title.trim(), url: url.trim(), est_minutes: totalEstMinutes() },
                },
                {
                    onSuccess: () => {
                        closeModal();
                        setEditingResource(null);
                    },
                },
            );
            return;
        }

        createResource(
            { type, title: title.trim(), url: url.trim(), est_minutes: totalEstMinutes() },
            {
                onSuccess: () => {
                    setTitle('');
                    setUrl('');
                    closeModal();
                },
            },
        );
    };

    return (
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
                        <span>Curated Resources</span>
                        <span className="text-xs font-normal text-muted-foreground">
                            ({resources.length}/3 max)
                        </span>
                    </h3>
                </div>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={openCreateModal}
                    disabled={resources.length >= 3}
                    className="gap-1 text-xs"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Attach Resource</span>
                </Button>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="flex flex-col gap-2">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-16 rounded-xl bg-card border border-border animate-pulse" />
                    ))}
                </div>
            ) : resources.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                    <p>No resources attached yet. Attach up to 3 videos, docs, or blogs.</p>
                </div>
            ) : (
                <SortableList
                    ids={resources.map((r) => r.id)}
                    disabled={reorderBusy}
                    overlayTitle={(id) => resources.find((r) => r.id === id)?.title ?? 'Resource'}
                    onReorder={(ids) => fireReorder(ids)}
                >
                    <div className="flex flex-col gap-2.5">
                    {resources.map((res: Resource, index: number) => {
                        const statusConfig = statusStyles[res.status] || statusStyles.TODO;
                        return (
                            <SortableItem key={res.id} id={res.id} disabled={reorderBusy}>
                                {({ handleProps, isDragging }) => (
                            <div
                                className={cn(
                                    'flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border gap-3 flex-wrap transition-colors hover:border-border/80',
                                    (movingId === res.id || isDragging) && 'opacity-60 motion-safe:animate-pulse',
                                )}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <DragHandle
                                        handleProps={handleProps}
                                        label={`Drag resource ${res.title} to reorder`}
                                    />
                                    <div className="w-8 h-8 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                                        {typeIcons[res.type] || <Link2 className="w-4 h-4 text-muted-foreground" />}
                                    </div>

                                    <div className="flex flex-col min-w-0">
                                        <a
                                            href={res.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-medium text-xs sm:text-sm text-foreground hover:text-primary transition-colors truncate flex items-center gap-1.5"
                                        >
                                            <span className="truncate">{res.title}</span>
                                            <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                                        </a>
                                        <span className="text-[10px] text-muted-foreground">
                                            Est. {formatMinutes(res.est_minutes)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                                    {/* Reorder chevrons */}
                                    <span className="flex items-center shrink-0" role="group" aria-label={`Reorder ${res.title}`}>
                                        <button
                                            type="button"
                                            onClick={() => move(res.id, -1)}
                                            disabled={reorderBusy || index === 0}
                                            title="Move up"
                                            aria-label={`Move ${res.title} up`}
                                            className="p-1 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                                        >
                                            <ChevronUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => move(res.id, 1)}
                                            disabled={reorderBusy || index === resources.length - 1}
                                            title="Move down"
                                            aria-label={`Move ${res.title} down`}
                                            className="p-1 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                                        >
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        </button>
                                    </span>

                                    {/* Status selector */}
                                    <select
                                        value={res.status}
                                        onChange={(e) =>
                                            updateResource({
                                                id: res.id,
                                                data: { status: e.target.value as ResourceStatus },
                                            })
                                        }
                                        className={cn(
                                            'px-2 py-1 rounded-xl text-[11px] font-semibold border cursor-pointer focus:outline-none transition-all',
                                            statusConfig.bg,
                                            statusConfig.text,
                                        )}
                                    >
                                        <option value="TODO">To Do</option>
                                        <option value="DOING">Doing</option>
                                        <option value="DONE">Done</option>
                                    </select>

                                    {/* Edit */}
                                    <button
                                        onClick={() => openEditModal(res)}
                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                        title="Edit resource"
                                        aria-label={`Edit resource ${res.title}`}
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Delete */}
                                    <button
                                        onClick={() => setDeletingRes(res)}
                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        title="Remove resource"
                                        aria-label={`Remove resource ${res.title}`}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                                )}
                            </SortableItem>
                        );
                    })}
                    </div>
                </SortableList>
            )}

            {/* Delete confirmation */}
            <ConfirmModal
                isOpen={deletingRes !== null}
                title="Remove resource?"
                description={
                    deletingRes
                        ? `Remove "${deletingRes.title}" from this topic? This cannot be undone.`
                        : ''
                }
                confirmLabel="Delete"
                onConfirm={handleConfirmDelete}
                onClose={() => {
                    if (!isDeleting) setDeletingRes(null);
                }}
                isPending={isDeleting}
            />

            {/* Modal to attach resource */}
            {isAddModalOpen &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
                        onClick={() => closeModal()}
                    >
                        <div
                            className="relative w-full max-w-md bg-card border border-border shadow-2xl rounded-3xl p-6 animate-fade-up"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-foreground">
                                    {isEdit ? 'Edit Resource' : 'Attach Curated Resource'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => closeModal()}
                                    disabled={isPending}
                                    aria-label="Close"
                                    className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="res-type">Resource Type</Label>
                                    <select
                                        id="res-type"
                                        value={type}
                                        onChange={(e) => setType(e.target.value as ResourceType)}
                                        disabled={isPending}
                                        className="h-10 rounded-xl border border-border bg-input/30 px-3 text-xs text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="YOUTUBE_VIDEO">YouTube Video</option>
                                        <option value="YOUTUBE_PLAYLIST">YouTube Playlist</option>
                                        <option value="DEV_BLOG">Dev Blog</option>
                                        <option value="OFFICIAL_DOCS">Official Docs</option>
                                        <option value="OTHER">Other Link</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="res-title">Title</Label>
                                    <Input
                                        id="res-title"
                                        placeholder="e.g. Postgres Indexing Deep Dive"
                                        value={title}
                                        onChange={(e) => {
                                            titleTouchedRef.current = true;
                                            setTitle(e.target.value);
                                        }}
                                        disabled={isPending}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="res-url">URL</Label>
                                    <Input
                                        id="res-url"
                                        type="url"
                                        placeholder="https://..."
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        disabled={isPending}
                                        required
                                    />
                                    <div className="min-h-[20px]" aria-live="polite">
                                        {prefetch.isFetching && (
                                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Fetching details…
                                            </p>
                                        )}
                                        {!prefetch.isFetching && prefetch.isError && debouncedUrl && (
                                            <p className="text-xs text-muted-foreground">
                                                Could not fetch details. Enter manually.
                                            </p>
                                        )}
                                        {!prefetch.isFetching && showTypeHint && (
                                            <button
                                                type="button"
                                                onClick={() => setType('YOUTUBE_PLAYLIST')}
                                                className="text-xs font-medium text-primary hover:underline"
                                            >
                                                Looks like a playlist. Switch type?
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="res-hours">Hours</Label>
                                        <Input
                                            id="res-hours"
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={estHours}
                                            onChange={(e) => setEstHours(Number(e.target.value))}
                                            disabled={isPending}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="res-minutes">Minutes</Label>
                                        <Input
                                            id="res-minutes"
                                            type="number"
                                            min={0}
                                            max={59.9}
                                            step={0.5}
                                            inputMode="decimal"
                                            value={estMinutes}
                                            onChange={(e) => setEstMinutes(Number(e.target.value))}
                                            disabled={isPending}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-2">
                                    <Button
                                        type="button"
                                        variant={isEdit ? 'outline' : 'ghost'}
                                        disabled={isPending}
                                        onClick={() => closeModal()}
                                    >
                                        Cancel
                                    </Button>
                                    {isEdit ? (
                                        <Button type="submit" isLoading={isPending} loadingText="Updating...">
                                            Update
                                        </Button>
                                    ) : (
                                        <Button type="submit" isLoading={isPending} loadingText="Attaching...">
                                            Attach
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}

