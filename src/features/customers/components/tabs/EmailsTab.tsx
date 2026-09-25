'use client';

import Link from 'next/link';
import { LoaderCircle, Mail } from 'lucide-react';
import { useCustomerEmails } from '@/features/emails/hooks/useEmails';
import { StatusPill, shortDate } from '@/features/emails/components/EmailsPanel';

export function EmailsTab({ customerId, onCompose }: { customerId: string; onCompose?: () => void }) {
    const { data, isLoading } = useCustomerEmails(customerId);

    if (isLoading) return <div className="flex justify-center py-10 text-gray-400"><LoaderCircle className="h-5 w-5 animate-spin" /></div>;
    if (!data?.length) {
        return (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Mail className="h-9 w-9 text-gray-300" />
                <p className="text-sm text-gray-500">No emails sent to this customer yet.</p>
                {onCompose && <button type="button" onClick={onCompose} className="text-sm font-medium text-blue-600 hover:underline">Write one</button>}
            </div>
        );
    }
    return (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
            {data.map((r) => (
                <li key={r.id}>
                    <Link href={`/emails?open=${r.message.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">{r.message.subject}</span>
                            <span className="block truncate text-xs text-gray-500">
                                {r.email}{r.message.createdByEmail ? ` · by ${r.message.createdByEmail}` : ''}{r.error ? ` · ${r.error}` : ''}
                            </span>
                        </span>
                        <StatusPill status={r.status} />
                        <span className="w-16 text-right text-xs text-gray-500">{shortDate(r.sentAt ?? r.message.sentAt)}</span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}
