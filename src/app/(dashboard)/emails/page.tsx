'use client';

import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { EmailsPanel } from '@/features/emails/components/EmailsPanel';

export default function Page() {
    return (
        <ProtectedRoute requiredPermission={['message:read']}>
            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Emails</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Write to your customers directly — one person or many, each with their own personalised copy.</p>
                </div>
                <Suspense>
                    <EmailsPanel />
                </Suspense>
            </div>
        </ProtectedRoute>
    );
}
