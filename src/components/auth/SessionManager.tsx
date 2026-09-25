// src/components/auth/SessionManager.tsx
'use client';

import { useEffect } from 'react';
import { useSession } from '@/lib/hooks/useSession';
import { useAuthStore } from '@/lib/stores/authStore';
import { toast } from 'react-hot-toast';

export const SessionManager = () => {
    const { isAuthenticated } = useAuthStore();
    const { isWarningShown } = useSession({
        refreshInterval: 10 * 60 * 1000,
        idleTimeout: 30 * 60 * 1000,
        warningTimeout: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (isWarningShown && isAuthenticated) {
            toast(
                (t) => (
                    <div className="flex flex-col gap-2">
                        <p className="font-medium">Session Expiring Soon</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Your session will expire in 5 minutes. Please move your mouse or type to continue.
                        </p>
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="px-3 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600"
                        >
                            I'm still here
                        </button>
                    </div>
                ),
                {
                    duration: 0,
                    position: 'top-center',
                }
            );
        }
    }, [isWarningShown, isAuthenticated]);

    return null;
};