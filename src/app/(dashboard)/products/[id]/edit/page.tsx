'use client';

import { useParams, useRouter } from 'next/navigation';
import { useProduct, useUpdateProduct } from '@/features/products/hooks/useProducts';
import { ProductForm } from '@/features/products/ components/ProductForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CreateProductPayload } from '@/types/product.types';

export default function EditProductPage() {
    return (
        <ProtectedRoute requiredPermission="catalog:manage">
            <EditProductPageContent />
        </ProtectedRoute>
    );
}

function EditProductPageContent() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const productId = params?.id;

    const { data: product, isLoading, isError, error } = useProduct(productId);
    const updateProduct = useUpdateProduct();

    const handleSubmit = (payload: CreateProductPayload) => {
        if (!productId) return;
        updateProduct.mutate(
            { id: productId, input: payload },
            {
                onSuccess: () => {
                    router.push(`/products/${productId}`);
                },
            }
        );
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
        <ProductForm
            mode="edit"
            initialData={product}
            onSubmit={handleSubmit}
            isSubmitting={updateProduct.isPending}
            serverError={updateProduct.isError ? (updateProduct.error as Error)?.message : null}
        />
    );
}