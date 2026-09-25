'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ReportsPage } from '@/features/reports/components/ReportsPage';

export default function Page() {
    return (
        <ProtectedRoute requiredPermission={['analytics:read']}>
            <ReportsPage />
        </ProtectedRoute>
    );
}
