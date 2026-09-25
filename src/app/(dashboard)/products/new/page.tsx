'use client';

import { useRouter } from 'next/navigation';
import { useCreateProduct } from '@/features/products/hooks/useProducts';
import { ProductForm } from '@/features/products/ components/ProductForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CreateProductPayload } from '@/types/product.types';

export default function NewProductPage() {
    return (
        <ProtectedRoute requiredPermission="catalog:manage">
            <NewProductPageContent />
        </ProtectedRoute>
    );
}

function NewProductPageContent() {
    const router = useRouter();
    const createProduct = useCreateProduct();

    const handleSubmit = (payload: CreateProductPayload) => {
        createProduct.mutate(payload, {
            onSuccess: (product) => {
                router.push(`/products/${product.id}`);
            },
        });
    };

    return (
        <ProductForm
            mode="create"
            onSubmit={handleSubmit}
            isSubmitting={createProduct.isPending}
            serverError={createProduct.isError ? (createProduct.error as Error)?.message : null}
        />
    );
}