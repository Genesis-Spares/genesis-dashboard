export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type AddressType = 'SHIPPING' | 'BILLING' | 'BOTH';
export type NoteType = 'GENERAL' | 'SUPPORT' | 'SALES' | 'COMPLAINT' | 'FEEDBACK';

export interface Address {
    id: string;
    customerId: string;
    label: string;
    type: AddressType;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone?: string;
    isDefault: boolean;
    isActive: boolean;
    latitude?: number;
    longitude?: number;
    deliveryInstructions?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CustomerPreference {
    id: string;
    customerId: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    marketingEmails: boolean;
    dataSharingConsent: boolean;
    cookieConsent: boolean;
    preferredCategories: string[];
    preferredBrands: string[];
}

export interface CustomerNote {
    id: string;
    customerId: string;
    content: string;
    type: NoteType;
    authorId: string;
    authorName?: string;
    isInternal: boolean;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CustomerActivity {
    id: string;
    customerId: string;
    action: string;
    resource?: string;
    resourceId?: string;
    metadata?: Record<string, any>;
    createdAt: string;
}

export interface Customer {
    id: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    dateOfBirth?: string;
    gender?: Gender;
    language: string;
    timezone: string;
    currency: string;
    preferences?: CustomerPreference;
    loyaltyPoints: number;
    loyaltyTier: LoyaltyTier;
    isActive: boolean;
    lastLoginAt?: string;
    loginCount: number;
    addresses?: Address[];
    notes?: CustomerNote[];
    activities?: CustomerActivity[];
    createdAt: string;
    updatedAt: string;
}

export interface CustomerListParams {
    page?: number;
    limit?: number;
    search?: string;
    loyaltyTier?: LoyaltyTier | string;
    isActive?: boolean;
    sortBy?: 'createdAt' | 'lastLoginAt' | 'loyaltyPoints' | 'loginCount';
    sortOrder?: 'asc' | 'desc';
}

export interface CustomerListResponse {
    data: Customer[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface CreateCustomerPayload {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    dateOfBirth?: string;
    gender?: Gender;
    language?: string;
    timezone?: string;
    currency?: string;
}

export interface UpdateCustomerInput {
    avatar?: string;
    dateOfBirth?: string;
    gender?: Gender;
    language?: string;
    timezone?: string;
    currency?: string;
    isActive?: boolean;
}


export interface UpdateNoteInput {
    content?: string;
    type?: NoteType;
    isPinned?: boolean;
    isInternal?: boolean;
}
/** A signed-in shopper's saved cart (GET /cart/user/:userId), priced live from the catalogue. */
export interface CustomerCartItem {
    productId: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    addedAt: string;
    updatedAt: string;
    product: {
        id: string;
        sku: string;
        name: string;
        slug: string;
        brand?: string | null;
        image?: string | null;
        stockQty: number;
        isInStock: boolean;
        isActive: boolean;
    };
}

export interface CustomerCart {
    items: CustomerCartItem[];
    itemCount: number;
    subtotal: number;
    updatedAt: string | null;
}
