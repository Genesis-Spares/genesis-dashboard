// src/features/users/components/UserView.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftIcon, EllipsisHorizontalIcon, KeyIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { ActivitiesTab } from '@/features/customers/components/tabs/ActivitiesTab';
import { EditUserModal } from './EditUserModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { UserOverviewTab } from './tabs/UserOverviewTab';
import { UserRolesTab } from './tabs/UserRolesTab';
import { ManagedUser, UpdateUserPayload } from '@/types/user-management.types';
import { useUserActivities, useAssignUserRoles, useAdminResetPassword } from '../hooks/useUsers';

interface UserViewProps {
    user: ManagedUser;
    onBack: () => void;
    onUpdate: (input: UpdateUserPayload) => void;
    onDelete: () => void;
    onStatusChange?: (isActive: boolean) => void;
    onResendInvite?: () => void;
    isDeleting?: boolean;
    isUpdating?: boolean;
    isResendingInvite?: boolean;
}

type TabId = 'overview' | 'roles' | 'activity';

function initials(user: ManagedUser) {
    return `${user.firstname?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
}

const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'roles', label: 'Roles' },
    { id: 'activity', label: 'Activity' },
];

export function UserView({
    user,
    onBack,
    onUpdate,
    onDelete,
    onStatusChange,
    onResendInvite,
    isDeleting = false,
    isUpdating = false,
    isResendingInvite = false,
}: UserViewProps) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const { can } = usePermissions();
    const canUpdate = can({ permission: 'user:update' });
    const canDelete = can({ permission: 'user:delete' });

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const { data: activityPage } = useUserActivities(user.id, 1, 50);
    const assignRoles = useAssignUserRoles(user.id);
    const resetPassword = useAdminResetPassword(user.id);

    const handleConfirmDelete = useCallback(() => {
        onDelete();
        setDeleteModalOpen(false);
    }, [onDelete]);

    const handleStatusToggle = useCallback(() => {
        if (onStatusChange) {
            onStatusChange(!user.isActive);
            setMenuOpen(false);
        }
    }, [onStatusChange, user.isActive]);

    const handleEditSubmit = (input: UpdateUserPayload) => {
        onUpdate(input);
        setEditModalOpen(false);
    };

    const handleResetPassword = (newPassword: string) => {
        resetPassword.mutate(newPassword, {
            onSuccess: () => setResetPasswordOpen(false),
        });
    };

    const fullName = useMemo(() => `${user.firstname} ${user.lastName}`.trim(), [user.firstname, user.lastName]);
    const userInitials = useMemo(() => initials(user), [user]);
    const isActive = user.isActive;

    return (
        <>
            <div className="space-y-0">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                            Back
                        </button>
                        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

                        <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center overflow-hidden shrink-0">
                            <span className="text-xs font-semibold">{userInitials}</span>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{fullName}</h1>
                        <span className="text-sm text-gray-400">{user.email}</span>

                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {user.status.charAt(0) + user.status.slice(1).toLowerCase()}
                        </span>
                        {!user.isEmailVerified && (
                            <span className="text-xs font-medium text-gray-400">Unverified</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {canUpdate && (
                            <button
                                onClick={() => setEditModalOpen(true)}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Edit
                            </button>
                        )}

                        {(canDelete || canUpdate) && (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setMenuOpen((v) => !v)}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    aria-label="More actions"
                                >
                                    <EllipsisHorizontalIcon className="w-5 h-5 text-gray-500" />
                                </button>

                                {menuOpen && (
                                    <div className="absolute right-0 mt-2 w-52 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg py-1 z-10">
                                        {canUpdate && onStatusChange && (
                                            <button
                                                onClick={handleStatusToggle}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                                            >
                                                {isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                        )}
                                        {canUpdate && (
                                            <button
                                                onClick={() => {
                                                    setResetPasswordOpen(true);
                                                    setMenuOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                                            >
                                                <KeyIcon className="w-4 h-4" />
                                                Reset Password
                                            </button>
                                        )}
                                        {canUpdate && onResendInvite && !user.isEmailVerified && (
                                            <button
                                                onClick={() => {
                                                    onResendInvite();
                                                    setMenuOpen(false);
                                                }}
                                                disabled={isResendingInvite}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <PaperAirplaneIcon className="w-4 h-4" />
                                                Resend Invite
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() => {
                                                    setDeleteModalOpen(true);
                                                    setMenuOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                                            >
                                                Deactivate Account
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab Strip */}
                <div className="border-b border-gray-100 dark:border-gray-800 flex gap-6 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-1 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="pt-6 space-y-6">
                    {activeTab === 'overview' && (
                        <UserOverviewTab user={user} activityCount={activityPage?.meta.total ?? 0} />
                    )}

                    {activeTab === 'roles' && (
                        <UserRolesTab
                            roles={user.roles}
                            canManage={canUpdate}
                            onAssignRoles={(roleIds) => assignRoles.mutate(roleIds)}
                            isAssigning={assignRoles.isPending}
                        />
                    )}

                    {activeTab === 'activity' && <ActivitiesTab activities={activityPage?.data ?? []} total={activityPage?.meta.total ?? 0} />}
                </div>
            </div>

            <EditUserModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                onSubmit={handleEditSubmit}
                user={user}
                isSubmitting={isUpdating}
            />

            <ResetPasswordModal
                isOpen={resetPasswordOpen}
                onClose={() => setResetPasswordOpen(false)}
                onSubmit={handleResetPassword}
                isSubmitting={resetPassword.isPending}
            />

            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
                title="Deactivate User"
                itemName={fullName}
                message={`Are you sure you want to deactivate "${fullName}"? Their account will be disabled and their sessions revoked.`}
                confirmText="Deactivate"
            />
        </>
    );
}
