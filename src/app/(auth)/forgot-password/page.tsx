// src/app/(auth)/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon, EnvelopeIcon, KeyIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';
import { apiClient } from '@/lib/api/client';
import { AuthShell, authButton, authInput, authLabel, Spinner } from '@/components/auth/AuthShell';

const errText = (e: unknown, fallback: string) => {
    const m = (e as { message?: string | string[] })?.message;
    return Array.isArray(m) ? m[0] : m || fallback;
};

// mirrors the API's password rules so problems show before submitting
const RULES = [
    { test: (p: string) => p.length >= 8 && p.length <= 32, label: '8–32 characters' },
    { test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p), label: 'Upper and lower case letters' },
    { test: (p: string) => /\d/.test(p), label: 'At least one number' },
    { test: (p: string) => /[@$!%*?&]/.test(p), label: 'A symbol: @ $ ! % * ? &' },
];

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<'email' | 'reset'>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
    const rulesOk = RULES.every((r) => r.test(password));
    const canReset = /^\d{6}$/.test(code) && rulesOk && password === confirm;

    const requestCode = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!emailOk) { setError('Enter a valid email address'); return; }
        setBusy(true); setError(null);
        try {
            await apiClient.post('/auth/forgot-password', { email: email.trim() });
            setStep('reset');
            toast.success('If that email has an account, a code is on its way.');
        } catch (err) {
            setError(errText(err, 'Could not send the code. Please try again.'));
        } finally {
            setBusy(false);
        }
    };

    const reset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canReset) return;
        setBusy(true); setError(null);
        try {
            await apiClient.post('/auth/reset-password', { email: email.trim(), code, newPassword: password, confirmPassword: confirm });
            toast.success('Password updated. Sign in with your new password.');
            router.replace('/login');
        } catch (err) {
            setError(errText(err, 'Could not reset the password. Check the code and try again.'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AuthShell>
            <Link href="/login" className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                <ArrowLeftIcon className="h-4 w-4" /> Back to sign in
            </Link>

            {step === 'email' ? (
                <>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Reset your password</h1>
                    <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Enter your work email and we&apos;ll send you a 6-digit code.</p>
                    <form className="mt-8 space-y-5" onSubmit={requestCode} noValidate>
                        {error && <Alert text={error} />}
                        <div>
                            <label htmlFor="fp-email" className={authLabel}>Email address</label>
                            <div className="relative">
                                <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input id="fp-email" type="email" autoComplete="username" autoFocus placeholder="name@genesis.com"
                                    value={email} onChange={(e) => setEmail(e.target.value)} className={authInput} />
                            </div>
                        </div>
                        <button type="submit" disabled={busy} className={authButton}>{busy ? <><Spinner /> Sending…</> : 'Send reset code'}</button>
                    </form>
                </>
            ) : (
                <>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Choose a new password</h1>
                    <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                        If an account exists for <span className="font-medium text-gray-900 dark:text-white">{email.trim()}</span>, we&apos;ve emailed it a 6-digit code. It expires shortly.
                    </p>
                    <form className="mt-8 space-y-5" onSubmit={reset} noValidate>
                        {error && <Alert text={error} />}
                        <div>
                            <label htmlFor="fp-code" className={authLabel}>6-digit code</label>
                            <div className="relative">
                                <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input id="fp-code" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} placeholder="000000"
                                    value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className={`${authInput} font-mono tracking-[0.4em]`} />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="fp-new" className={authLabel}>New password</label>
                            <div className="relative">
                                <LockClosedIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input id="fp-new" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={authInput} />
                            </div>
                            <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                                {RULES.map((r) => {
                                    const ok = r.test(password);
                                    const Icon = ok ? CheckCircleIcon : XCircleIcon;
                                    return (
                                        <li key={r.label} className={`flex items-center gap-1 text-xs ${ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-400'}`}>
                                            <Icon className="h-3.5 w-3.5 shrink-0" /> {r.label}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                        <div>
                            <label htmlFor="fp-confirm" className={authLabel}>Confirm new password</label>
                            <div className="relative">
                                <LockClosedIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input id="fp-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                                    aria-invalid={!!confirm && confirm !== password} className={authInput} />
                            </div>
                            {!!confirm && confirm !== password && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">Passwords don&apos;t match</p>}
                        </div>
                        <button type="submit" disabled={busy || !canReset} className={authButton}>{busy ? <><Spinner /> Updating…</> : 'Update password'}</button>
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                            Didn&apos;t get it?{' '}
                            <button type="button" onClick={() => requestCode()} disabled={busy} className="font-medium text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400">Send a new code</button>
                            {' · '}
                            <button type="button" onClick={() => { setStep('email'); setError(null); setCode(''); }} className="font-medium text-blue-600 hover:underline dark:text-blue-400">Change email</button>
                        </p>
                    </form>
                </>
            )}
        </AuthShell>
    );
}

function Alert({ text }: { text: string }) {
    return (
        <div role="alert" className="flex gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{text}</span>
        </div>
    );
}
