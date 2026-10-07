import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    checked?: boolean;
    onChange?: (checked: boolean) => void;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, checked, onChange, disabled, ...props }, ref) => {
        return (
            <label className={cn('relative inline-flex items-center cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}>
                <input
                    type="checkbox"
                    ref={ref}
                    checked={checked}
                    onChange={(e) => onChange?.(e.target.checked)}
                    disabled={disabled}
                    className={cn(
                        'peer h-5 w-9 appearance-none rounded-full bg-muted border border-border',
                        'transition-colors duration-200',
                        'checked:bg-primary checked:border-primary',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                    {...props}
                />
                <span className={cn(
                    'peer absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-lg',
                    'transition-transform duration-200',
                    'translate-x-0 peer-checked:translate-x-4'
                )} />
            </label>
        );
    }
);

Switch.displayName = 'Switch';

export { Switch };