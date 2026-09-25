import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { flashSaleApi } from '../api/flashSale.api';

const flashSaleKey = ['flash-sale'] as const;

export const useFlashSale = () =>
    useQuery({ queryKey: flashSaleKey, queryFn: flashSaleApi.get });

export const useUpdateFlashSale = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: { isActive?: boolean; title?: string; endsAt?: string | null }) =>
            flashSaleApi.updateConfig(body),
        onSuccess: () => qc.invalidateQueries({ queryKey: flashSaleKey }),
    });
};

export const useAddFlashSaleItem = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ productId, salePrice }: { productId: string; salePrice?: number }) =>
            flashSaleApi.addItem(productId, salePrice),
        onSuccess: () => qc.invalidateQueries({ queryKey: flashSaleKey }),
    });
};

export const useRemoveFlashSaleItem = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (productId: string) => flashSaleApi.removeItem(productId),
        onSuccess: () => qc.invalidateQueries({ queryKey: flashSaleKey }),
    });
};
