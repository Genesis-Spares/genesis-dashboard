// src/types/auth.types.ts
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
}

export interface User {
    id?: string;
    sub?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roles: string[];
    permissions: string[];
    avatar?: string;
    emailVerified: boolean;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    iat?: number;
    exp?: number;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
}

export interface SessionData {
    user: User;
    tokens: AuthTokens;
    expiresAt: number;
}

export interface AuthState {
    user: User | null;
    tokens: AuthTokens | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}