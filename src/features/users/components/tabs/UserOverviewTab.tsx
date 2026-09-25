// src/features/users/components/tabs/UserOverviewTab.tsx
import { ManagedUser } from '@/types/user-management.types';

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                {title}
            </h3>
            {children}
        </div>
    );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
            <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{value}</span>
        </div>
    );
}

interface UserOverviewTabProps {
    user: ManagedUser;
    activityCount?: number;
}

export function UserOverviewTab({ user, activityCount = 0 }: UserOverviewTabProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title="Account">
                <Row label="Email" value={user.email} />
                <Row label="Phone" value={user.phone || '—'} />
                <Row label="Status" value={user.status.charAt(0) + user.status.slice(1).toLowerCase()} />
                <Row label="Email verified" value={user.isEmailVerified ? 'Yes' : 'No'} />
                <Row label="Joined" value={new Date(user.createAt).toLocaleDateString()} />
                <Row label="Last updated" value={new Date(user.updateAt).toLocaleDateString()} />
            </InfoCard>

            <InfoCard title="Roles & Activity">
                <Row
                    label="Roles"
                    value={
                        user.roles.length > 0 ? (
                            <span className="flex flex-wrap gap-1 justify-end">
                                {user.roles.map((r) => (
                                    <span
                                        key={r.id}
                                        className="text-xs font-medium text-blue-600 dark:text-blue-400"
                                    >
                                        {r.name}
                                    </span>
                                ))}
                            </span>
                        ) : (
                            'None'
                        )
                    }
                />
                <Row label="Logged activities" value={activityCount} />
            </InfoCard>
        </div>
    );
}
