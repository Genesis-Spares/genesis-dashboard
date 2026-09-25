import { Category } from './category.types';

export interface ProductImage {
    id: string;
    url: string;
    alt?: string;
    isPrimary: boolean;
    order: number;
}

export interface ProductVariant {
    id: string;
    sku: string;
    name: string;
    price: number;
    comparePrice?: number;
    stockQty: number;
    attributes: Record<string, string>;
    weight?: number;
    images: string[];
}

export interface ProductAttribute {
    id: string;
    name: string;
    value: string;
    displayOrder: number;
}


/** One vehicle a part fits (years inclusive; empty = open-ended). */
export interface ProductFitment {
    make: string;
    model: string;
    yearFrom?: number | null;
    yearTo?: number | null;
    engine?: string | null;
    notes?: string | null;
}

export type PartNumberType = 'OE' | 'MANUFACTURER' | 'AFTERMARKET';

/** OE / manufacturer / aftermarket cross-reference number. */
export interface ProductPartNumber {
    number: string;
    type: PartNumberType;
    brand?: string | null;
}

export interface Product {
    id: string;
    sku: string;
    name: string;
    slug: string;
    description?: string;
    brand?: string;
    price: number;
    comparePrice?: number;
    costPrice?: number;
    stockQty: number;
    minStockQty?: number;
    isInStock: boolean;
    isActive: boolean;
    categoryId?: string;
    category?: Category;
    weight?: number;
    dimensions?: Record<string, any>;
    compatibility?: string;
    fitments?: ProductFitment[];
    isUniversal?: boolean;
    partNumbers?: ProductPartNumber[];
    tags: string[];
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    images: ProductImage[];
    variants: ProductVariant[];
    attributes: ProductAttribute[];
    averageRating?: number;
    reviewCount?: number;
    reviews?: ProductReview[];
    /** published-review stats, kept in sync server-side */
    ratingAvg?: number;
    ratingCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface ProductListParams {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    isActive?: boolean;
    sortBy?: 'price' | 'name' | 'createdAt' | 'popularity' | 'rating' | 'stock';
    sortOrder?: 'asc' | 'desc';
}

export interface ProductListResponse {
    data: Product[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface CreateProductPayload {
    sku: string;
    name: string;
    slug: string;
    description?: string;
    brand?: string;
    price: number;
    comparePrice?: number;
    costPrice?: number;
    stockQty?: number;
    minStockQty?: number;
    categoryId?: string;
    images?: Omit<ProductImage, 'id'>[];
    variants?: Omit<ProductVariant, 'id'>[];
    attributes?: Omit<ProductAttribute, 'id'>[];
    weight?: number;
    dimensions?: Record<string, any>;
    compatibility?: string;
    /** replaces the product's whole fitment list when sent */
    fitments?: ProductFitment[];
    isUniversal?: boolean;
    /** replaces the product's whole list when sent */
    partNumbers?: ProductPartNumber[];
    tags?: string[];
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    isActive?: boolean;

}

export type UpdateProductInput = Partial<CreateProductPayload>;

export interface ProductReview {
    id: string;
    productId: string;
    rating: number;
    comment?: string;
    userId?: string;
    userName?: string;
    createdAt: string;
}