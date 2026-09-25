'use client';

import { useParams, useRouter } from 'next/navigation';
import { useProduct, useDeleteProduct, useUpdateProduct } from '@/features/products/hooks/useProducts';
import { ProductView } from '@/features/products/ components/ProductView';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ProductViewPage() {
    return (
        <ProtectedRoute requiredPermission={['catalog:read', 'catalog:view']}>
            <ProductViewPageContent />
        </ProtectedRoute>
    );
}

function ProductViewPageContent() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const productId = params?.id;

    const { data: product, isLoading, isError, error } = useProduct(productId);
    console.log("Product: ", product)
    const deleteProduct = useDeleteProduct();
    const updateProduct = useUpdateProduct();

    const handleBack = () => router.push('/products');
    const handleEdit = () => router.push(`/products/${productId}/edit`);

    const handleDelete = () => {
        if (!productId) return;
        deleteProduct.mutate(productId, {
            onSuccess: () => router.push('/products'),
        });
    };

    const handleStatusChange = (isActive: boolean) => {
        if (!productId) return;
        updateProduct.mutate({ id: productId, input: { isActive } });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24 text-sm text-gray-400">
                Loading product…
            </div>
        );
    }

    if (isError || !product) {
        return (
            <div className="p-6 rounded-2xl border border-red-100 bg-red-50 text-red-600 text-sm dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400">
                Failed to load product{error instanceof Error ? `: ${error.message}` : '.'}
            </div>
        );
    }

    return (
        <ProductView
            product={product}
            onBack={handleBack}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            isDeleting={deleteProduct.isPending}
        />
    );
}