export type AdjustReason = 'COUNT' | 'DAMAGED' | 'LOST' | 'FOUND' | 'OTHER';
export type MovementReason = 'ORDER' | 'ORDER_CANCELLED' | 'ORDER_FAILED' | 'RETURN' | 'RESTOCK' | 'ADJUSTMENT';

export interface StockLevel {
    id: string;
    sku: string;
    name: string;
    brand?: string | null;
    stockQty: number;
    minStockQty?: number | null;
    reorderLevel: number;
    costPrice?: string | number | null;
    price: string | number;
    image?: string | null;
}

export interface StockLevelsResponse {
    data: StockLevel[];
    meta: { total: number; page: number; limit: number; totalPages: number };
    summary: { skus: number; units: number; stockValue: number; low: number; out: number };
}

export interface StockMovement {
    id: string;
    productId: string;
    change: number;
    stockAfter: number;
    reason: MovementReason;
    reference?: string | null;
    note?: string | null;
    actor?: string | null;
    createdAt: string;
    product?: { id: string; sku: string; name: string } | null;
}

export interface Supplier {
    id: string;
    name: string;
    contactName?: string | null;
    phone?: string | null;
    email?: string | null;
    notes?: string | null;
    isActive: boolean;
    _count?: { receipts: number };
}

export interface StockReceipt {
    id: string;
    grnNumber: string;
    supplierRef?: string | null;
    note?: string | null;
    actor?: string | null;
    totalCost: string | number;
    createdAt: string;
    supplier?: { id: string; name: string } | null;
    lines: { id: string; productId: string; sku: string; name: string; quantity: number; unitCost?: string | number | null }[];
}

export interface BulkPreviewRow {
    row: number;
    sku: string;
    quantity: number;
    unitCost?: number | null;
    productId: string | null;
    name: string | null;
    current: number | null;
    after: number | null;
    problem: string | null;
}

export interface BulkResult {
    mode: 'RECEIVE' | 'SET';
    summary: { rows: number; valid: number; invalid: number };
    preview: BulkPreviewRow[];
    grnNumber?: string;
}

export interface Paged<T> {
    data: T[];
    meta: { total: number; page: number; limit: number; totalPages: number };
}
