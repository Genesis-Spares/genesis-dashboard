// src/lib/hooks/useInactivity.ts
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';

interface InactivityConfig {
    timeout?: number; // milliseconds
    warningTimeout?: number; // milliseconds
    onWarning?: () => void;
    onTimeout?: () => void;
}

export const useInactivity = (config: InactivityConfig = {}) => {
    const {
        timeout = 30 * 60 * 1000, // 30 minutes
        warningTimeout = 5 * 60 * 1000, // 5 minutes
        onWarning,
        onTimeout,
    } = config;

    const router = useRouter();
    const { isAuthenticated, logout } = useAuthStore();
    const [isWarningShown, setIsWarningShown] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastActivityRef = useRef<number>(0);

    const resetTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current);
        }

        setIsWarningShown(false);

        // Set warning timer
        warningTimerRef.current = setTimeout(() => {
            setIsWarningShown(true);
            onWarning?.();
        }, timeout - warningTimeout);

        // Set timeout timer
        timerRef.current = setTimeout(() => {
            handleTimeout();
        }, timeout);
    };

    const handleTimeout = async () => {
        if (isAuthenticated) {
            await logout();
            onTimeout?.();
            router.push('/login?reason=inactive');
        }
    };

    const handleActivity = () => {
        lastActivityRef.current = Date.now();
        resetTimer();
    };

    useEffect(() => {
        if (!isAuthenticated) return;

        // Events to track user activity
        const events = [
            'mousedown',
            'keydown',
            'touchstart',
            'scroll',
            'click',
            'mousemove',
        ];

        events.forEach((event) => {
            document.addEventListener(event, handleActivity);
        });

        resetTimer();

        return () => {
            events.forEach((event) => {
                document.removeEventListener(event, handleActivity);
            });

            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            if (warningTimerRef.current) {
                clearTimeout(warningTimerRef.current);
            }
        };
    }, [isAuthenticated]);

    return {
        isWarningShown,
        resetTimer,
        lastActivity: lastActivityRef.current,
    };
};