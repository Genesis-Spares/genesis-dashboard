// src/features/dashboard/components/StatCard.tsx
import { ComponentType } from 'react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: ComponentType<{ className?: string }>;
    hint?: string;
}

export function StatCard({ label, value, icon: Icon, hint }: StatCardProps) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            {hint && <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">{hint}</p>}
        </div>
    );
}
