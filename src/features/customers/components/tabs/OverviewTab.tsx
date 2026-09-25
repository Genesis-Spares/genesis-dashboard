import { Customer } from '@/types/customer.types';

interface OverviewTabProps {
    customer: Customer;
    addressesCount: number;
    notesCount: number;
    activitiesCount: number;
    formattedLastLogin: string;
}

function InfoCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {title}
                </h3>
                {action}
            </div>
            {children}
        </div>
    );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
            <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{value}</span>
        </div>
    );
}

function StatBlock({ value, label }: { value: React.ReactNode; label: string }) {
    return (
        <div className="flex flex-col items-center text-center gap-1 px-4">
            <span className="text-xl font-bold">{value}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        </div>
    );
}

export function OverviewTab({
    customer,
    addressesCount,
    notesCount,
    activitiesCount,
    formattedLastLogin
}: OverviewTabProps) {
    return (
        <>
            {/* Stats */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 py-8">
                <div className="flex flex-wrap justify-around gap-y-6">
                    <StatBlock value={customer.loyaltyPoints.toLocaleString()} label="Loyalty Points" />
                    <StatBlock value={customer.loginCount} label="Login Count" />
                    <StatBlock value={formattedLastLogin} label="Last Login" />
                    <StatBlock value={addressesCount} label="Addresses" />
                    <StatBlock value={notesCount} label="Notes" />
                    <StatBlock value={activitiesCount} label="Activities" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Contact Information */}
                    <InfoCard title="Contact Information">
                        <Field label="Email" value={customer.email} />
                        <Field label="Phone" value={customer.phone ?? '—'} />
                        <Field label="Gender" value={customer.gender ?? '—'} />
                        <Field
                            label="Date of Birth"
                            value={customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : '—'}
                        />
                    </InfoCard>

                    {/* Localization */}
                    <InfoCard title="Localization">
                        <Field label="Language" value={customer.language} />
                        <Field label="Timezone" value={customer.timezone} />
                        <Field label="Currency" value={customer.currency} />
                    </InfoCard>
                </div>

                <div className="space-y-6">
                    {/* Account Info */}
                    <InfoCard title="Account">
                        <Field label="Customer ID" value={<span className="font-mono text-xs">{customer.id}</span>} />
                        <Field label="User ID" value={<span className="font-mono text-xs">{customer.userId}</span>} />
                        <Field label="Loyalty Tier" value={customer.loyaltyTier} />
                    </InfoCard>

                    {/* Timestamps */}
                    <InfoCard title="Timestamps">
                        <Field label="Joined" value={new Date(customer.createdAt).toLocaleString()} />
                        <Field label="Last updated" value={new Date(customer.updatedAt).toLocaleString()} />
                    </InfoCard>
                </div>
            </div>
        </>
    );
}