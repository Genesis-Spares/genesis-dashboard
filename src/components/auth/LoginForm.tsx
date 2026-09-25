// src/components/auth/LoginForm.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EnvelopeIcon, EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import { authButton, authInput, authLabel, Spinner } from './AuthShell';

const loginSchema = z.object({
    email: z.string().trim().min(1, 'Enter your email address').email('Enter a valid email address'),
    password: z.string().min(1, 'Enter your password'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
    onSubmit: (data: LoginFormData) => Promise<void>;
    isLoading?: boolean;
    error?: string;
}

export const LoginForm = ({ onSubmit, isLoading, error }: LoginFormProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const [capsLock, setCapsLock] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

    const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState?.('CapsLock') ?? false);

    return (
        <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Welcome back</h1>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Sign in to the Genesis admin console to continue.</p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                {error && (
                    <div role="alert" className="flex gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                        <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div>
                    <label htmlFor="email" className={authLabel}>Email address</label>
                    <div className="relative">
                        <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input id="email" type="email" autoComplete="username" autoFocus placeholder="name@genesis.com"
                            aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined}
                            className={authInput} {...register('email')} />
                    </div>
                    {errors.email && <p id="email-error" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{errors.email.message}</p>}
                </div>

                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
                        <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400">
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <LockClosedIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password"
                            aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined}
                            onKeyUp={onKey} onKeyDown={onKey}
                            className={`${authInput} pr-11`} {...register('password')} />
                        <button type="button" onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
                            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                    {errors.password && <p id="password-error" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{errors.password.message}</p>}
                    {capsLock && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                            <ExclamationTriangleIcon className="h-3.5 w-3.5" /> Caps Lock is on
                        </p>
                    )}
                </div>

                <button type="submit" disabled={isLoading} className={authButton}>
                    {isLoading ? <><Spinner /> Signing in…</> : 'Sign in'}
                </button>
            </form>

            <p className="mt-8 border-t border-gray-100 pt-6 text-xs leading-relaxed text-gray-500 dark:border-gray-800 dark:text-gray-400">
                This console is for Genesis staff. Sign-ins and changes are recorded in the activity log.
                Need an account? Ask an administrator to send you an invitation.
            </p>
        </div>
    );
};
