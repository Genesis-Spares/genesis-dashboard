'use client';

import { useParams, useRouter } from 'next/navigation';
import {
    useRole,
    useUpdateRole,
    useAssignRolePermissions,
    usePermissionCatalog,
} from '@/features/roles/hooks/useRoles';
import { RoleView } from '@/features/roles/components/RoleView';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function RoleViewPage() {
    return (
        <ProtectedRoute requiredPermission={['role:read']}>
            <RoleViewPageContent />
        </ProtectedRoute>
    );
}

function RoleViewPageContent() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const roleId = params?.id;

    const { data: role, isLoading, isError, error, refetch } = useRole(roleId);
    const { data: catalog } = usePermissionCatalog();
    const updateRole = useUpdateRole();
    const assignPermissions = useAssignRolePermissions(roleId ?? '');

    if (isLoading) {
        return <div className="flex items-center justify-center py-24 text-sm text-gray-400">Loading role…</div>;
    }

    if (isError || !role) {
        return (
            <div className="p-6 rounded-2xl border border-red-100 bg-red-50 text-red-600 text-sm dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400">
                <p>Failed to load role{error instanceof Error ? `: ${error.message}` : '.'}</p>
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
        <RoleView
            role={role}
            catalog={catalog}
            onBack={() => router.push('/roles')}
            onUpdate={(input) => roleId && updateRole.mutate({ id: roleId, input })}
            onSavePermissions={(permissionIds) => assignPermissions.mutate(permissionIds)}
            onViewUser={(userId) => router.push(`/users/${userId}`)}
            isUpdating={updateRole.isPending}
            isSavingPermissions={assignPermissions.isPending}
        />
    );
}
