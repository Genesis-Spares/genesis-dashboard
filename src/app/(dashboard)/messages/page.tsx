'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MessagesPanel } from '@/features/messages/components/MessagesPanel';

export default function Page() {
    return (
        <ProtectedRoute requiredPermission={['message:read']}>
            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Messages</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Customer enquiries and support requests.</p>
                </div>
                <MessagesPanel />
            </div>
        </ProtectedRoute>
    );
}
