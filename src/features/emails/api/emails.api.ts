import { apiClient } from '@/lib/api/client';

export type EmailStatus = 'DRAFT' | 'SENDING' | 'SENT' | 'PARTIAL' | 'FAILED';
export type RecipientStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';

export interface EmailAttachment {
    name: string;
    url: string;
    size?: number;
    type?: string;
}

export interface EmailRecipientInput {
    customerId?: string;
    email: string;
    name?: string;
}

export interface EmailRecipient extends EmailRecipientInput {
    id: string;
    status: RecipientStatus;
    error?: string | null;
    sentAt?: string | null;
    marketingOptOut?: boolean;
}

export interface EmailMessage {
    id: string;
    subject: string;
    html: string;
    cc: string[];
    bcc: string[];
    attachments?: EmailAttachment[] | null;
    branded: boolean;
    marketing: boolean;
    status: EmailStatus;
    createdByEmail?: string | null;
    sentAt?: string | null;
    createdAt: string;
    updatedAt: string;
    recipients: EmailRecipient[];
}

export interface EmailListItem extends Omit<EmailMessage, 'html' | 'recipients'> {
    snippet: string;
    recipientCount: number;
    recipientPreview: string[];
    counts: { sent: number; failed: number; skipped: number; pending: number };
}

export interface EmailListResponse {
    data: EmailListItem[];
    meta: { total: number; page: number; limit: number; totalPages: number; drafts: number };
}

export interface CustomerEmail {
    id: string;
    status: RecipientStatus;
    error?: string | null;
    sentAt?: string | null;
    email: string;
    message: { id: string; subject: string; sentAt?: string | null; createdByEmail?: string | null };
}

export interface SaveEmailPayload {
    subject?: string;
    html?: string;
    recipients?: EmailRecipientInput[];
    cc?: string[];
    bcc?: string[];
    attachments?: EmailAttachment[];
    branded?: boolean;
    marketing?: boolean;
}

export type EmailFolder = 'sent' | 'drafts';

export const emailsApi = {
    list: (params: { folder: EmailFolder; search?: string; page?: number; limit?: number }): Promise<EmailListResponse> =>
        apiClient.get('/emails', params),
    get: (id: string): Promise<EmailMessage> =>
        apiClient.get(`/emails/${id}`),
    forCustomer: (customerId: string): Promise<CustomerEmail[]> =>
        apiClient.get(`/emails/customer/${customerId}`),
    create: (dto: SaveEmailPayload): Promise<EmailMessage> =>
        apiClient.post('/emails', dto),
    update: (id: string, dto: SaveEmailPayload): Promise<EmailMessage> =>
        apiClient.put(`/emails/${id}`, dto),
    remove: (id: string): Promise<{ success: boolean }> =>
        apiClient.delete(`/emails/${id}`),
    duplicate: (id: string): Promise<EmailMessage> =>
        apiClient.post(`/emails/${id}/duplicate`),
    send: (id: string): Promise<EmailMessage> =>
        apiClient.post(`/emails/${id}/send`),
    test: (dto: SaveEmailPayload): Promise<{ success: boolean; to: string }> =>
        apiClient.post('/emails/test', dto),
};

/** Upload any file (PDF, image, spreadsheet…) to Cloudinary for use as an email attachment. */
export async function uploadAttachment(file: File): Promise<EmailAttachment> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) throw new Error('File uploads aren’t set up (Cloudinary is not configured).');
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', uploadPreset);
    form.append('folder', 'email-attachments');
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: form });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error?.message || `Couldn’t upload ${file.name}`);
    return { name: file.name, url: data.secure_url, size: file.size, type: file.type || undefined };
}
