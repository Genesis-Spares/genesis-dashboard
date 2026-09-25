'use client';

import { useParams, useRouter } from 'next/navigation';
import { useOrder } from '@/features/orders/hooks/useOrders';
import { OrderView } from '@/features/orders/components/OrderView';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function OrderViewPage() {
    return (
        <ProtectedRoute requiredPermission={['order:read']}>
            <OrderViewPageContent />
        </ProtectedRoute>
    );
}

function OrderViewPageContent() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const orderId = params?.id;

    const { data: order, isLoading, isError, error } = useOrder(orderId);

    const handleBack = () => router.push('/orders');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24 text-sm text-gray-400">
                Loading order…
            </div>
        );
    }

    if (isError || !order) {
        return (
            <div className="p-6 rounded-2xl border border-red-100 bg-red-50 text-red-600 text-sm dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400">
                Failed to load order{error instanceof Error ? `: ${error.message}` : '.'}
            </div>
        );
    }

    return <OrderView order={order} onBack={handleBack} />;
}
