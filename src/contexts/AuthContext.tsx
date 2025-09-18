import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Types
interface User {
    id: string;
    email: string;
    displayName?: string;
    isEmailVerified: boolean;
    isActive: boolean;
}

interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

interface AuthContextType extends AuthState {
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName?: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshToken: () => Promise<void>;
    clearError: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token management utilities
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

const getStoredToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

const getStoredRefreshToken = (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
};

const getStoredUser = (): User | null => {
    try {
        const userData = localStorage.getItem(USER_KEY);
        return userData ? JSON.parse(userData) : null;
    } catch {
        return null;
    }
};

const setTokens = (accessToken: string, refreshToken?: string, user?: User) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
};

const clearTokens = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

// Check if token is expired
const isTokenExpired = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        return payload.exp < currentTime;
    } catch {
        return true;
    }
};

// Extract user info from token
const getUserFromToken = (token: string): User | null => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            id: payload.sub || payload.nameid,
            email: payload.email || payload.unique_name,
            displayName: payload.given_name || payload.name,
            isEmailVerified: payload.email_verified === 'true' || payload.email_verified === true,
            isActive: true
        };
    } catch {
        return null;
    }
};

// AuthProvider component
interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        loading: true,
        error: null,
    });

    // Initialize authentication state
    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            const storedToken = getStoredToken();
            const storedUser = getStoredUser();

            if (!storedToken) {
                setState(prev => ({ ...prev, loading: false }));
                return;
            }

            // Check if token is expired
            if (isTokenExpired(storedToken)) {
                console.log('Token expired, attempting refresh...');
                const refreshed = await attemptTokenRefresh();
                if (!refreshed) {
                    clearTokens();
                    setState(prev => ({ ...prev, loading: false }));
                    return;
                }
            } else {
                // Token is valid, verify with server
                const isValid = await verifyTokenWithServer(storedToken);
                if (isValid) {
                    const user = getUserFromToken(storedToken) || storedUser;
                    setState(prev => ({ ...prev, user, loading: false }));
                } else {
                    // Token invalid, try refresh
                    const refreshed = await attemptTokenRefresh();
                    if (!refreshed) {
                        clearTokens();
                        setState(prev => ({ ...prev, loading: false }));
                    }
                }
            }
        } catch (error) {
            console.error('Error initializing auth:', error);
            clearTokens();
            setState(prev => ({ ...prev, loading: false }));
        }
    };

    const verifyTokenWithServer = async (token: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return response.ok;
        } catch {
            return false;
        }
    };

    const attemptTokenRefresh = async (): Promise<boolean> => {
        try {
            const refreshToken = getStoredRefreshToken();
            if (!refreshToken) {
                return false;
            }

            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // For HTTP-only cookies
            });

            if (!response.ok) {
                // Try alternative refresh endpoint
                const altResponse = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken }),
                });

                if (!altResponse.ok) {
                    return false;
                }

                const altData = await altResponse.json();
                if (altData.success && altData.data) {
                    const { accessToken, refreshToken: newRefreshToken } = altData.data;
                    const user = getUserFromToken(accessToken);

                    setTokens(accessToken, newRefreshToken, user);
                    setState(prev => ({ ...prev, user, loading: false, error: null }));
                    return true;
                }
                return false;
            }

            const data = await response.json();
            if (data.success && data.data) {
                const { accessToken, refreshToken: newRefreshToken } = data.data;
                const user = getUserFromToken(accessToken);

                setTokens(accessToken, newRefreshToken, user);
                setState(prev => ({ ...prev, user, loading: false, error: null }));
                return true;
            }

            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    };

    const signIn = async (email: string, password: string): Promise<void> => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // For HTTP-only cookies
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            if (data.success && data.data) {
                const { accessToken, refreshToken } = data.data;
                const user = getUserFromToken(accessToken);

                if (!user) {
                    throw new Error('Invalid token received');
                }

                setTokens(accessToken, refreshToken, user);
                setState(prev => ({ ...prev, user, loading: false, error: null }));
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Login failed';
            setState(prev => ({ ...prev, loading: false, error: message }));
            throw error;
        }
    };

    const signUp = async (email: string, password: string, displayName?: string): Promise<void> => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, password, displayName }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            if (data.success && data.data) {
                const { accessToken, refreshToken } = data.data;
                const user = getUserFromToken(accessToken);

                if (user) {
                    setTokens(accessToken, refreshToken, user);
                    setState(prev => ({ ...prev, user, loading: false, error: null }));
                } else {
                    // Registration successful but no immediate login
                    setState(prev => ({ ...prev, loading: false, error: null }));
                }
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Registration failed';
            setState(prev => ({ ...prev, loading: false, error: message }));
            throw error;
        }
    };

    const signOut = async (): Promise<void> => {
        setState(prev => ({ ...prev, loading: true }));

        try {
            const token = getStoredToken();
            if (token) {
                // Try to logout from server
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });
            }
        } catch (error) {
            console.error('Server logout failed:', error);
            // Continue with local logout even if server call fails
        }

        // Always clear local tokens
        clearTokens();
        setState({ user: null, loading: false, error: null });
    };

    const refreshToken = async (): Promise<void> => {
        const refreshed = await attemptTokenRefresh();
        if (!refreshed) {
            clearTokens();
            setState({ user: null, loading: false, error: 'Session expired' });
            throw new Error('Session expired');
        }
    };

    const clearError = () => {
        setState(prev => ({ ...prev, error: null }));
    };

    // Auto-refresh token before expiry
    useEffect(() => {
        if (!state.user) return;

        const token = getStoredToken();
        if (!token) return;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiryTime = payload.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();
            const timeUntilExpiry = expiryTime - currentTime;

            // Refresh 5 minutes before expiry
            const refreshTime = Math.max(timeUntilExpiry - (5 * 60 * 1000), 60000); // At least 1 minute

            if (refreshTime > 0) {
                const timeoutId = setTimeout(() => {
                    attemptTokenRefresh();
                }, refreshTime);

                return () => clearTimeout(timeoutId);
            }
        } catch {
            // Token parsing failed, ignore
        }
    }, [state.user]);

    const contextValue: AuthContextType = {
        ...state,
        signIn,
        signUp,
        signOut,
        refreshToken,
        clearError,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Higher-order component for authentication
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
    return (props: P) => {
        const { user, loading } = useAuth();
        const navigate = useNavigate();

        useEffect(() => {
            if (!loading && !user) {
                navigate('/auth', { replace: true });
            }
        }, [user, loading, navigate]);

        if (loading) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Carregando...</p>
                    </div>
                </div>
            );
        }

        if (!user) {
            return null; // Will redirect
        }

        return <Component {...props} />;
    };
};

export default AuthContext;