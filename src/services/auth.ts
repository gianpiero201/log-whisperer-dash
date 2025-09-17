import type {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    User
} from '../types/api';
import { AUTH_CONFIG } from '../utils/constants';
import { apiClient } from './api';

class AuthService {

    /**
     * Faz login do usuário
     */
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>(
            '/auth/login',
            credentials
        );

        if (response.success && response.data) {
            this.setAuthData(response.data);
            return response.data;
        }

        throw new Error(response.message || 'Login failed');
    }

    /**
     * Registra novo usuário
     */
    async register(userData: RegisterRequest): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>(
            '/auth/register',
            userData
        );

        if (response.success && response.data) {
            this.setAuthData(response.data);
            return response.data;
        }

        throw new Error(response.message || 'Registration failed');
    }

    /**
     * Renova o token de acesso
     */
    async refreshToken(): Promise<AuthResponse> {
        const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await apiClient.post<AuthResponse>(
            '/auth/refresh',
            { refreshToken }
        );

        if (response.success && response.data) {
            this.setAuthData(response.data);
            return response.data;
        }

        throw new Error(response.message || 'Token refresh failed');
    }

    /**
     * Obtém o perfil do usuário atual
     */
    async getCurrentUser(): Promise<User> {
        const response = await apiClient.get<User>('/auth/me');

        if (response.success && response.data) {
            // Atualiza os dados do usuário no localStorage
            localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(response.data));
            return response.data;
        }

        throw new Error(response.message || 'Failed to get user profile');
    }

    /**
     * Atualiza o perfil do usuário
     */
    async updateProfile(profileData: Partial<User>): Promise<User> {
        const response = await apiClient.put<User>(
            '/auth/me',
            profileData
        );

        if (response.success && response.data) {
            // Atualiza os dados do usuário no localStorage
            localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(response.data));
            return response.data;
        }

        throw new Error(response.message || 'Failed to update profile');
    }

    /**
     * Faz logout do usuário
     */
    async logout(): Promise<void> {
        try {
            // Opcional: chamar endpoint de logout no backend se existir
            // await apiClient.post('/auth/logout');
        } finally {
            // Sempre limpa os dados locais, mesmo se o backend falhar
            this.clearAuthData();
        }
    }

    /**
     * Verifica se o usuário está autenticado
     */
    isAuthenticated(): boolean {
        const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        const user = localStorage.getItem(AUTH_CONFIG.USER_KEY);
        return !!(token && user);
    }

    /**
     * Obtém o token atual do localStorage
     */
    getToken(): string | null {
        return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    }

    /**
     * Obtém o refresh token do localStorage
     */
    getRefreshToken(): string | null {
        return localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    }

    /**
     * Obtém o usuário atual do localStorage
     */
    getUserFromStorage(): User | null {
        const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
        if (!userStr) return null;

        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }

    /**
     * Verifica se o token está próximo do vencimento
     */
    isTokenNearExpiry(): boolean {
        const token = this.getToken();
        if (!token) return true;

        try {
            // Decode JWT token (simple parsing, not validation)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiry = payload.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            const buffer = AUTH_CONFIG.TOKEN_EXPIRE_BUFFER;

            return (expiry - now) < buffer;
        } catch {
            return true; // If we can't parse, assume expired
        }
    }

    /**
     * Salva dados de autenticação no localStorage
     */
    private setAuthData(authResponse: AuthResponse): void {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, authResponse.token);
        localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, authResponse.refreshToken);
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(authResponse.user));

        // Set token in API client
        apiClient.setAuthToken(authResponse.token);
    }

    /**
     * Limpa todos os dados de autenticação
     */
    private clearAuthData(): void {
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.USER_KEY);

        // Clear token in API client
        apiClient.clearAuthToken();
    }

    /**
     * Inicia auto-refresh do token
     */
    startTokenRefresh(): void {
        // Check every 5 minutes
        const interval = 5 * 60 * 1000;

        setInterval(async () => {
            if (this.isAuthenticated() && this.isTokenNearExpiry()) {
                try {
                    await this.refreshToken();
                    console.log('Token refreshed automatically');
                } catch (error) {
                    console.error('Auto token refresh failed:', error);
                    // If refresh fails, logout user
                    await this.logout();
                }
            }
        }, interval);
    }

    /**
     * Inicializa o serviço de autenticação
     */
    initialize(): void {
        // Set token in API client if available
        const token = this.getToken();
        if (token) {
            apiClient.setAuthToken(token);
        }

        // Start auto-refresh
        this.startTokenRefresh();
    }
}

// Create and export singleton instance
export const authService = new AuthService();

// Export class for testing
export default AuthService;