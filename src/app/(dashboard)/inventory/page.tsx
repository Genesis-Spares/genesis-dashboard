'use client';

import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { InventoryPage } from '@/features/inventory/components/InventoryPage';

export default function Page() {
    return (
        <ProtectedRoute requiredPermission={['product:update']}>
            <Suspense fallback={null}>
                <InventoryPage />
            </Suspense>
        </ProtectedRoute>
    );
}
