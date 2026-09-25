// src/lib/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthState, User, AuthTokens } from '@/types/auth.types';
import { apiClient } from '@/lib/api/client';
import { setCookie, removeCookie, getCookie } from '@/lib/utils/cookies';

interface AuthStore extends AuthState {
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<AuthTokens>;
    fetchUser: () => Promise<void>;
    setUser: (user: User) => void;
    clearError: () => void;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            _hasHydrated: false,

            setHasHydrated: (state: boolean) => {
                set({ _hasHydrated: state });
            },

            initialize: async () => {
                const accessToken = getCookie('accessToken');
                const refreshToken = getCookie('refreshToken');

                if (accessToken && refreshToken) {
                    set({
                        tokens: { accessToken, refreshToken },
                        isAuthenticated: true,
                    });

                    try {
                        await get().fetchUser();
                    } catch (error) {
                        // If fetching user fails, try to refresh token
                        try {
                            await get().refreshToken();
                            await get().fetchUser();
                        } catch (refreshError) {
                            await get().logout();
                        }
                    }
                }
            },

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    // 1. Login to get tokens
                    const response = await apiClient.post<{
                        accessToken: string;
                        refreshToken: string;
                    }>('/auth/login', { email, password });

                    const { accessToken, refreshToken } = response;

                    // 2. Store tokens
                    setCookie('accessToken', accessToken, { expires: 15 });
                    setCookie('refreshToken', refreshToken, { expires: 30 });

                    set({
                        tokens: { accessToken, refreshToken },
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });

                    // 3. Fetch user data
                    await get().fetchUser();

                } catch (error: any) {
                    set({
                        isLoading: false,
                        error: error.message || 'Login failed',
                    });
                    throw error;
                }
            },

            fetchUser: async () => {
                try {
                    const response = await apiClient.get<User>('/me');

                    console.log("User, response", response);

                    set({
                        user: response,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({
                        isLoading: false,
                        error: error.message || 'Failed to fetch user',
                    });
                    throw error;
                }
            },

            logout: async () => {
                try {
                    await apiClient.post('/auth/logout');
                } catch (error) {
                    // Ignore errors on logout
                } finally {
                    removeCookie('accessToken');
                    removeCookie('refreshToken');
                    set({
                        user: null,
                        tokens: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: null,
                    });
                }
            },

            refreshToken: async () => {
                const { tokens } = get();
                if (!tokens?.refreshToken) {
                    throw new Error('No refresh token');
                }

                try {
                    const response = await apiClient.post<AuthTokens>('/auth/refresh', {
                        refreshToken: tokens.refreshToken,
                    });

                    const { accessToken, refreshToken } = response.data;

                    setCookie('accessToken', accessToken, { expires: 15 });
                    setCookie('refreshToken', refreshToken, { expires: 30 });

                    set({
                        tokens: { accessToken, refreshToken },
                    });

                    // Return new tokens for subscribers
                    return { accessToken, refreshToken };
                } catch (error) {
                    await get().logout();
                    throw error;
                }
            },

            setUser: (user: User) => {
                set({ user });
            },

            clearError: () => {
                set({ error: null });
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                tokens: state.tokens,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);