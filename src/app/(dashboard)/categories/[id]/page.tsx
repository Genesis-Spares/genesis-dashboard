// src/app/(dashboard)/category/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import ViewCategory from '@/features/categories/components/ViewCategory';

export default function ViewCategoryPage() {
    const params = useParams();
    const id = params?.id as string;

    return <ViewCategory categoryId={id} />;
}