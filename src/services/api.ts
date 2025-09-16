import { ApiResponse } from '@/types/api';
import { API_CONFIG, AUTH_CONFIG, TOAST_MESSAGES } from '@/utils/constants';
import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: API_CONFIG.TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Request interceptor - adiciona token de autorização
        this.client.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor - trata respostas e erros
        this.client.interceptors.response.use(
            (response: AxiosResponse) => {
                return response;
            },
            async (error: AxiosError) => {
                const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

                // Token expirado - tenta renovar
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
                        if (refreshToken) {
                            const response = await this.client.post<ApiResponse<any>>('/auth/refresh', {
                                refreshToken
                            });

                            if (response.data.success && response.data.data) {
                                const { token, refreshToken: newRefreshToken } = response.data.data;
                                localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
                                localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, newRefreshToken);

                                // Retry original request
                                originalRequest.headers.Authorization = `Bearer ${token}`;
                                return this.client.request(originalRequest);
                            }
                        }
                    } catch (refreshError) {
                        // Refresh failed - redirect to login
                        this.handleAuthError();
                        return Promise.reject(refreshError);
                    }
                }

                // Handle other errors
                this.handleError(error);
                return Promise.reject(error);
            }
        );
    }

    private handleAuthError() {
        // Clear auth data
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.USER_KEY);

        // Redirect to login page
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
    }

    private handleError(error: AxiosError) {
        const response = error.response;

        if (!response) {
            toast.error(TOAST_MESSAGES.NETWORK_ERROR);
            return;
        }

        const data = response.data as ApiResponse<any>;

        switch (response.status) {
            case 400:
                if (data?.errors?.length > 0) {
                    data.errors.forEach(err => toast.error(err));
                } else {
                    toast.error(data?.message || TOAST_MESSAGES.VALIDATION_ERROR);
                }
                break;

            case 401:
                toast.error(TOAST_MESSAGES.PERMISSION_ERROR);
                break;

            case 403:
                toast.error('Access forbidden');
                break;

            case 404:
                toast.error('Resource not found');
                break;

            case 500:
                toast.error('Server error. Please try again later.');
                break;

            default:
                toast.error(data?.message || TOAST_MESSAGES.GENERIC_ERROR);
        }
    }

    // Generic GET method
    async get<T>(url: string, params?: any): Promise<T> {
        const response = await this.client.get<T>(url, { params });
        return response.data;
    }

    // Generic POST method
    async post<T>(url: string, data?: any): Promise<T> {
        const response = await this.client.post<T>(url, data);
        return response.data;
    }

    // Generic PUT method
    async put<T>(url: string, data?: any): Promise<T> {
        const response = await this.client.put<T>(url, data);
        return response.data;
    }

    // Generic DELETE method
    async delete<T>(url: string): Promise<T> {
        const response = await this.client.delete<T>(url);
        return response.data;
    }

    // Generic PATCH method
    async patch<T>(url: string, data?: any): Promise<T> {
        const response = await this.client.patch<T>(url, data);
        return response.data;
    }

    // Get raw axios instance if needed
    getAxiosInstance(): AxiosInstance {
        return this.client;
    }

    // Set auth token manually
    setAuthToken(token: string) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
        this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Clear auth token
    clearAuthToken() {
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.USER_KEY);
        delete this.client.defaults.headers.common['Authorization'];
    }

    // Check if user is authenticated
    isAuthenticated(): boolean {
        const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        return !!token;
    }

    // Get current user from localStorage
    getCurrentUser() {
        const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }

    // Retry a request with exponential backoff
    async retryRequest<T>(
        requestFn: () => Promise<T>,
        maxRetries: number = API_CONFIG.RETRY_ATTEMPTS,
        delay: number = API_CONFIG.RETRY_DELAY
    ): Promise<T> {
        let lastError: any;

        for (let i = 0; i <= maxRetries; i++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;

                if (i === maxRetries) {
                    throw error;
                }

                // Exponential backoff
                const waitTime = delay * Math.pow(2, i);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        throw lastError;
    }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export default ApiClient;