// src/app/(dashboard)/category/[id]/edit/page.tsx
'use client';

import { useParams } from 'next/navigation';
import CategoryForm from '@/features/categories/components/CategoryForm';

export default function EditCategoryPage() {
    const params = useParams();
    const id = params?.id as string;

    return <CategoryForm categoryId={id} mode="edit" />;
}