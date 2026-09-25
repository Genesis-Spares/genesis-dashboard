'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import DeliverySettingsManager from '@/features/delivery/components/DeliverySettingsManager';

export default function DeliverySettingsPage() {
    return (
        <ProtectedRoute requiredPermission={['settings:read']}>
            <DeliverySettingsManager />
        </ProtectedRoute>
    );
}
