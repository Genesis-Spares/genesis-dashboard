'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { setCookie } from '@/lib/utils/cookies';
import { useAuthStore } from '@/lib/stores/authStore';

type VerifyState = 'verifying' | 'success' | 'error';

function VerifyInvitePageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [state, setState] = useState<VerifyState>('verifying');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    // Guards against React 18 dev-mode double-invoking the effect, which
    // would otherwise burn the single-use token on the first (discarded) call.
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        if (!token) {
            setState('error');
            setErrorMessage('This invitation link is missing its token. Check the link in your email and try again.');
            return;
        }

        (async () => {
            try {
                const response = await apiClient.post<{
                    accessToken: string;
                    refreshToken: string;
                    user: { id: string; email: string; firstName: string; lastName: string };
                }>('/auth/verify-invite', { token });

                const { accessToken, refreshToken } = response;

                setCookie('accessToken', accessToken, { expires: 15 });
                setCookie('refreshToken', refreshToken, { expires: 30 });

                await useAuthStore.getState().initialize();

                setState('success');
                setTimeout(() => router.replace('/dashboard'), 1200);
            } catch (error: any) {
                setState('error');
                setErrorMessage(
                    error?.message || 'This invitation link is invalid or has expired. Ask an admin to resend your invite.',
                );
            }
        })();
    }, [token, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-6 text-center">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Genesis</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Verifying your invitation</p>
                </div>

                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 p-8 shadow-sm">
                    {state === 'verifying' && (
                        <div className="space-y-3">
                            <div className="mx-auto w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">Confirming your email…</p>
                        </div>
                    )}

                    {state === 'success' && (
                        <div className="space-y-2">
                            <p className="text-base font-semibold text-blue-600 dark:text-blue-400">Email verified</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Taking you to your dashboard…</p>
                        </div>
                    )}

                    {state === 'error' && (
                        <div className="space-y-4">
                            <p className="text-base font-semibold text-gray-900 dark:text-white">
                                We couldn&apos;t verify this link
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{errorMessage}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Ask an administrator to resend your invitation, then use the link from that email.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Back to sign in
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function VerifyInvitePage() {
    return (
        <Suspense>
            <VerifyInvitePageInner />
        </Suspense>
    );
}
