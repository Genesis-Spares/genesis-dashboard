// src/types/common.types.ts
export interface Option {
    value: string;
    label: string;
}

export interface SelectOption {
    id: string;
    name: string;
}

export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
}