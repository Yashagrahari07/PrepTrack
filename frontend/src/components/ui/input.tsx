import * as React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, ...props }, ref) => {
        return (
            <input
                type={type}
                ref={ref}
                className={cn(
                    'flex h-11 w-full rounded-xl border bg-input/30 px-4 py-2',
                    'text-sm text-foreground placeholder:text-muted-foreground',
                    'transition-all duration-200',
                    'border-border focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    error && 'border-destructive focus-visible:ring-destructive/30',
                    className,
                )}
                {...props}
            />
        );
    },
);
Input.displayName = 'Input';

export { Input };
export type { InputProps };
