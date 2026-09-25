import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory.api';

const K = ['inventory'] as const;

export const useStockLevels = (p: Parameters<typeof inventoryApi.levels>[0]) =>
    useQuery({ queryKey: [...K, 'levels', p], queryFn: () => inventoryApi.levels(p), placeholderData: keepPreviousData });
export const useMovements = (p: Parameters<typeof inventoryApi.movements>[0]) =>
    useQuery({ queryKey: [...K, 'movements', p], queryFn: () => inventoryApi.movements(p), placeholderData: keepPreviousData });
export const useReceipts = (p?: Parameters<typeof inventoryApi.receipts>[0]) =>
    useQuery({ queryKey: [...K, 'receipts', p], queryFn: () => inventoryApi.receipts(p), placeholderData: keepPreviousData });
export const useSuppliers = () => useQuery({ queryKey: [...K, 'suppliers'], queryFn: () => inventoryApi.suppliers() });

/** Any stock change refreshes inventory, products and the dashboard. */
const useInvalidate = () => {
    const qc = useQueryClient();
    return () => { qc.invalidateQueries({ queryKey: K }); qc.invalidateQueries({ queryKey: ['products'] }); };
};
export const useAdjustStock = () => { const inv = useInvalidate(); return useMutation({ mutationFn: inventoryApi.adjust, onSuccess: inv }); };
export const useReceiveStock = () => { const inv = useInvalidate(); return useMutation({ mutationFn: inventoryApi.receive, onSuccess: inv }); };
export const useBulkStock = () => { const inv = useInvalidate(); return useMutation({ mutationFn: inventoryApi.bulk, onSuccess: (r) => { if (!r) return; inv(); } }); };
export const useSaveSupplier = () => { const inv = useInvalidate(); return useMutation({ mutationFn: inventoryApi.saveSupplier, onSuccess: inv }); };
