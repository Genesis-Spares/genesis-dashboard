'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UrgentOrdersPanel } from '@/features/orders/components/UrgentOrdersPanel';

export default function Page() {
    return (
        <ProtectedRoute requiredPermission={['order:read']}>
            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Urgent orders</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Stuck orders, payment issues and high-value orders to review.</p>
                </div>
                <UrgentOrdersPanel />
            </div>
        </ProtectedRoute>
    );
}
