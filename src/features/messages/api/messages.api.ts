// src/features/messages/api/messages.api.ts
import { apiClient } from '@/lib/api/client';
import {
    SupportMessage,
    MessageListParams,
    MessageListResponse,
    MessageStats,
    ReplyMessageInput,
    UpdateMessageStatusInput,
    UpdateMessageInput,
} from '@/types/message.types';

export const messagesApi = {
    list: async (params?: MessageListParams): Promise<MessageListResponse> => {
        const data = await apiClient.get<MessageListResponse>('/messages', params);
        return data;
    },

    get: async (id: string): Promise<SupportMessage> => {
        const data = await apiClient.get<SupportMessage>(`/messages/${id}`);
        return data;
    },

    getStats: async (): Promise<MessageStats> => {
        const data = await apiClient.get<MessageStats>('/messages/stats');
        return data;
    },

    reply: async (id: string, input: ReplyMessageInput) => {
        const data = await apiClient.post(`/messages/${id}/reply`, input);
        return data;
    },

    update: async (id: string, input: UpdateMessageInput): Promise<SupportMessage> => {
        const data = await apiClient.patch<SupportMessage>(`/messages/${id}`, input);
        return data;
    },

    updateStatus: async (id: string, input: UpdateMessageStatusInput): Promise<SupportMessage> => {
        const data = await apiClient.patch<SupportMessage>(`/messages/${id}/status`, input);
        return data;
    },
};
