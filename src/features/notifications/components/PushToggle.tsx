'use client';

import { useEffect, useState } from 'react';
import { BellAlertIcon, BellSlashIcon } from '@heroicons/react/24/outline';
import { disablePush, enablePush, getPushState, type PushState } from '../push';
import { notificationsApi } from '../api/notifications.api';

/** Per-device switch for push notifications, with guidance when it can't be turned on. */
export function PushToggle() {
    const [state, setState] = useState<PushState | null>(null);
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState<string | null>(null);

    useEffect(() => {
        getPushState().then(setState).catch(() => setState('unsupported'));
    }, []);

    const run = async (fn: () => Promise<PushState>) => {
        setBusy(true);
        setNote(null);
        try {
            setState(await fn());
        } catch (e) {
            const msg = (e as Error)?.message || '';
            setNote(
                /registration failed|push service/i.test(msg)
                    ? "This browser couldn't register for push. Private/incognito windows don't support it; try a normal window or the installed app."
                    : msg || 'Something went wrong',
            );
        } finally {
            setBusy(false);
        }
    };

    const sendTest = async () => {
        setBusy(true);
        setNote(null);
        try {
            await notificationsApi.test();
            setNote('Test sent. It should appear in a few seconds.');
        } catch {
            setNote("Couldn't send a test. Try turning push off and on again.");
        } finally {
            setBusy(false);
        }
    };

    if (!state) return null;

    const hint: Record<Exclude<PushState, 'on' | 'off'>, string> = {
        unsupported: "Push notifications aren't available in this browser.",
        'ios-install': 'On iPhone, add Genesis to your Home Screen first (Share → Add to Home Screen), then turn on alerts from the installed app.',
        denied: 'Notifications are blocked for this site. Allow them in your browser or phone settings, then come back here.',
    };

    return (
        <div className="border-t border-gray-100 px-4 py-3 text-sm dark:border-gray-700">
            {state === 'on' || state === 'off' ? (
                <div className="flex items-center gap-3">
                    {state === 'on' ? (
                        <BellAlertIcon className="h-5 w-5 shrink-0 text-blue-600" />
                    ) : (
                        <BellSlashIcon className="h-5 w-5 shrink-0 text-gray-400" />
                    )}
                    <p className="min-w-0 flex-1 text-gray-600 dark:text-gray-300">
                        {state === 'on' ? 'Alerts are on for this device' : 'Get alerts on this device'}
                    </p>
                    {state === 'on' && (
                        <button type="button" disabled={busy} onClick={sendTest} className="shrink-0 text-xs font-medium text-gray-500 hover:text-gray-800 disabled:opacity-50 dark:text-gray-400">
                            Test
                        </button>
                    )}
                    <button
                        type="button"
                        role="switch"
                        aria-checked={state === 'on'}
                        aria-label="Push notifications on this device"
                        disabled={busy}
                        onClick={() => run(state === 'on' ? disablePush : enablePush)}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${state === 'on' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                    >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${state === 'on' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                </div>
            ) : (
                <p className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <BellSlashIcon className="h-4 w-4 shrink-0" /> {hint[state]}
                </p>
            )}
            {note && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{note}</p>}
        </div>
    );
}
