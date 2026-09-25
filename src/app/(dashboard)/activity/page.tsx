'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ActivityLogPanel } from '@/features/activity/components/ActivityLogPanel';

export default function Page() {
    return (
        <ProtectedRoute requiredPermission={['user:read']}>
            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Activity log</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Recent order status changes across the store.</p>
                </div>
                <ActivityLogPanel limit={50} />
            </div>
        </ProtectedRoute>
    );
}
