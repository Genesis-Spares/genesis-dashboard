import { apiClient } from '@/lib/api/client';

export interface FlashSaleProductLite {
    id: string;
    name: string;
    sku: string;
    price: number;
    images?: { url: string; isPrimary?: boolean }[];
}

export interface FlashSaleItemAdmin {
    productId: string;
    salePrice?: number | null;
    order: number;
    product: FlashSaleProductLite | null;
}

export interface FlashSaleAdmin {
    config: { id: string; isActive: boolean; title: string; endsAt: string | null };
    items: FlashSaleItemAdmin[];
}

export const flashSaleApi = {
    get: (): Promise<FlashSaleAdmin> => apiClient.get<FlashSaleAdmin>('/flash-sale'),
    updateConfig: (body: { isActive?: boolean; title?: string; endsAt?: string | null }) =>
        apiClient.patch<any>('/flash-sale', body),
    addItem: (productId: string, salePrice?: number) =>
        apiClient.post<any>('/flash-sale/items', { productId, salePrice }),
    removeItem: (productId: string) => apiClient.delete<any>(`/flash-sale/items/${productId}`),
};
