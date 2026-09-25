'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ReturnsDesk } from '@/features/returns/components/ReturnsDesk';

export default function Page() {
    return (
        <ProtectedRoute requiredPermission={['order:read']}>
            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Returns</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Review return requests, confirm parts are back, and record refunds. Customers are emailed at every step.</p>
                </div>
                <ReturnsDesk />
            </div>
        </ProtectedRoute>
    );
}
