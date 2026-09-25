// src/features/messages/hooks/useMessages.ts
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { messagesApi } from '../api/messages.api';
import { MessageListParams, ReplyMessageInput, UpdateMessageInput, UpdateMessageStatusInput } from '@/types/message.types';

const messageKeys = {
    all: ['messages'] as const,
    lists: () => [...messageKeys.all, 'list'] as const,
    list: (params?: MessageListParams) => [...messageKeys.lists(), params] as const,
    details: () => [...messageKeys.all, 'detail'] as const,
    detail: (id: string) => [...messageKeys.details(), id] as const,
    stats: () => [...messageKeys.all, 'stats'] as const,
};

export const useMessages = (params?: MessageListParams) => {
    return useQuery({
        queryKey: messageKeys.list(params),
        queryFn: () => messagesApi.list(params),
        placeholderData: keepPreviousData,
    });
};

export const useMessage = (id: string | undefined) => {
    return useQuery({
        queryKey: messageKeys.detail(id ?? ''),
        queryFn: () => messagesApi.get(id as string),
        enabled: Boolean(id),
    });
};

export const useMessageStats = () => {
    return useQuery({
        queryKey: messageKeys.stats(),
        queryFn: () => messagesApi.getStats(),
    });
};

export const useReplyToMessage = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: ReplyMessageInput) => messagesApi.reply(id, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
            queryClient.invalidateQueries({ queryKey: messageKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: messageKeys.stats() });
        },
    });
};

export const useUpdateMessageStatus = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: UpdateMessageStatusInput) => messagesApi.updateStatus(id, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
            queryClient.invalidateQueries({ queryKey: messageKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: messageKeys.stats() });
        },
    });
};

export const useUpdateMessage = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: UpdateMessageInput) => messagesApi.update(id, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
            queryClient.invalidateQueries({ queryKey: messageKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: messageKeys.stats() });
        },
    });
};
