import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onClose: () => void;
    isPending?: boolean;
}

export function ConfirmModal({
    isOpen,
    title,
    description,
    confirmLabel = 'Delete',
    onConfirm,
    onClose,
    isPending = false,
}: ConfirmModalProps) {
    const cancelRef = useRef<HTMLButtonElement>(null);
    const triggerRef = useRef<HTMLElement | null>(null);

    // Autofocus Cancel on open; return focus to the trigger on close.
    useEffect(() => {
        if (isOpen) {
            triggerRef.current = document.activeElement as HTMLElement | null;
            cancelRef.current?.focus();
        } else if (triggerRef.current) {
            triggerRef.current.focus();
            triggerRef.current = null;
        }
    }, [isOpen]);

    // Handle Escape key (blocked while pending)
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isPending) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isPending, onClose]);

    if (!isOpen) return null;

    const handleBackdropClick = () => {
        if (!isPending) {
            onClose();
        }
    };

    const handleConfirm = () => {
        if (isPending) return;
        onConfirm();
    };

    const titleId = 'confirm-modal-title';
    const descriptionId = 'confirm-modal-description';

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
            onClick={handleBackdropClick}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                className="relative w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl animate-fade-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-destructive/15 flex items-center justify-center text-destructive">
                            <Trash2 className="w-5 h-5" />
                        </div>
                        <h2 id={titleId} className="text-base font-bold text-foreground">
                            {title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        aria-label="Close"
                        className="text-muted-foreground hover:text-foreground p-1 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p id={descriptionId} className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {description}
                </p>

                <div className="flex justify-end gap-2">
                    <Button ref={cancelRef} type="button" variant="outline" onClick={onClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleConfirm}
                        isLoading={isPending}
                        loadingText="Deleting..."
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
