// src/lib/hooks/useSession.ts

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';

interface SessionConfig {
    refreshInterval?: number; // milliseconds
    idleTimeout?: number; // milliseconds
    warningTimeout?: number; // milliseconds
}

export const useSession = (config: SessionConfig = {}) => {
    const {
        refreshInterval = 10 * 60 * 1000, // 10 minutes
        idleTimeout = 30 * 60 * 1000, // 30 minutes
        warningTimeout = 5 * 60 * 1000, // 5 minutes
    } = config;

    const router = useRouter();

    const {
        isAuthenticated,
        tokens,
        refreshToken,
        logout,
    } = useAuthStore();

    // ============================================
    // STATE
    // ============================================

    const [isWarningShown, setIsWarningShown] = useState(false);

    // ============================================
    // REFS
    // ============================================

    const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const lastActivityRef = useRef<number>(Date.now());

    const warningShownRef = useRef<boolean>(false);

    // Prevent multiple logout calls
    const isLoggingOutRef = useRef<boolean>(false);

    // ============================================
    // WARNING HELPERS
    // ============================================

    const showWarning = () => {
        if (warningShownRef.current) {
            return;
        }

        warningShownRef.current = true;
        setIsWarningShown(true);

        console.warn('Session will expire soon');
    };

    const hideWarning = () => {
        warningShownRef.current = false;
        setIsWarningShown(false);
    };

    // ============================================
    // CLEAR IDLE TIMERS
    // ============================================

    const clearIdleTimers = () => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }

        if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current);
            warningTimerRef.current = null;
        }
    };

    // ============================================
    // HANDLE IDLE TIMEOUT
    // ============================================

    const handleIdleTimeout = async () => {
        if (!isAuthenticated || isLoggingOutRef.current) {
            return;
        }

        isLoggingOutRef.current = true;

        clearIdleTimers();

        hideWarning();

        try {
            await logout();
        } catch (error) {
            console.error('Failed to logout after inactivity:', error);
        } finally {
            router.push('/login?reason=timeout');
        }
    };

    // ============================================
    // RESET IDLE TIMER
    // ============================================

    const resetIdleTimer = () => {
        if (!isAuthenticated) {
            return;
        }

        // Update last activity timestamp
        lastActivityRef.current = Date.now();

        // Hide existing warning
        hideWarning();

        // Clear existing timers
        clearIdleTimers();

        // ==========================================
        // WARNING TIMER
        // ==========================================

        const warningDelay = Math.max(
            0,
            idleTimeout - warningTimeout,
        );

        warningTimerRef.current = setTimeout(() => {
            showWarning();
        }, warningDelay);

        // ==========================================
        // IDLE TIMEOUT TIMER
        // ==========================================

        idleTimerRef.current = setTimeout(() => {
            handleIdleTimeout();
        }, idleTimeout);
    };

    // ============================================
    // HANDLE USER ACTIVITY
    // ============================================

    const handleUserActivity = () => {
        if (!isAuthenticated) {
            return;
        }

        resetIdleTimer();
    };

    // ============================================
    // REFRESH SESSION
    // ============================================

    const refreshSession = async () => {
        if (!isAuthenticated || !tokens) {
            return;
        }

        // Check actual inactivity before refreshing
        const inactiveTime = Date.now() - lastActivityRef.current;

        if (inactiveTime >= idleTimeout) {
            await handleIdleTimeout();
            return;
        }

        try {
            await refreshToken();

            console.debug('Session refreshed successfully');
        } catch (error) {
            console.error('Token refresh failed:', error);

            clearIdleTimers();
            hideWarning();

            await logout();

            router.push('/login?reason=expired');
        }
    };

    // ============================================
    // SESSION REFRESH TIMER
    // ============================================

    useEffect(() => {
        if (!isAuthenticated || !tokens) {
            return;
        }

        // Clear any existing refresh timer
        if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current);
        }

        refreshTimerRef.current = setInterval(() => {
            refreshSession();
        }, refreshInterval);

        return () => {
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }
        };
    }, [
        isAuthenticated,
        tokens,
        refreshInterval,
        idleTimeout,
    ]);

    // ============================================
    // IDLE DETECTION
    // ============================================

    useEffect(() => {
        if (!isAuthenticated) {
            clearIdleTimers();
            hideWarning();

            return;
        }

        const events = [
            'mousedown',
            'keydown',
            'touchstart',
            'scroll',
            'click',
        ];

        events.forEach((event) => {
            document.addEventListener(
                event,
                handleUserActivity,
            );
        });

        // Start idle timer
        resetIdleTimer();

        return () => {
            events.forEach((event) => {
                document.removeEventListener(
                    event,
                    handleUserActivity,
                );
            });

            clearIdleTimers();
        };
    }, [
        isAuthenticated,
        idleTimeout,
        warningTimeout,
    ]);

    // ============================================
    // VISIBILITY CHANGE
    // ============================================

    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (
                document.visibilityState !== 'visible' ||
                !isAuthenticated
            ) {
                return;
            }

            const inactiveTime =
                Date.now() - lastActivityRef.current;

            // User has been inactive longer than allowed
            if (inactiveTime >= idleTimeout) {
                await handleIdleTimeout();
                return;
            }

            // User is still within the allowed idle period.
            // Restart the timers based on the remaining time.
            resetIdleTimer();
        };

        document.addEventListener(
            'visibilitychange',
            handleVisibilityChange,
        );

        return () => {
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
        };
    }, [
        isAuthenticated,
        idleTimeout,
    ]);

    // ============================================
    // CLEANUP ON UNMOUNT
    // ============================================

    useEffect(() => {
        return () => {
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }

            clearIdleTimers();

            warningShownRef.current = false;
        };
    }, []);

    // ============================================
    // RETURN
    // ============================================

    return {
        isWarningShown,

        refreshSession,

        resetIdleTimer,

        lastActivity: lastActivityRef.current,
    };
};