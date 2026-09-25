import axios, {
    AxiosError,
    AxiosInstance,
    InternalAxiosRequestConfig,
} from 'axios';

import { ApiResponse, ApiError } from '@/types/api.types';
import { getCookie, setCookie, removeCookie } from '@/lib/utils/cookies';

class ApiClient {
    private client: AxiosInstance;

    private isRefreshing = false;

    private refreshSubscribers: ((token: string) => void)[] = [];

    constructor() {
        this.client = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        /*
         * REQUEST INTERCEPTOR
         */
        this.client.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                const token = getCookie('accessToken');

                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }

                return config;
            },
            (error) => Promise.reject(error)
        );

        /*
         * RESPONSE INTERCEPTOR
         */
        this.client.interceptors.response.use(
            (response) => {
                console.log('API response:', response);

                // Do not transform the response.
                return response;
            },

            async (error: AxiosError) => {
                const originalRequest =
                    error.config as InternalAxiosRequestConfig & {
                        _retry?: boolean;
                    };

                const status = error.response?.status;
                const requestUrl = originalRequest?.url || '';

                /*
                 * Authentication endpoints should NEVER
                 * trigger access-token refresh.
                 */
                const isAuthRequest =
                    requestUrl.includes('/auth/login') ||
                    requestUrl.includes('/auth/register') ||
                    requestUrl.includes('/auth/verify-email') ||
                    requestUrl.includes('/auth/verify-invite') ||
                    requestUrl.includes('/auth/resend-otp') ||
                    requestUrl.includes('/auth/forgot-password') ||
                    requestUrl.includes('/auth/reset-password') ||
                    requestUrl.includes('/auth/refresh');

                /*
                 * Only refresh tokens for protected endpoints.
                 */
                if (
                    status === 401 &&
                    !originalRequest?._retry &&
                    !isAuthRequest
                ) {
                    originalRequest._retry = true;

                    /*
                     * Another request is already refreshing.
                     * Wait for the new access token.
                     */
                    if (this.isRefreshing) {
                        return new Promise((resolve) => {
                            this.refreshSubscribers.push(
                                (token: string) => {
                                    if (originalRequest.headers) {
                                        originalRequest.headers.Authorization =
                                            `Bearer ${token}`;
                                    }

                                    resolve(
                                        this.client(originalRequest)
                                    );
                                }
                            );
                        });
                    }

                    this.isRefreshing = true;

                    try {
                        const refreshToken =
                            getCookie('refreshToken');

                        if (!refreshToken) {
                            throw new Error('No refresh token');
                        }

                        /*
                         * Refresh the tokens.
                         */
                        const response =
                            await this.refreshTokens(refreshToken);

                        const {
                            accessToken,
                            refreshToken: newRefreshToken,
                        } = response.data;

                        if (!accessToken) {
                            throw new Error(
                                'Refresh response did not contain accessToken'
                            );
                        }

                        /*
                         * Store new tokens.
                         */
                        setCookie('accessToken', accessToken, {
                            expires: 15,
                        });

                        if (newRefreshToken) {
                            setCookie(
                                'refreshToken',
                                newRefreshToken,
                                {
                                    expires: 30,
                                }
                            );
                        }

                        /*
                         * Resolve queued requests.
                         */
                        this.refreshSubscribers.forEach(
                            (callback) => callback(accessToken)
                        );

                        this.refreshSubscribers = [];

                        /*
                         * Retry original request.
                         */
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization =
                                `Bearer ${accessToken}`;
                        }

                        return this.client(originalRequest);
                    } catch (refreshError) {
                        this.handleRefreshFailure();

                        return Promise.reject(refreshError);
                    } finally {
                        this.isRefreshing = false;
                    }
                }

                /*
                 * Normal API error.
                 */
                return Promise.reject(
                    this.normalizeError(error)
                );
            }
        );
    }

    /*
     * Refresh token request.
     *
     * This uses Axios directly, so the returned value is
     * an AxiosResponse and response.data is correct here.
     */
    private async refreshTokens(refreshToken: string) {
        return this.client.post('/auth/refresh', {
            refreshToken,
        });
    }

    private handleRefreshFailure() {
        removeCookie('accessToken');
        removeCookie('refreshToken');

        this.refreshSubscribers = [];

        if (typeof window !== 'undefined') {
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
    }

    private normalizeError(error: AxiosError): ApiError {
        if (error.response?.data) {
            return error.response.data as ApiError;
        }

        return {
            statusCode: error.response?.status || 500,
            message:
                error.message ||
                'An unexpected error occurred',
            error: 'Error',
            timestamp: new Date().toISOString(),
            path: error.config?.url || '',
        };
    }

    /*
     * GET
     */
    public async get<T>(
        url: string,
        params?: any
    ): Promise<any> {
        const response =
            await this.client.get<ApiResponse<T>>(
                url,
                { params }
            );

        return response.data;
    }

    /*
     * POST
     */
    public async post<T>(
        url: string,
        data?: any
    ): Promise<any> {
        const response =
            await this.client.post<ApiResponse<T>>(
                url,
                data
            );

        return response.data;
    }

    /*
     * PUT
     */
    public async put<T>(
        url: string,
        data?: any
    ): Promise<ApiResponse<T>> {
        const response =
            await this.client.put<ApiResponse<T>>(
                url,
                data
            );

        return response.data;
    }

    /*
     * PATCH
     */
    public async patch<T>(
        url: string,
        data?: any
    ): Promise<any> {
        const response =
            await this.client.patch<ApiResponse<T>>(
                url,
                data
            );

        return response.data;
    }

    /*
     * DELETE
     *
     * `data` is optional — some bulk-delete endpoints require a request body
     * (e.g. DELETE /categories/bulk with { ids: string[] }).
     * Axios sends it via the config `data` key, not as a second positional arg.
     */
    public async delete<T>(
        url: string,
        data?: any
    ): Promise<any> {
        const response =
            await this.client.delete<ApiResponse<T>>(url, { data });

        return response.data;
    }
}

export const apiClient = new ApiClient();