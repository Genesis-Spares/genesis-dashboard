export type ReviewStatus = 'PUBLISHED' | 'HIDDEN';

export interface AdminReview {
    id: string;
    productId: string;
    userId: string;
    rating: number;
    title?: string | null;
    content?: string | null;
    userName: string;
    isVerified: boolean;
    status: ReviewStatus;
    hiddenReason?: string | null;
    orderId?: string | null;
    vehicle?: string | null;
    fitted?: boolean | null;
    createdAt: string;
    updatedAt: string;
    product?: { id: string; name: string; sku: string; ratingAvg: number; ratingCount: number };
}

export interface ReviewListParams {
    status?: ReviewStatus;
    rating?: number;
    search?: string;
    productId?: string;
    page?: number;
    limit?: number;
}

export interface ReviewListResponse {
    data: AdminReview[];
    meta: { total: number; page: number; limit: number; totalPages: number };
}
