'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StockLevelsTab } from './StockLevelsTab';
import { MovementsTab } from './MovementsTab';
import { DeliveriesTab } from './DeliveriesTab';
import { ImportExportTab } from './ImportExportTab';
import { SuppliersTab } from './SuppliersTab';

type Tab = 'levels' | 'movements' | 'deliveries' | 'import' | 'suppliers';
const TABS: { id: Tab; label: string }[] = [
    { id: 'levels', label: 'Stock levels' },
    { id: 'movements', label: 'Stock history' },
    { id: 'deliveries', label: 'Deliveries' },
    { id: 'import', label: 'Import / export' },
    { id: 'suppliers', label: 'Suppliers' },
];

export function InventoryPage() {
    const params = useSearchParams();
    const initialFilter = (['low', 'out'] as const).find((f) => f === params.get('filter')) ?? 'all';
    const [tab, setTab] = useState<Tab>('levels');
    const [historyFor, setHistoryFor] = useState<{ id: string; label: string } | null>(null);

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Inventory</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Stock levels, deliveries from suppliers, adjustments and a full history of every stock change.</p>
            </div>
            <div className="flex gap-1 relative overflow-x-auto border-b border-gray-200 dark:border-gray-700">
                {TABS.map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${tab === t.id ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        {t.label}
                    </button>
                ))}
            </div>
            {tab === 'levels' && <StockLevelsTab initialFilter={initialFilter} onHistory={(p) => { setHistoryFor({ id: p.id, label: `${p.sku} · ${p.name}` }); setTab('movements'); }} />}
            {tab === 'movements' && <MovementsTab productId={historyFor?.id} productLabel={historyFor?.label} onClearProduct={() => setHistoryFor(null)} />}
            {tab === 'deliveries' && <DeliveriesTab />}
            {tab === 'import' && <ImportExportTab />}
            {tab === 'suppliers' && <SuppliersTab />}
        </div>
    );
}
