'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Copy, FileText, Inbox, LoaderCircle, Mail, Paperclip, Pencil, Search, Send, Trash2 } from 'lucide-react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { errMsg } from '@/features/orders/components/OrderDialogs';
import { EmailFolder, EmailListItem, EmailMessage, EmailStatus, RecipientStatus } from '../api/emails.api';
import { useEmail, useEmailMutations, useEmails } from '../hooks/useEmails';
import { ComposerSeed, EmailComposer, EmailFrame } from './EmailComposer';
import { renderEmailDocument } from './emailPreview';

export const STATUS_STYLE: Record<EmailStatus | RecipientStatus, { label: string; cls: string }> = {
    DRAFT: { label: 'Draft', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
    SENDING: { label: 'Sending…', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    SENT: { label: 'Sent', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    PARTIAL: { label: 'Partly sent', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    FAILED: { label: 'Failed', cls: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
    PENDING: { label: 'Queued', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    SKIPPED: { label: 'Skipped', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
};

export function StatusPill({ status }: { status: EmailStatus | RecipientStatus }) {
    const s = STATUS_STYLE[status] ?? STATUS_STYLE.DRAFT;
    return <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>{s.label}</span>;
}

/** Gmail-style: time today, "12 Sep" this year, full date otherwise. */
export function shortDate(iso?: string | null) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const longDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

function recipientsLabel(m: EmailListItem) {
    if (!m.recipientCount) return '(no recipients)';
    const more = m.recipientCount - m.recipientPreview.length;
    return `${m.recipientPreview.join(', ')}${more > 0 ? ` +${more}` : ''}`;
}

// ─── list ───────────────────────────────────────────────────────

function EmailRow({ m, folder, onOpen }: { m: EmailListItem; folder: EmailFolder; onOpen: () => void }) {
    const problem = m.counts.failed > 0;
    return (
        <>
            <button type="button" onClick={onOpen}
                className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-0.5 px-4 py-3 text-left transition hover:bg-gray-50 sm:grid-cols-[200px_1fr_auto] dark:hover:bg-gray-800/60">
                <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {folder === 'drafts' && <span className="mr-1 text-rose-600">Draft</span>}
                    <span className="text-gray-500 dark:text-gray-400">To: </span>{recipientsLabel(m)}
                </span>
                <span className="order-3 col-span-2 flex min-w-0 items-center gap-2 text-sm sm:order-none sm:col-span-1">
                    <span className="truncate">
                        <span className="font-medium text-gray-900 dark:text-white">{m.subject || '(no subject)'}</span>
                        {m.snippet && <span className="text-gray-500 dark:text-gray-400"> — {m.snippet}</span>}
                    </span>
                    {(m.attachments?.length ?? 0) > 0 && <Paperclip className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-label="Has attachments" />}
                </span>
                <span className="flex items-center justify-end gap-2 whitespace-nowrap text-xs text-gray-500">
                    {folder === 'sent' && (m.status !== 'SENT' || problem) && <StatusPill status={m.status} />}
                    {shortDate(folder === 'drafts' ? m.updatedAt : m.sentAt)}
                </span>
            </button>
        </>
    );
}

// ─── sent email ─────────────────────────────────────────────────

function SentEmail({ id, onBack, onReuse, canCreate }: { id: string; onBack: () => void; onReuse: (m: EmailMessage) => void; canCreate: boolean }) {
    const { data: m, isLoading, error } = useEmail(id);
    const { duplicate } = useEmailMutations();
    const [showAll, setShowAll] = useState(false);

    if (isLoading) return <div className="flex justify-center py-16 text-gray-400"><LoaderCircle className="h-6 w-6 animate-spin" /></div>;
    if (error || !m) return <p className="px-4 py-10 text-center text-sm text-gray-500">{errMsg(error, "This email couldn't be loaded.")}</p>;

    const counts = {
        sent: m.recipients.filter((r) => r.status === 'SENT').length,
        failed: m.recipients.filter((r) => r.status === 'FAILED').length,
        skipped: m.recipients.filter((r) => r.status === 'SKIPPED').length,
        pending: m.recipients.filter((r) => r.status === 'PENDING').length,
    };
    // show problems first
    const order: Record<RecipientStatus, number> = { FAILED: 0, SKIPPED: 1, PENDING: 2, SENT: 3 };
    const recipients = [...m.recipients].sort((a, b) => order[a.status] - order[b.status]);
    const visible = showAll ? recipients : recipients.slice(0, 8);

    const reuse = async () => {
        try {
            onReuse(await duplicate.mutateAsync(m.id));
        } catch (e) {
            toast.error(errMsg(e, "Couldn't copy this email"));
        }
    };

    return (
        <div>
            <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
                <button type="button" onClick={onBack} aria-label="Back to Sent" className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="h-4 w-4" /></button>
                {canCreate && (
                    <button type="button" onClick={reuse} disabled={duplicate.isPending}
                        className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
                        {duplicate.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />} Use again
                    </button>
                )}
            </div>
            <div className="space-y-5 px-4 py-5 sm:px-6">
                <div className="flex flex-wrap items-start gap-3">
                    <h2 className="min-w-0 flex-1 text-xl font-semibold text-gray-900 dark:text-white">{m.subject}</h2>
                    <StatusPill status={m.status} />
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
                    <span>From {m.createdByEmail ?? 'staff'}</span>
                    <span>{longDate(m.sentAt)}</span>
                    {m.marketing && <span>Marketing email</span>}
                </div>

                <section className="rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-gray-100 px-4 py-2.5 text-sm dark:border-gray-800">
                        <span className="font-medium text-gray-900 dark:text-white">{m.recipients.length} recipient{m.recipients.length === 1 ? '' : 's'}</span>
                        <span className="text-emerald-600">{counts.sent} delivered</span>
                        {counts.pending > 0 && <span className="text-blue-600">{counts.pending} sending</span>}
                        {counts.failed > 0 && <span className="text-rose-600">{counts.failed} failed</span>}
                        {counts.skipped > 0 && <span className="text-gray-500">{counts.skipped} skipped</span>}
                        {(m.cc.length > 0 || m.bcc.length > 0) && (
                            <span className="text-gray-500">{[m.cc.length && `Cc ${m.cc.join(', ')}`, m.bcc.length && `Bcc ${m.bcc.join(', ')}`].filter(Boolean).join(' · ')}</span>
                        )}
                    </div>
                    <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                        {visible.map((r) => (
                            <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-4 py-2 text-sm">
                                <span className="min-w-0 flex-1 truncate">
                                    <span className="text-gray-900 dark:text-gray-100">{r.name || r.email}</span>
                                    {r.name && <span className="text-gray-400"> &lt;{r.email}&gt;</span>}
                                </span>
                                {r.error && <span className="w-full text-xs text-gray-500 sm:order-none sm:w-auto">{r.error}</span>}
                                <StatusPill status={r.status} />
                            </li>
                        ))}
                    </ul>
                    {recipients.length > 8 && (
                        <button type="button" onClick={() => setShowAll((v) => !v)} className="w-full border-t border-gray-100 py-2 text-xs font-medium text-blue-600 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800">
                            {showAll ? 'Show fewer' : `Show all ${recipients.length}`}
                        </button>
                    )}
                </section>

                {(m.attachments?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {m.attachments!.map((a) => (
                            <a key={a.url} href={a.url} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
                                <FileText className="h-4 w-4 text-rose-500" /> {a.name}
                            </a>
                        ))}
                    </div>
                )}

                <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900">
                        Message as written — personalisation like {'{{firstName}}'} was filled in for each person.
                    </p>
                    <EmailFrame html={renderEmailDocument(m.html, { branded: m.branded, subject: m.subject })} title="Sent message" className="h-[560px]" />
                </div>
            </div>
        </div>
    );
}

// ─── panel ──────────────────────────────────────────────────────

type ComposerState = { draftId: string | null; seed?: ComposerSeed } | null;

export function EmailsPanel() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const { can } = usePermissions();
    const canCreate = can({ permission: 'message:create' });

    const [folder, setFolder] = useState<EmailFolder>('sent');
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [openId, setOpenId] = useState<string | null>(params.get('open'));
    const [composer, setComposer] = useState<ComposerState>(null);

    const { data, isLoading, isFetching } = useEmails(folder, query, page);
    const { remove } = useEmailMutations();

    useEffect(() => {
        const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300);
        return () => clearTimeout(t);
    }, [search]);

    // ?open=<id> deep links (from a customer's profile)
    const openEmail = (id: string | null) => {
        setOpenId(id);
        const next = new URLSearchParams(params.toString());
        if (id) next.set('open', id); else next.delete('open');
        router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false });
    };

    const switchFolder = (f: EmailFolder) => {
        setFolder(f);
        setPage(1);
        openEmail(null);
    };

    const drafts = data?.meta.drafts ?? 0;
    const rows = data?.data ?? [];

    return (
        <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
            <nav className="flex gap-2 lg:flex-col" aria-label="Email folders">
                {canCreate && (
                    <button type="button" onClick={() => setComposer({ draftId: null })}
                        className="inline-flex h-12 items-center gap-3 rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 lg:mb-2">
                        <Pencil className="h-4 w-4" /> Compose
                    </button>
                )}
                {([['sent', 'Sent', Send], ['drafts', 'Drafts', FileText]] as const).map(([f, label, Icon]) => (
                    <button key={f} type="button" onClick={() => switchFolder(f)} aria-current={folder === f}
                        className={`inline-flex h-10 items-center gap-3 rounded-full px-4 text-sm transition ${folder === f
                            ? 'bg-blue-50 font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}>
                        <Icon className="h-4 w-4" />
                        <span className="flex-1 text-left">{label}</span>
                        {f === 'drafts' && drafts > 0 && <span className="text-xs">{drafts}</span>}
                    </button>
                ))}
            </nav>

            <div className="min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
                {openId ? (
                    <SentEmail id={openId} canCreate={canCreate} onBack={() => openEmail(null)}
                        onReuse={(m) => { openEmail(null); setComposer({ draftId: m.id }); }} />
                ) : (
                    <>
                        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${folder === 'sent' ? 'sent emails' : 'drafts'} by subject or recipient`}
                                    aria-label="Search emails"
                                    className="h-9 w-full rounded-full bg-gray-100 pl-9 pr-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500/30 dark:bg-gray-800 dark:text-gray-100" />
                            </div>
                            {isFetching && !isLoading && <LoaderCircle className="h-4 w-4 animate-spin text-gray-400" />}
                            {data && data.meta.total > 0 && (
                                <span className="hidden text-xs text-gray-500 sm:block">
                                    {(page - 1) * data.meta.limit + 1}–{Math.min(page * data.meta.limit, data.meta.total)} of {data.meta.total}
                                </span>
                            )}
                            {data && data.meta.totalPages > 1 && (
                                <div className="flex">
                                    <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Newer"
                                        className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800">‹</button>
                                    <button type="button" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Older"
                                        className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800">›</button>
                                </div>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-16 text-gray-400"><LoaderCircle className="h-6 w-6 animate-spin" /></div>
                        ) : rows.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
                                {folder === 'sent' ? <Mail className="h-10 w-10 text-gray-300" /> : <Inbox className="h-10 w-10 text-gray-300" />}
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {query ? 'No emails match your search' : folder === 'sent' ? 'No emails sent yet' : 'No drafts'}
                                </p>
                                {!query && folder === 'sent' && canCreate && (
                                    <p className="max-w-sm text-sm text-gray-500">Write to one customer or many — each person gets their own personalised copy.</p>
                                )}
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                                {rows.map((m) => (
                                    <li key={m.id} className="group relative">
                                        <EmailRow m={m} folder={folder} onOpen={() => (folder === 'drafts' ? setComposer({ draftId: m.id }) : openEmail(m.id))} />
                                        {folder === 'drafts' && canCreate && (
                                            <button type="button" aria-label="Discard draft" title="Discard draft"
                                                onClick={async () => {
                                                    try { await remove.mutateAsync(m.id); toast.success('Draft discarded'); } catch (e) { toast.error(errMsg(e, "Couldn't discard")); }
                                                }}
                                                className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white p-2 text-gray-500 shadow-sm hover:text-rose-600 group-hover:block dark:bg-gray-800">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </div>

            {composer && (
                <EmailComposer key={composer.draftId ?? 'new'} draftId={composer.draftId} seed={composer.seed}
                    onClose={() => setComposer(null)}
                    onSent={(m) => { setFolder('sent'); setPage(1); openEmail(m.id); }} />
            )}
        </div>
    );
}
