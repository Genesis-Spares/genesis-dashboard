// src/app/(auth)/login/page.tsx
'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthShell } from '@/components/auth/AuthShell';
import { toast } from 'react-hot-toast';

function LoginPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/dashboard';
    const { login, isLoading, error, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            router.replace(redirectTo);
        }
    }, [isAuthenticated, router, redirectTo]);

    const handleSubmit = async (data: { email: string; password: string }) => {
        try {
            await login(data.email, data.password);
            toast.success('Welcome back!');
            router.replace(redirectTo);
        } catch (error) {
            toast.error((error as { message?: string })?.message || 'Login failed');
        }
    };

    return (
        <AuthShell>
            <LoginForm onSubmit={handleSubmit} isLoading={isLoading} error={error || undefined} />
        </AuthShell>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginPageInner />
        </Suspense>
    );
}