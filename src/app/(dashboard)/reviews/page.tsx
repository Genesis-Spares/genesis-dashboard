'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ReviewsModeration } from '@/features/reviews/components/ReviewsModeration';

export default function Page() {
    return (
        <ProtectedRoute requiredPermission={['review:read']}>
            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Product reviews</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Reviews from verified buyers. Hide anything abusive or off-topic — hidden reviews don&apos;t count toward ratings.</p>
                </div>
                <ReviewsModeration />
            </div>
        </ProtectedRoute>
    );
}
