// src/components/auth/AuthInitializer.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
    const { initialize, isLoading, isAuthenticated } = useAuthStore();
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const initAuth = async () => {
            try {
                await initialize();
            } catch (error) {
                console.error('Auth initialization failed:', error);
            } finally {
                setIsInitialized(true);
            }
        };

        initAuth();
    }, [initialize]);

    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return <>{children}</>;
};