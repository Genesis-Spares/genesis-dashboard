// src/types/category.types.ts

export interface CategorySeo {
    title: string;
    keywords: string[];
    description: string;
}

export interface CategoryDisplay {
    showOnHomepage: boolean;
    showInNavigation: boolean;
    showProductCount: boolean;
}

export interface CategoryMetadata {
    seo: CategorySeo;
    display: CategoryDisplay;
    filters: string[];
    featured: boolean;
    department: string;
    categoryType: string;
    displayOrder: number;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    imageUrl: string;
    isActive: boolean;
    parentId: string | null;
    parent?: Omit<Category, 'parent' | 'children'> | null;
    children: Category[];
    productsCount: number;
    createdAt: string;
    updatedAt: string;
    metadata: CategoryMetadata | null;
}

export interface CategoryListMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CategoryListResponse {
    data: Category[];
    meta: CategoryListMeta;
}

export interface CategoryListParams {
    page?: number;
    limit?: number;
    search?: string;
    parentId?: string | null;
    isActive?: boolean;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    ids?: string[];
}

export interface CreateCategoryPayload {
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
    imageUrl?: string;
    parentId?: string;
    isActive?: boolean;
    metadata?: Record<string, unknown>;
}

export type UpdateCategoryInput = Partial<CreateCategoryPayload>;

export interface DeleteCategoriesResponse {
    deleted: number;
    ids: string[];
}