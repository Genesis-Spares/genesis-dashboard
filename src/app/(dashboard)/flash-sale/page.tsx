'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import FlashSaleManager from '@/features/flash-sale/components/FlashSaleManager';

export default function FlashSalePage() {
    return (
        <ProtectedRoute requiredPermission={['catalog:manage']}>
            <FlashSaleManager />
        </ProtectedRoute>
    );
}
