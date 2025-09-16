import toast from 'react-hot-toast';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { authService } from '../services/auth';
import type { LoginRequest, RegisterRequest, User } from '../types/api';

interface AuthState {
    // State
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (credentials: LoginRequest) => Promise<void>;
    register: (userData: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    updateProfile: (profileData: Partial<User>) => Promise<void>;
    clearError: () => void;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    subscribeWithSelector((set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        login: async (credentials: LoginRequest) => {
            set({ isLoading: true, error: null });

            try {
                const authResponse = await authService.login(credentials);

                set({
                    user: authResponse.user,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null
                });

                toast.success('Successfully logged in!');
            } catch (error: any) {
                const errorMessage = error.message || 'Login failed';
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: errorMessage
                });

                toast.error(errorMessage);
                throw error;
            }
        },

        register: async (userData: RegisterRequest) => {
            set({ isLoading: true, error: null });

            try {
                const authResponse = await authService.register(userData);

                set({
                    user: authResponse.user,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null
                });

                toast.success('Account created successfully!');
            } catch (error: any) {
                const errorMessage = error.message || 'Registration failed';
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: errorMessage
                });

                toast.error(errorMessage);
                throw error;
            }
        },

        logout: async () => {
            set({ isLoading: true });

            try {
                await authService.logout();

                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null
                });

                toast.success('Successfully logged out!');
            } catch (error: any) {
                // Even if logout fails on server, clear local state
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null
                });

                console.error('Logout error:', error);
                toast.success('Logged out successfully!');
            }
        },

        refreshUser: async () => {
            if (!authService.isAuthenticated()) {
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null
                });
                return;
            }

            set({ isLoading: true, error: null });

            try {
                const user = await authService.getCurrentUser();

                set({
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null
                });
            } catch (error: any) {
                console.error('Failed to refresh user:', error);

                // If refresh fails, logout user
                await get().logout();
            }
        },

        updateProfile: async (profileData: Partial<User>) => {
            set({ isLoading: true, error: null });

            try {
                const updatedUser = await authService.updateProfile(profileData);

                set({
                    user: updatedUser,
                    isLoading: false,
                    error: null
                });

                toast.success('Profile updated successfully!');
            } catch (error: any) {
                const errorMessage = error.message || 'Failed to update profile';
                set({
                    isLoading: false,
                    error: errorMessage
                });

                toast.error(errorMessage);
                throw error;
            }
        },

        clearError: () => {
            set({ error: null });
        },

        initialize: async () => {
            // Initialize auth service
            authService.initialize();

            // Check if user is already authenticated
            if (authService.isAuthenticated()) {
                const storedUser = authService.getUserFromStorage();

                if (storedUser) {
                    set({
                        user: storedUser,
                        isAuthenticated: true,
                        isLoading: false
                    });

                    // Refresh user data from server in background
                    try {
                        await get().refreshUser();
                    } catch (error) {
                        console.error('Background user refresh failed:', error);
                    }
                } else {
                    // Token exists but no user data, refresh from server
                    await get().refreshUser();
                }
            } else {
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false
                });
            }
        }
    }))
);

// Subscribe to auth state changes for side effects
useAuthStore.subscribe(
    (state) => state.isAuthenticated,
    (isAuthenticated, prevIsAuthenticated) => {
        // Handle authentication state changes
        if (prevIsAuthenticated && !isAuthenticated) {
            // User was logged out
            console.log('User logged out');
        } else if (!prevIsAuthenticated && isAuthenticated) {
            // User logged in
            console.log('User logged in');
        }
    }
);

// Hook for components to access auth state and actions
export const useAuth = () => {
    const state = useAuthStore();
    return state;
};

// Selectors for specific parts of the state
export const useAuthUser = () => useAuthStore(state => state.user);
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore(state => state.isLoading);
export const useAuthError = () => useAuthStore(state => state.error);