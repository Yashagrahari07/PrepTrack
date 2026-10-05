import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateCategory } from '@/hooks/useCurriculum';

interface CategoryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const colorPresets = [
    { label: 'Indigo', hex: '#6366f1' },
    { label: 'Emerald', hex: '#10b981' },
    { label: 'Amber', hex: '#f59e0b' },
    { label: 'Rose', hex: '#ec4899' },
    { label: 'Violet', hex: '#8b5cf6' },
    { label: 'Sky', hex: '#06b6d4' },
    { label: 'Teal', hex: '#14b8a6' },
    { label: 'Orange', hex: '#f97316' },
];

export function CategoryFormModal({ isOpen, onClose }: CategoryFormModalProps) {
    const { mutate: createCategory, isPending } = useCreateCategory();
    const [name, setName] = useState('');
    const [color, setColor] = useState('#6366f1');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        createCategory(
            { name: name.trim(), color },
            {
                onSuccess: () => {
                    setName('');
                    onClose();
                },
            },
        );
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl animate-fade-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            <FolderPlus className="w-5 h-5" />
                        </div>
                        <h2 className="text-base font-bold text-foreground">Create Curriculum Domain</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cat-name">Domain / Category Name</Label>
                        <Input
                            id="cat-name"
                            placeholder="e.g. Distributed Systems & Cloud"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label>Accent Color</Label>
                        <div className="grid grid-cols-4 gap-2 my-1">
                            {colorPresets.map((preset) => (
                                <button
                                    key={preset.hex}
                                    type="button"
                                    onClick={() => setColor(preset.hex)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-all ${
                                        color === preset.hex
                                            ? 'bg-card border-primary ring-2 ring-primary/30 font-semibold'
                                            : 'bg-muted/20 border-border text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <span
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: preset.hex }}
                                    />
                                    <span className="truncate">{preset.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button type="submit" size="lg" isLoading={isPending} className="mt-2">
                        Create Domain
                    </Button>
                </form>
            </div>
        </div>,
        document.body,
    );
}
