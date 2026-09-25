import { useState } from 'react';
import { CustomerPreference } from '@/types/customer.types';

interface PreferencesTabProps {
    preferences: CustomerPreference | null;
    canManage: boolean;
    onUpdatePreferences: (data: any) => void;
    isUpdating: boolean;
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {title}
                </h3>
            </div>
            {children}
        </div>
    );
}

function Toggle({
    label,
    checked,
    onChange,
    disabled
}: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean
}) {
    return (
        <label className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0 cursor-pointer">
            <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
            <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={`relative w-10 h-5.5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'} disabled:opacity-50`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4.5' : ''
                        }`}
                />
            </button>
        </label>
    );
}

export function PreferencesTab({ preferences, canManage, onUpdatePreferences, isUpdating }: PreferencesTabProps) {
    if (!preferences) {
        return (
            <InfoCard title="Preferences">
                <p className="text-sm text-gray-400">No preferences set for this customer yet.</p>
            </InfoCard>
        );
    }

    const toggle = (key: string, value: boolean) => {
        onUpdatePreferences({ [key]: value });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InfoCard title="Notifications">
                <Toggle
                    label="Email notifications"
                    checked={preferences.emailNotifications}
                    onChange={(v) => toggle('emailNotifications', v)}
                    disabled={!canManage || isUpdating}
                />
                <Toggle
                    label="SMS notifications"
                    checked={preferences.smsNotifications}
                    onChange={(v) => toggle('smsNotifications', v)}
                    disabled={!canManage || isUpdating}
                />
                <Toggle
                    label="Push notifications"
                    checked={preferences.pushNotifications}
                    onChange={(v) => toggle('pushNotifications', v)}
                    disabled={!canManage || isUpdating}
                />
                <Toggle
                    label="Marketing emails"
                    checked={preferences.marketingEmails}
                    onChange={(v) => toggle('marketingEmails', v)}
                    disabled={!canManage || isUpdating}
                />
            </InfoCard>

            <InfoCard title="Privacy">
                <Toggle
                    label="Data sharing consent"
                    checked={preferences.dataSharingConsent}
                    onChange={(v) => toggle('dataSharingConsent', v)}
                    disabled={!canManage || isUpdating}
                />
                <Toggle
                    label="Cookie consent"
                    checked={preferences.cookieConsent}
                    onChange={(v) => toggle('cookieConsent', v)}
                    disabled={!canManage || isUpdating}
                />
            </InfoCard>

            {preferences.preferredCategories?.length > 0 && (
                <InfoCard title="Preferred Categories">
                    <div className="flex flex-wrap gap-1.5">
                        {preferences.preferredCategories.map((cat: string) => (
                            <span
                                key={cat}
                                className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                            >
                                {cat}
                            </span>
                        ))}
                    </div>
                </InfoCard>
            )}

            {preferences.preferredBrands?.length > 0 && (
                <InfoCard title="Preferred Brands">
                    <div className="flex flex-wrap gap-1.5">
                        {preferences.preferredBrands.map((brand: string) => (
                            <span
                                key={brand}
                                className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                            >
                                {brand}
                            </span>
                        ))}
                    </div>
                </InfoCard>
            )}
        </div>
    );
}