'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCustomer, useDeleteCustomer, useUpdateCustomer } from '@/features/customers/hooks/useCustomers';
import { CustomerView } from '@/features/customers/components/CustomerView';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function CustomerViewPage() {
    return (
        <ProtectedRoute requiredPermission={['customer:read']}>
            <CustomerViewPageContent />
        </ProtectedRoute>
    );
}

function CustomerViewPageContent() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const customerId = params?.id;

    const { data: customer, isLoading, isError, error } = useCustomer(customerId);
    const deleteCustomer = useDeleteCustomer();
    const updateCustomer = useUpdateCustomer();

    const handleBack = () => router.push('/customers');
    const handleEdit = () => router.push(`/customers/${customerId}/edit`);

    const handleDelete = () => {
        if (!customerId) return;
        deleteCustomer.mutate(customerId, {
            onSuccess: () => router.push('/customers'),
        });
    };

    const handleStatusChange = (isActive: boolean) => {
        if (!customerId) return;
        updateCustomer.mutate({ id: customerId, input: { isActive } });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24 text-sm text-gray-400">
                Loading customer…
            </div>
        );
    }

    if (isError || !customer) {
        return (
            <div className="p-6 rounded-2xl border border-red-100 bg-red-50 text-red-600 text-sm dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400">
                Failed to load customer{error instanceof Error ? `: ${error.message}` : '.'}
            </div>
        );
    }

    return (
        <CustomerView
            customer={customer}
            onBack={handleBack}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            isDeleting={deleteCustomer.isPending}
        />
    );
}