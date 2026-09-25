'use client';

import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useUser, useUpdateUser, useDeleteUser, useResendInvite } from '@/features/users/hooks/useUsers';
import { UserView } from '@/features/users/components/UserView';
import { UpdateUserPayload } from '@/types/user-management.types';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function UserViewPage() {
    return (
        <ProtectedRoute requiredPermission={['user:read']}>
            <UserViewPageContent />
        </ProtectedRoute>
    );
}

function UserViewPageContent() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const userId = params?.id;

    const { data: user, isLoading, isError, error, refetch } = useUser(userId);
    const updateUser = useUpdateUser();
    const deleteUser = useDeleteUser();
    const resendInvite = useResendInvite();

    const handleBack = () => router.push('/users');

    const handleUpdate = (input: UpdateUserPayload) => {
        if (!userId) return;
        updateUser.mutate({ id: userId, input });
    };

    const handleDelete = () => {
        if (!userId) return;
        deleteUser.mutate(userId, { onSuccess: () => router.push('/users') });
    };

    const handleStatusChange = (isActive: boolean) => {
        if (!userId) return;
        updateUser.mutate({ id: userId, input: { isActive } });
    };

    const handleResendInvite = () => {
        if (!userId || !user) return;
        resendInvite.mutate(userId, {
            onSuccess: () => toast.success(`Invitation resent to ${user.email}`),
            onError: (error: any) => toast.error(error?.message || 'Failed to resend invitation.'),
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24 text-sm text-gray-400">Loading user…</div>
        );
    }

    if (isError || !user) {
        return (
            <div className="p-6 rounded-2xl border border-red-100 bg-red-50 text-red-600 text-sm dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400">
                <p>Failed to load user{error instanceof Error ? `: ${error.message}` : '.'}</p>
                <button
                    onClick={() => refetch()}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/40 text-sm font-medium hover:bg-red-100/60 dark:hover:bg-red-900/20 transition-colors"
                >
                    Reload
                </button>
            </div>
        );
    }

    return (
        <UserView
            user={user}
            onBack={handleBack}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onResendInvite={handleResendInvite}
            isDeleting={deleteUser.isPending}
            isUpdating={updateUser.isPending}
            isResendingInvite={resendInvite.isPending}
        />
    );
}
