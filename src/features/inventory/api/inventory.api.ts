import { apiClient } from '@/lib/api/client';
import { AdjustReason, BulkResult, Paged, StockLevelsResponse, StockMovement, StockReceipt, Supplier } from '@/types/inventory.types';

export const inventoryApi = {
    levels: (p?: { filter?: 'all' | 'low' | 'out'; search?: string; page?: number; limit?: number }): Promise<StockLevelsResponse> => apiClient.get('/inventory/levels', p),
    movements: (p?: { productId?: string; reason?: string; search?: string; page?: number; limit?: number }): Promise<Paged<StockMovement>> => apiClient.get('/inventory/movements', p),
    export: (): Promise<{ sku: string; name: string; brand?: string | null; stockQty: number; minStockQty?: number | null; costPrice?: string | number | null; price: string | number }[]> => apiClient.get('/inventory/export'),
    adjust: (b: { productId: string; mode: 'CHANGE' | 'SET'; quantity: number; reason: AdjustReason; note?: string }) => apiClient.post('/inventory/adjust', b),
    receive: (b: { supplierId?: string; supplierName?: string; supplierRef?: string; note?: string; updateCost?: boolean; lines: { productId: string; quantity: number; unitCost?: number }[] }): Promise<StockReceipt> => apiClient.post('/inventory/receipts', b),
    receipts: (p?: { supplierId?: string; page?: number; limit?: number }): Promise<Paged<StockReceipt>> => apiClient.get('/inventory/receipts', p),
    bulk: (b: { mode: 'RECEIVE' | 'SET'; dryRun?: boolean; supplierName?: string; supplierRef?: string; note?: string; lines: { sku: string; quantity: number; unitCost?: number }[] }): Promise<BulkResult> => apiClient.post('/inventory/bulk', b),
    suppliers: (): Promise<Supplier[]> => apiClient.get('/inventory/suppliers'),
    saveSupplier: async (s: Partial<Supplier> & { name: string }): Promise<Supplier> => {
        const body = { name: s.name, contactName: s.contactName || undefined, phone: s.phone || undefined, email: s.email || undefined, notes: s.notes || undefined };
        return (s.id
            ? await apiClient.put(`/inventory/suppliers/${s.id}`, { ...body, isActive: s.isActive })
            : await apiClient.post('/inventory/suppliers', body)) as unknown as Supplier;
    },
};
