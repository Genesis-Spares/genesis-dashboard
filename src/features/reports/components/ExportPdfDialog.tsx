'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { Btn, Modal, fieldCls, labelCls } from '@/features/orders/components/OrderDialogs';
import { useAuthStore } from '@/lib/stores/authStore';
import { ReportRange } from '@/types/report.types';
import { reportsApi } from '../api/reports.api';
import type { ReportSection } from '../pdf/ReportDocument';

const SECTIONS: { id: ReportSection; label: string; hint: string }[] = [
    { id: 'summary', label: 'Summary', hint: 'Key figures, revenue chart, profit and loss, payment methods' },
    { id: 'products', label: 'Sales by product', hint: 'Units, revenue, cost, profit and margin per product' },
    { id: 'categories', label: 'Sales by category', hint: 'Revenue and profit per category' },
    { id: 'brands', label: 'Sales by brand', hint: 'Revenue and profit per brand' },
    { id: 'slow', label: 'Slow movers', hint: 'Stock that did not sell and the money tied up' },
    { id: 'customers', label: 'Customer lifetime value', hint: 'Top customers and repeat-purchase rate' },
];

export function ExportPdfDialog({ range, fromDay, toDay, onClose }: { range: ReportRange; fromDay: string; toDay: string; onClose: () => void }) {
    const qc = useQueryClient();
    const email = useAuthStore((st) => st.user?.email);
    const [sections, setSections] = useState<ReportSection[]>(SECTIONS.map((x) => x.id));
    const [productLimit, setProductLimit] = useState('50');
    const [customerLimit, setCustomerLimit] = useState('50');
    const [busy, setBusy] = useState<'download' | 'print' | null>(null);

    const toggle = (id: ReportSection) => setSections((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : SECTIONS.map((x) => x.id).filter((x) => x === id || cur.includes(x))));

    const build = async () => {
        const climit = Number(customerLimit);
        const [overview, products, customers, { pdf }, { ReportDocument }] = await Promise.all([
            qc.fetchQuery({ queryKey: ['reports', 'overview', range], queryFn: () => reportsApi.overview(range), staleTime: 60_000 }),
            qc.fetchQuery({ queryKey: ['reports', 'products', range], queryFn: () => reportsApi.products(range), staleTime: 60_000 }),
            sections.includes('customers')
                ? qc.fetchQuery({ queryKey: ['reports', 'customers', range, climit], queryFn: () => reportsApi.customers({ ...range, limit: climit }), staleTime: 60_000 })
                : Promise.resolve(undefined),
            import('@react-pdf/renderer'),
            import('../pdf/ReportDocument'),
        ]);
        const doc = (
            <ReportDocument overview={overview} products={products} customers={customers} sections={sections}
                productLimit={productLimit === 'all' ? null : Number(productLimit)} fromDay={fromDay} toDay={toDay}
                generatedBy={email} generatedAt={new Date()} />
        );
        return pdf(doc).toBlob();
    };

    const filename = `genesis-sales-report_${fromDay}_to_${toDay}.pdf`;

    const download = async () => {
        setBusy('download');
        try {
            const url = URL.createObjectURL(await build());
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
            toast.success('Report downloaded');
            onClose();
        } catch (e) {
            console.error(e);
            toast.error('Could not create the PDF. Please try again.');
        } finally {
            setBusy(null);
        }
    };

    // open the tab now (inside the click) so pop-up blockers allow it, then load the PDF into it
    const print = async () => {
        const tab = window.open('', '_blank');
        if (tab) tab.document.write('<p style="font:14px system-ui;padding:24px;color:#555">Preparing report…</p>');
        setBusy('print');
        try {
            const url = URL.createObjectURL(await build());
            if (tab) {
                tab.location.href = url;
            } else {
                // pop-ups blocked: fall back to downloading rather than leaving the dashboard
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                toast('Pop-ups are blocked, so the report was downloaded instead.');
            }
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
            onClose();
        } catch (e) {
            console.error(e);
            tab?.close();
            toast.error('Could not create the PDF. Please try again.');
        } finally {
            setBusy(null);
        }
    };

    const none = !sections.length;

    return (
        <Modal open onClose={onClose} title="Export report as PDF" subtitle={`A4 report for ${new Date(`${fromDay}T00:00:00`).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })} – ${new Date(`${toDay}T00:00:00`).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}`}
            footer={<>
                <Btn onClick={onClose} disabled={!!busy}>Cancel</Btn>
                <Btn onClick={print} disabled={none || !!busy}><PrinterIcon className="h-4 w-4" /> {busy === 'print' ? 'Preparing…' : 'Open & print'}</Btn>
                <Btn tone="primary" onClick={download} disabled={none || !!busy}><ArrowDownTrayIcon className="h-4 w-4" /> {busy === 'download' ? 'Preparing…' : 'Download PDF'}</Btn>
            </>}>
            <fieldset>
                <legend className={labelCls}>Sections to include</legend>
                <div className="mt-1 divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
                    {SECTIONS.map((x) => (
                        <label key={x.id} className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <input type="checkbox" checked={sections.includes(x.id)} onChange={() => toggle(x.id)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600" />
                            <span>
                                <span className="block text-sm font-medium text-gray-900 dark:text-white">{x.label}</span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400">{x.hint}</span>
                            </span>
                        </label>
                    ))}
                </div>
                {none && <p className="mt-1.5 text-xs text-rose-600">Choose at least one section.</p>}
            </fieldset>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className={labelCls} htmlFor="pdf-products">Products to list</label>
                    <select id="pdf-products" className={fieldCls} value={productLimit} onChange={(e) => setProductLimit(e.target.value)} disabled={!sections.includes('products')}>
                        <option value="25">Top 25</option><option value="50">Top 50</option><option value="100">Top 100</option><option value="all">All products</option>
                    </select>
                </div>
                <div>
                    <label className={labelCls} htmlFor="pdf-customers">Customers to list</label>
                    <select id="pdf-customers" className={fieldCls} value={customerLimit} onChange={(e) => setCustomerLimit(e.target.value)} disabled={!sections.includes('customers')}>
                        <option value="25">Top 25</option><option value="50">Top 50</option><option value="100">Top 100</option><option value="500">Top 500</option>
                    </select>
                </div>
            </div>
        </Modal>
    );
}
