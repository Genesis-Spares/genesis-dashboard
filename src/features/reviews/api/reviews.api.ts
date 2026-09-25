import { apiClient } from '@/lib/api/client';
import { AdminReview, ReviewListParams, ReviewListResponse, ReviewStatus } from '@/types/review.types';

export const reviewsApi = {
    list: async (params?: ReviewListParams): Promise<ReviewListResponse> => apiClient.get<ReviewListResponse>('/reviews', params),
    moderate: async (id: string, status: ReviewStatus, reason?: string): Promise<AdminReview> =>
        apiClient.patch<AdminReview>(`/reviews/${id}`, { status, reason }),
};
