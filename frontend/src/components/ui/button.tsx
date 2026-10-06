import * as React from 'react';
import { cn } from '@/lib/utils';

// ─── Button Variants ────────────────────────────────────────
type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    loadingText?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
    default:
        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98]',
    outline:
        'border border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]',
    ghost: 'text-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]',
    destructive:
        'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30 active:scale-[0.98]',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
    md: 'h-10 px-4 text-sm rounded-xl gap-2',
    lg: 'h-12 px-6 text-base rounded-xl gap-2',
    icon: 'h-9 w-9 rounded-xl',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'default',
            size = 'md',
            isLoading = false,
            loadingText,
            disabled,
            children,
            onClick,
            ...props
        },
        ref,
    ) => {
        const isDisabled = disabled || isLoading;

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            if (isDisabled) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            if (onClick) {
                onClick(e);
            }
        };

        return (
            <button
                ref={ref}
                aria-busy={isLoading}
                aria-disabled={isDisabled}
                className={cn(
                    'inline-flex items-center justify-center font-medium whitespace-nowrap transition-all duration-200 select-none cursor-pointer',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
                    variantClasses[variant],
                    sizeClasses[size],
                    className,
                )}
                disabled={isDisabled}
                onClick={handleClick}
                {...props}
            >
                {isLoading ? (
                    <>
                        <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 shrink-0"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                        </svg>
                        <span>{loadingText ?? children}</span>
                    </>
                ) : (
                    children
                )}
            </button>
        );
    },
);
Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
