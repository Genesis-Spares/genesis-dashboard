'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Eye, FileText, LoaderCircle, Maximize2, Minimize2, Paperclip, Send, Trash2, Users, X } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/authStore';
import { errMsg } from '@/features/orders/components/OrderDialogs';
import type { Customer, CustomerListResponse } from '@/types/customer.types';
import { EmailAttachment, EmailMessage, EmailRecipientInput, SaveEmailPayload, uploadAttachment } from '../api/emails.api';
import { useEmail, useEmailMutations } from '../hooks/useEmails';
import { RichTextEditor } from './RichTextEditor';
import { mergeValuesFor, personalise, renderEmailDocument } from './emailPreview';

const EMAIL_RE = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;
const MAX_RECIPIENTS = 500;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

type Chip = EmailRecipientInput & { marketingOptOut?: boolean };

export interface ComposerSeed {
    recipients?: Chip[];
    subject?: string;
}

const fmtSize = (n?: number) => (n == null ? '' : n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);
const displayName = (c: Pick<Customer, 'firstName' | 'lastName' | 'email'>) => `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || c.email;

/** "Jane Doe <jane@x.com>, bob@y.com" → addresses */
function parseAddresses(text: string): Chip[] {
    return text
        .split(/[,;\n]+/)
        .map((part) => {
            const m = part.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
            const email = (m ? m[2] : part).trim().toLowerCase();
            const name = m?.[1]?.trim();
            return EMAIL_RE.test(email) ? { email, ...(name ? { name } : {}) } : null;
        })
        .filter((x): x is Chip => !!x);
}

// ─── address field with customer lookup ─────────────────────────

function AddressField({ label, chips, onChange, lookup = false, disabled, autoFocus, extra }: {
    label: string; chips: Chip[]; onChange: (next: Chip[]) => void; lookup?: boolean; disabled?: boolean; autoFocus?: boolean; extra?: React.ReactNode;
}) {
    const [text, setText] = useState('');
    const [found, setResults] = useState<Customer[]>([]);
    const [active, setActive] = useState(0);
    const [focused, setFocused] = useState(false);
    const input = useRef<HTMLInputElement>(null);
    const textRef = useRef(text);
    useLayoutEffect(() => { textRef.current = text; }, [text]);
    const searching = lookup && text.trim().length >= 2;
    const results = searching ? found : [];

    useEffect(() => {
        const q = text.trim();
        if (!lookup || q.length < 2) return;
        let live = true;
        const t = setTimeout(async () => {
            try {
                const res: CustomerListResponse = await apiClient.get('/customers', { search: q, limit: 8 });
                if (live) {
                    setResults(res.data.filter((c) => !chips.some((x) => x.email === c.email.toLowerCase())));
                    setActive(0);
                }
            } catch {
                if (live) setResults([]);
            }
        }, 220);
        return () => { live = false; clearTimeout(t); };
    }, [text, lookup, chips]);

    const add = (items: Chip[]) => {
        const seen = new Set(chips.map((c) => c.email));
        const fresh = items.filter((c) => !seen.has(c.email) && seen.add(c.email));
        if (fresh.length) onChange([...chips, ...fresh]);
        setText('');
        setResults([]);
    };

    const commitText = () => {
        const parsed = parseAddresses(text);
        if (parsed.length) add(parsed);
        else if (text.trim()) toast.error(`“${text.trim()}” isn't a valid email address`);
    };

    const pick = (c: Customer) => add([{ email: c.email.toLowerCase(), name: displayName(c), customerId: c.id }]);

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (results.length && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length);
        } else if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',' || e.key === ';') {
            if (results.length && e.key !== ',' && e.key !== ';') {
                e.preventDefault();
                pick(results[active]);
            } else if (text.trim()) {
                e.preventDefault();
                commitText();
            }
        } else if (e.key === 'Backspace' && !text && chips.length) {
            onChange(chips.slice(0, -1));
        } else if (e.key === 'Escape') {
            setResults([]);
        }
    };

    return (
        <div className="relative flex items-start gap-2 border-b border-gray-100 px-4 py-1.5 dark:border-gray-700" onClick={() => input.current?.focus()}>
            <span className="w-8 shrink-0 pt-1.5 text-sm text-gray-500">{label}</span>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                {chips.map((c) => (
                    <span key={c.email} title={c.marketingOptOut ? `${c.email} — opted out of marketing emails` : c.email}
                        className={`inline-flex max-w-full items-center gap-1 rounded-full border py-0.5 pl-2.5 pr-1 text-[13px] ${c.marketingOptOut
                            ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200'
                            : 'border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-600 dark:bg-gray-700/60 dark:text-gray-100'}`}>
                        <span className="truncate">{c.name || c.email}</span>
                        {c.name && <span className="hidden truncate text-gray-400 sm:inline">&lt;{c.email}&gt;</span>}
                        {!disabled && (
                            <button type="button" aria-label={`Remove ${c.email}`} onClick={(e) => { e.stopPropagation(); onChange(chips.filter((x) => x.email !== c.email)); }}
                                className="rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-600">
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </span>
                ))}
                {!disabled && (
                    <input ref={input} value={text} autoFocus={autoFocus} aria-label={label === 'To' ? 'Recipients' : label}
                        placeholder={chips.length ? '' : lookup ? 'Search customers or type an email' : 'Email addresses'}
                        onChange={(e) => setText(e.target.value)} onKeyDown={onKeyDown}
                        onFocus={() => setFocused(true)}
                        onBlur={() => {
                            setFocused(false);
                            // keep a finished address typed before clicking away; drop half-typed searches
                            setTimeout(() => {
                                const parsed = parseAddresses(textRef.current);
                                if (parsed.length) add(parsed);
                            }, 150);
                        }}
                        onPaste={(e) => {
                            const parsed = parseAddresses(e.clipboardData.getData('text'));
                            if (parsed.length > 1) { e.preventDefault(); add(parsed); }
                        }}
                        className="min-w-[180px] flex-1 bg-transparent py-1 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100" />
                )}
            </div>
            {extra}
            {focused && results.length > 0 && (
                <ul role="listbox" className="absolute left-12 right-4 top-full z-40 mt-0.5 max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {results.map((c, i) => (
                        <li key={c.id} role="option" aria-selected={i === active}>
                            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(c)} onMouseEnter={() => setActive(i)}
                                className={`flex w-full items-center gap-3 px-3 py-2 text-left ${i === active ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                                    {`${c.firstName?.[0] ?? ''}${c.lastName?.[0] ?? ''}`.toUpperCase() || '@'}
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">{displayName(c)}</span>
                                    <span className="block truncate text-xs text-gray-500">{c.email}</span>
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ─── preview ────────────────────────────────────────────────────

export function EmailFrame({ html, title, className = '' }: { html: string; title: string; className?: string }) {
    // sandbox without scripts: the body is already sanitised server-side, this is belt and braces
    return <iframe title={title} srcDoc={html} sandbox="allow-popups allow-popups-to-escape-sandbox" className={`w-full border-0 bg-[#f6f7f9] ${className}`} />;
}

function PreviewDialog({ open, onClose, subject, html, branded, recipient }: {
    open: boolean; onClose: () => void; subject: string; html: string; branded: boolean; recipient: Chip | null;
}) {
    if (!open) return null;
    const values = recipient ? mergeValuesFor(recipient.email, recipient.name) : null;
    const doc = renderEmailDocument(personalise(html, values, true), { branded, subject });
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/60 p-2 sm:p-6" onMouseDown={onClose}>
            <div role="dialog" aria-modal="true" aria-label="Email preview" onMouseDown={(e) => e.stopPropagation()}
                className="flex h-full max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-3.5 dark:border-gray-700">
                    <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-gray-900 dark:text-white">{personalise(subject, values, false) || '(no subject)'}</p>
                        <p className="text-xs text-gray-500">{recipient ? `As ${recipient.name || recipient.email} will see it` : 'Add a recipient to see personalisation filled in'}</p>
                    </div>
                    <button onClick={onClose} aria-label="Close preview" className="rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button>
                </div>
                <EmailFrame html={doc} title="Email preview" className="min-h-0 flex-1" />
            </div>
        </div>
    );
}

// ─── the composer ───────────────────────────────────────────────

interface Props {
    /** an existing draft to continue, or null for a new message */
    draftId: string | null;
    seed?: ComposerSeed;
    onClose: () => void;
    onSent?: (m: EmailMessage) => void;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function EmailComposer({ draftId, seed, onClose, onSent }: Props) {
    const me = useAuthStore((s) => s.user);
    const { save, send, test, remove } = useEmailMutations();
    const { data: draft, isLoading } = useEmail(draftId);

    const [to, setTo] = useState<Chip[]>(seed?.recipients ?? []);
    const [cc, setCc] = useState<Chip[]>([]);
    const [bcc, setBcc] = useState<Chip[]>([]);
    const [showCc, setShowCc] = useState(false);
    const [showBcc, setShowBcc] = useState(false);
    const [subject, setSubject] = useState(seed?.subject ?? '');
    const [html, setHtml] = useState('');
    const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
    const [branded, setBranded] = useState(true);
    const [marketing, setMarketing] = useState(false);
    const [uploading, setUploading] = useState<string[]>([]);
    const [saveState, setSaveState] = useState<SaveState>('idle');
    const [preview, setPreview] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [editorKey, setEditorKey] = useState(0);
    const [loadingAll, setLoadingAll] = useState(false);
    const [busy, setBusy] = useState<'send' | 'test' | 'discard' | null>(null);

    const idRef = useRef<string | null>(draftId);
    const closed = useRef(false);
    const hydrated = useRef(!draftId);
    const dirty = useRef(false);
    const queue = useRef<Promise<unknown>>(Promise.resolve());
    const fileInput = useRef<HTMLInputElement>(null);

    // load an existing draft once
    useEffect(() => {
        if (!draft || hydrated.current) return;
        hydrated.current = true;
        setTo(draft.recipients.map((r) => ({ email: r.email, name: r.name ?? undefined, customerId: r.customerId ?? undefined, marketingOptOut: r.marketingOptOut })));
        setCc(draft.cc.map((email) => ({ email })));
        setBcc(draft.bcc.map((email) => ({ email })));
        setShowCc(draft.cc.length > 0);
        setShowBcc(draft.bcc.length > 0);
        setSubject(draft.subject);
        setHtml(draft.html);
        setEditorKey((k) => k + 1);
        setAttachments(draft.attachments ?? []);
        setBranded(draft.branded);
        setMarketing(draft.marketing);
        setSaveState('saved');
    }, [draft]);

    const payload = useCallback((): SaveEmailPayload => ({
        subject,
        html,
        recipients: to.map(({ email, name, customerId }) => ({ email, ...(name ? { name } : {}), ...(customerId ? { customerId } : {}) })),
        cc: cc.map((c) => c.email),
        bcc: bcc.map((c) => c.email),
        attachments,
        branded,
        marketing,
    }), [subject, html, to, cc, bcc, attachments, branded, marketing]);

    const payloadRef = useRef(payload);
    useLayoutEffect(() => { payloadRef.current = payload; }, [payload]);

    const hasContent = () => {
        const p = payloadRef.current();
        return !!(p.subject?.trim() || p.html?.trim() || p.recipients?.length || p.attachments?.length);
    };

    /** Saves are queued so a create never races a later update. */
    const persist = useCallback(() => {
        const run = async () => {
            if (closed.current || (!dirty.current && idRef.current)) return idRef.current;
            if (!idRef.current && !hasContent()) return null;
            dirty.current = false;
            setSaveState('saving');
            try {
                const m = await save.mutateAsync({ id: idRef.current, dto: payloadRef.current() });
                idRef.current = m.id;
                // flag opted-out customers once the server has matched addresses to customers
                const optOut = new Set(m.recipients.filter((r) => r.marketingOptOut).map((r) => r.email));
                setTo((prev) => prev.map((c) => (optOut.has(c.email) === !!c.marketingOptOut ? c : { ...c, marketingOptOut: optOut.has(c.email) })));
                setSaveState('saved');
                return m.id;
            } catch (e) {
                dirty.current = true;
                setSaveState('error');
                throw e;
            }
        };
        const next = queue.current.catch(() => undefined).then(run);
        queue.current = next;
        return next;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // autosave a moment after the last change
    const snapshot = useMemo(() => JSON.stringify(payload()), [payload]);
    const first = useRef(true);
    useEffect(() => {
        if (!hydrated.current) return;
        if (first.current) { first.current = false; return; }
        dirty.current = true;
        setSaveState((s) => (s === 'saving' ? s : 'idle'));
        const t = setTimeout(() => { persist().catch(() => undefined); }, 1500);
        return () => clearTimeout(t);
    }, [snapshot, persist]);

    const close = async () => {
        if (dirty.current && hasContent()) {
            try {
                await persist();
                toast.success('Draft saved');
            } catch (e) {
                toast.error(errMsg(e, "Couldn't save the draft"));
                return;
            }
        }
        onClose();
    };

    const addAttachments = async (files: File[]) => {
        const room = 10 - attachments.length;
        if (files.length > room) toast.error('Up to 10 attachments per email');
        for (const file of files.slice(0, Math.max(0, room))) {
            if (file.size > MAX_ATTACHMENT_BYTES) {
                toast.error(`${file.name} is larger than 10 MB`);
                continue;
            }
            setUploading((u) => [...u, file.name]);
            try {
                const a = await uploadAttachment(file);
                setAttachments((prev) => [...prev, a]);
            } catch (e) {
                toast.error(errMsg(e, `Couldn't attach ${file.name}`));
            } finally {
                setUploading((u) => u.filter((n) => n !== file.name));
            }
        }
    };

    const addAllCustomers = async () => {
        setLoadingAll(true);
        try {
            const found: Chip[] = [];
            for (let page = 1; found.length < MAX_RECIPIENTS; page++) {
                const res: CustomerListResponse = await apiClient.get('/customers', { page, limit: 100, isActive: true });
                found.push(...res.data.map((c) => ({ email: c.email.toLowerCase(), name: displayName(c), customerId: c.id })));
                if (page >= res.meta.totalPages || !res.data.length) break;
            }
            const seen = new Set(to.map((c) => c.email));
            const merged = [...to, ...found.filter((c) => !seen.has(c.email) && seen.add(c.email))].slice(0, MAX_RECIPIENTS);
            setTo(merged);
            toast.success(`${merged.length - to.length} customers added${merged.length >= MAX_RECIPIENTS ? ` (limit ${MAX_RECIPIENTS} per email)` : ''}`);
        } catch (e) {
            toast.error(errMsg(e, "Couldn't load customers"));
        } finally {
            setLoadingAll(false);
        }
    };

    const problems = () => {
        if (!to.length) return 'Add at least one recipient.';
        if (to.length > MAX_RECIPIENTS) return `An email can go to at most ${MAX_RECIPIENTS} people.`;
        if (!subject.trim()) return 'Add a subject.';
        if (!html.replace(/<[^>]+>/g, '').trim() && !/<img\s/i.test(html)) return 'Write a message before sending.';
        if (uploading.length) return 'Wait for attachments to finish uploading.';
        return null;
    };

    const doSend = async () => {
        const problem = problems();
        if (problem) return toast.error(problem);
        const optedOut = marketing ? to.filter((c) => c.marketingOptOut).length : 0;
        setBusy('send');
        try {
            dirty.current = true;
            const id = await persist();
            if (!id) throw new Error("Couldn't save the email");
            const m = await send.mutateAsync(id);
            toast.success(`Sending to ${to.length - optedOut} ${to.length - optedOut === 1 ? 'person' : 'people'}${optedOut ? ` · ${optedOut} opted out, skipped` : ''}`);
            onSent?.(m);
            onClose();
        } catch (e) {
            toast.error(errMsg(e, "Couldn't send the email"));
        } finally {
            setBusy(null);
        }
    };

    const doTest = async () => {
        if (!subject.trim() || (!html.replace(/<[^>]+>/g, '').trim() && !/<img\s/i.test(html))) return toast.error('Add a subject and a message first.');
        setBusy('test');
        try {
            const r = await test.mutateAsync(payload());
            toast.success(`Test sent to ${r.to}`);
        } catch (e) {
            toast.error(errMsg(e, "Couldn't send the test"));
        } finally {
            setBusy(null);
        }
    };

    const discard = async () => {
        setBusy('discard');
        closed.current = true;
        try {
            await queue.current.catch(() => undefined);
            if (idRef.current) await remove.mutateAsync(idRef.current);
            dirty.current = false;
            toast.success('Draft discarded');
            onClose();
        } catch (e) {
            closed.current = false;
            toast.error(errMsg(e, "Couldn't discard the draft"));
        } finally {
            setBusy(null);
        }
    };

    // Ctrl/Cmd+Enter sends, Esc closes (saving the draft)
    const closeRef = useRef(close);
    const sendRef = useRef(doSend);
    useLayoutEffect(() => {
        closeRef.current = close;
        sendRef.current = doSend;
    });
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void sendRef.current(); }
            if (e.key === 'Escape' && !preview && !document.querySelector('[aria-expanded="true"]')) void closeRef.current();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [preview]);

    const readOnly = !!draft && draft.status !== 'DRAFT';
    const optedOutCount = to.filter((c) => c.marketingOptOut).length;
    const saveLabel = { idle: '', saving: 'Saving…', saved: 'Draft saved', error: "Couldn't save" }[saveState];

    return (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-gray-950/40 sm:items-center sm:p-4">
            <div role="dialog" aria-modal="true" aria-label="New message"
                className={`flex w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-gray-800 sm:rounded-xl ${expanded ? 'sm:h-[96vh] sm:max-w-[1200px]' : 'sm:h-[88vh] sm:max-w-4xl'}`}>
                {/* title bar */}
                <div className="flex items-center justify-between gap-2 bg-gray-100 px-4 py-2.5 dark:bg-gray-900">
                    <h2 className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{subject.trim() || 'New message'}</h2>
                    <div className="flex items-center gap-1">
                        <span className={`mr-2 text-xs ${saveState === 'error' ? 'text-rose-600' : 'text-gray-500'}`} aria-live="polite">{saveLabel}</span>
                        <button type="button" onClick={() => setExpanded((v) => !v)} aria-label={expanded ? 'Exit full screen' : 'Full screen'}
                            className="hidden rounded p-1 text-gray-500 hover:bg-gray-200 sm:block dark:hover:bg-gray-700">
                            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </button>
                        <button type="button" onClick={() => void close()} aria-label="Save & close" title="Save & close"
                            className="rounded p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-4 w-4" /></button>
                    </div>
                </div>

                {isLoading && draftId ? (
                    <div className="flex flex-1 items-center justify-center text-gray-400"><LoaderCircle className="h-6 w-6 animate-spin" /></div>
                ) : (
                    <>
                        <AddressField label="To" chips={to} onChange={setTo} lookup disabled={readOnly} autoFocus={!to.length}
                            extra={
                                <div className="flex shrink-0 items-center gap-2 pt-1 text-sm text-gray-500">
                                    <button type="button" onClick={addAllCustomers} disabled={loadingAll || readOnly} title="Add every active customer"
                                        className="inline-flex items-center gap-1 hover:text-gray-900 disabled:opacity-50 dark:hover:text-white">
                                        {loadingAll ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
                                        <span className="hidden sm:inline">All customers</span>
                                    </button>
                                    {!showCc && <button type="button" onClick={() => setShowCc(true)} className="hover:text-gray-900 hover:underline dark:hover:text-white">Cc</button>}
                                    {!showBcc && <button type="button" onClick={() => setShowBcc(true)} className="hover:text-gray-900 hover:underline dark:hover:text-white">Bcc</button>}
                                </div>
                            } />
                        {showCc && <AddressField label="Cc" chips={cc} onChange={setCc} disabled={readOnly} />}
                        {showBcc && <AddressField label="Bcc" chips={bcc} onChange={setBcc} disabled={readOnly} />}
                        {to.length > 1 && (
                            <p className="border-b border-gray-100 bg-blue-50/60 px-4 py-1.5 text-xs text-blue-800 dark:border-gray-700 dark:bg-blue-900/10 dark:text-blue-200">
                                Each of the {to.length} recipients gets their own copy — they won&apos;t see each other&apos;s addresses.
                                {marketing && optedOutCount > 0 && <> <strong>{optedOutCount}</strong> opted out of marketing emails and will be skipped.</>}
                                {cc.length + bcc.length > 0 && <> Cc and Bcc are copied on every one of them.</>}
                            </p>
                        )}
                        <div className="border-b border-gray-100 px-4 dark:border-gray-700">
                            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" aria-label="Subject" maxLength={250} disabled={readOnly}
                                className="w-full bg-transparent py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100" />
                        </div>

                        <RichTextEditor key={editorKey} value={html} onChange={setHtml} editable={!readOnly} />

                        {(attachments.length > 0 || uploading.length > 0) && (
                            <div className="flex flex-wrap gap-2 border-t border-gray-100 px-4 py-2.5 dark:border-gray-700">
                                {attachments.map((a) => (
                                    <span key={a.url} className="inline-flex max-w-[260px] items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700/50">
                                        <FileText className="h-4 w-4 shrink-0 text-rose-500" />
                                        <a href={a.url} target="_blank" rel="noreferrer" className="truncate font-medium text-blue-700 hover:underline dark:text-blue-300">{a.name}</a>
                                        <span className="shrink-0 text-gray-400">{fmtSize(a.size)}</span>
                                        {!readOnly && (
                                            <button type="button" aria-label={`Remove ${a.name}`} onClick={() => setAttachments((p) => p.filter((x) => x.url !== a.url))}
                                                className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-600"><X className="h-3 w-3" /></button>
                                        )}
                                    </span>
                                ))}
                                {uploading.map((n) => (
                                    <span key={n} className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-2.5 py-1.5 text-xs text-gray-500">
                                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> {n}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* action bar */}
                        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-700">
                            <button type="button" onClick={doSend} disabled={!!busy || readOnly} title="Send (Ctrl+Enter)"
                                className="inline-flex h-9 items-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">
                                {busy === 'send' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
                            </button>
                            <button type="button" onClick={() => fileInput.current?.click()} disabled={readOnly || attachments.length >= 10} title="Attach files"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700">
                                <Paperclip className="h-4 w-4" />
                            </button>
                            <input ref={fileInput} type="file" multiple hidden onChange={(e) => { void addAttachments(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
                            <button type="button" onClick={() => setPreview(true)} title="Preview"
                                className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                                <Eye className="h-4 w-4" /> Preview
                            </button>
                            <button type="button" onClick={doTest} disabled={!!busy} title={me?.email ? `Send a test copy to ${me.email}` : 'Send a test copy to yourself'}
                                className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700">
                                {busy === 'test' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5 -rotate-12" />} Send test to me
                            </button>

                            <div className="ml-auto flex items-center gap-4">
                                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300" title="Wrap the message in the Genesis header and footer">
                                    <input type="checkbox" checked={branded} onChange={(e) => setBranded(e.target.checked)} disabled={readOnly} className="h-3.5 w-3.5 accent-blue-600" />
                                    Genesis design
                                </label>
                                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300" title="Promotions and newsletters — customers who opted out of marketing emails are skipped">
                                    <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} disabled={readOnly} className="h-3.5 w-3.5 accent-blue-600" />
                                    Marketing
                                </label>
                                <button type="button" onClick={discard} disabled={!!busy || readOnly} title="Discard draft" aria-label="Discard draft"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-rose-600 disabled:opacity-40 dark:hover:bg-gray-700">
                                    {busy === 'discard' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
            <PreviewDialog open={preview} onClose={() => setPreview(false)} subject={subject} html={html} branded={branded} recipient={to[0] ?? null} />
        </div>
    );
}
