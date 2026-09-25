import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            children,
            isLoading = false,
            loadingText,
            disabled,
            type = 'button',
            ...props
        },
        ref
    ) => {
        return (
            <button
                ref={ref}
                type={type}
                disabled={disabled || isLoading}
                className={cn(
                    'inline-flex w-full items-center justify-center gap-2 rounded-md',
                    'bg-primary px-4 py-2.5 text-sm font-semibold text-white',
                    'transition-colors duration-200',
                    'hover:bg-primary/90',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <>
                        <span
                            className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                            aria-hidden="true"
                        />

                        <span>
                            {loadingText ?? 'Loading...'}
                        </span>
                    </>
                ) : (
                    children
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';