// src/components/common/LoadingSpinner.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: 'primary' | 'white' | 'gray' | 'success' | 'danger' | 'warning';
    className?: string;
    label?: string;
}

export const LoadingSpinner = ({
    size = 'md',
    color = 'primary',
    className,
    label = 'Loading...',
}: LoadingSpinnerProps) => {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4',
        xl: 'w-16 h-16 border-4',
    };

    const colorClasses = {
        primary: 'border-primary-500 border-t-transparent',
        white: 'border-white border-t-transparent',
        gray: 'border-gray-400 border-t-transparent',
        success: 'border-blue-500 border-t-transparent',
        danger: 'border-red-500 border-t-transparent',
        warning: 'border-yellow-500 border-t-transparent',
    };

    return (
        <div className="flex flex-col items-center justify-center gap-2">
            <div
                className={cn(
                    'animate-spin rounded-full',
                    sizeClasses[size],
                    colorClasses[color],
                    className
                )}
                role="status"
                aria-label={label}
            >
                <span className="sr-only">{label}</span>
            </div>
            {label && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {label}
                </span>
            )}
        </div>
    );
};