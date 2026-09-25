import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../api/reviews.api';
import { ReviewListParams, ReviewStatus } from '@/types/review.types';

const keys = {
    all: ['reviews'] as const,
    list: (p?: ReviewListParams) => [...keys.all, 'list', p] as const,
};

export const useReviews = (params?: ReviewListParams) =>
    useQuery({ queryKey: keys.list(params), queryFn: () => reviewsApi.list(params), placeholderData: keepPreviousData });

export const useModerateReview = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status, reason }: { id: string; status: ReviewStatus; reason?: string }) => reviewsApi.moderate(id, status, reason),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.all });
            qc.invalidateQueries({ queryKey: ['products'] }); // product rating changed
        },
    });
};
