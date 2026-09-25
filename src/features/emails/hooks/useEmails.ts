import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmailFolder, emailsApi, SaveEmailPayload } from '../api/emails.api';

export const emailKeys = {
    all: ['emails'] as const,
    list: (folder: EmailFolder, search: string, page: number) => [...emailKeys.all, 'list', folder, search, page] as const,
    detail: (id: string) => [...emailKeys.all, 'detail', id] as const,
    customer: (customerId: string) => [...emailKeys.all, 'customer', customerId] as const,
};

export const useEmails = (folder: EmailFolder, search: string, page: number) =>
    useQuery({
        queryKey: emailKeys.list(folder, search, page),
        queryFn: () => emailsApi.list({ folder, search: search || undefined, page, limit: 25 }),
        placeholderData: keepPreviousData,
        // keep "Sending…" rows moving while delivery runs in the background
        refetchInterval: (q) => (q.state.data?.data.some((m) => m.status === 'SENDING') ? 3000 : false),
    });

export const useEmail = (id: string | null) =>
    useQuery({
        queryKey: emailKeys.detail(id ?? ''),
        queryFn: () => emailsApi.get(id as string),
        enabled: !!id,
        refetchInterval: (q) => (q.state.data?.status === 'SENDING' ? 2500 : false),
    });

export const useCustomerEmails = (customerId: string) =>
    useQuery({ queryKey: emailKeys.customer(customerId), queryFn: () => emailsApi.forCustomer(customerId) });

export function useEmailMutations() {
    const qc = useQueryClient();
    const refresh = () => qc.invalidateQueries({ queryKey: emailKeys.all });
    return {
        save: useMutation({
            mutationFn: ({ id, dto }: { id: string | null; dto: SaveEmailPayload }) => (id ? emailsApi.update(id, dto) : emailsApi.create(dto)),
            onSuccess: (m) => {
                qc.setQueryData(emailKeys.detail(m.id), m);
                qc.invalidateQueries({ queryKey: [...emailKeys.all, 'list'] });
            },
        }),
        send: useMutation({ mutationFn: (id: string) => emailsApi.send(id), onSuccess: refresh }),
        test: useMutation({ mutationFn: (dto: SaveEmailPayload) => emailsApi.test(dto) }),
        remove: useMutation({ mutationFn: (id: string) => emailsApi.remove(id), onSuccess: refresh }),
        duplicate: useMutation({ mutationFn: (id: string) => emailsApi.duplicate(id), onSuccess: refresh }),
    };
}
