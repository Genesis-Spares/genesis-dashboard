import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { returnsApi } from '../api/returns.api';
import { ReturnStatus } from '@/types/return.types';

const keys = { all: ['returns'] as const };

export const useReturns = (params?: { status?: ReturnStatus; search?: string; page?: number; limit?: number }, options?: { enabled?: boolean }) =>
    useQuery({ queryKey: [...keys.all, 'list', params], queryFn: () => returnsApi.list(params), placeholderData: keepPreviousData, enabled: options?.enabled ?? true });

export const useRefundsDue = (options?: { enabled?: boolean }) =>
    useQuery({ queryKey: [...keys.all, 'refunds-due'], queryFn: () => returnsApi.refundsDue(), enabled: options?.enabled ?? true });

type Action =
    | { kind: 'approve'; id: string; instructions?: string }
    | { kind: 'reject'; id: string; reason: string }
    | { kind: 'receive'; id: string; restock: boolean; note?: string }
    | { kind: 'refund'; id: string; amount: number; note?: string };

export const useReturnAction = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (a: Action) =>
            a.kind === 'approve' ? returnsApi.approve(a.id, a.instructions)
                : a.kind === 'reject' ? returnsApi.reject(a.id, a.reason)
                    : a.kind === 'receive' ? returnsApi.receive(a.id, a.restock, a.note)
                        : returnsApi.refund(a.id, a.amount, a.note),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.all });
            qc.invalidateQueries({ queryKey: ['orders'] });
            qc.invalidateQueries({ queryKey: ['products'] });
        },
    });
};
