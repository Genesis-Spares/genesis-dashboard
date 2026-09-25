import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            type = 'text',
            error,
            id,
            ...props
        },
        ref
    ) => {
        return (
            <div className="w-full">
                <input
                    ref={ref}
                    id={id}
                    type={type}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    className={cn(
                        'block w-full rounded-md border px-3 py-2.5',
                        'bg-white text-sm text-gray-900',
                        'placeholder:text-gray-400',
                        'outline-none transition-colors',
                        'focus:ring-2',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        error
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-gray-300 focus:border-primary focus:ring-primary/20',
                        'dark:border-gray-700 dark:bg-gray-900 dark:text-white',
                        'dark:placeholder:text-gray-500',
                        className
                    )}
                    {...props}
                />

                {error && (
                    <p
                        id={id ? `${id}-error` : undefined}
                        className="mt-1 text-sm text-red-600 dark:text-red-400"
                    >
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';