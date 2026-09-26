'use client';

import { useEffect, useState } from 'react';
import { ArrowDownTrayIcon, ArrowUpOnSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'genesis-install-hint-dismissed';

function isStandalone() {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

function readDismissed() {
    try {
        return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
        return false;
    }
}

/**
 * "Install app" affordances:
 * - Chrome/Edge/Android fire `beforeinstallprompt`: we show a small Install button.
 * - iPhone/iPad Safari has no install API: a one-time hint explains Share → Add to Home Screen.
 * Nothing shows once the app is already installed (running standalone).
 */
export function InstallPrompt() {
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
    const [iosHint, setIosHint] = useState(false);

    useEffect(() => {
        if (isStandalone()) return;
        const onPrompt = (e: Event) => {
            e.preventDefault();
            setDeferred(e as BeforeInstallPromptEvent);
        };
        const onInstalled = () => setDeferred(null);
        window.addEventListener('beforeinstallprompt', onPrompt);
        window.addEventListener('appinstalled', onInstalled);

        const ua = navigator.userAgent;
        const iOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
        const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
        if (iOS && safari && !readDismissed()) setIosHint(true);

        return () => {
            window.removeEventListener('beforeinstallprompt', onPrompt);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const dismissIos = () => {
        setIosHint(false);
        try {
            localStorage.setItem(DISMISS_KEY, '1');
        } catch {
            /* private mode: just hide for this visit */
        }
    };

    if (deferred) {
        return (
            <button
                type="button"
                onClick={async () => {
                    await deferred.prompt();
                    await deferred.userChoice;
                    setDeferred(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300"
            >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Install app</span>
                <span className="sm:hidden">Install</span>
            </button>
        );
    }

    if (iosHint) {
        return (
            <div
                role="status"
                className="fixed inset-x-3 bottom-3 z-50 flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-xl dark:border-gray-700 dark:bg-gray-800"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/icon-192.png" alt="" className="h-10 w-10 shrink-0 rounded-xl" />
                <p className="flex-1 text-gray-600 dark:text-gray-300">
                    <span className="block font-semibold text-gray-900 dark:text-white">Install Genesis Admin</span>
                    Tap <ArrowUpOnSquareIcon className="inline h-4 w-4 -translate-y-0.5" aria-label="Share" /> Share, then{' '}
                    <span className="font-medium">Add to Home Screen</span>.
                </p>
                <button type="button" onClick={dismissIos} aria-label="Dismiss" className="-m-1 p-1 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="h-5 w-5" />
                </button>
            </div>
        );
    }

    return null;
}
