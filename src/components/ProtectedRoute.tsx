import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useIsAuthenticated } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  // User is authenticated, render the protected component
  return <>{children}</>;
}

// Higher-order component version for class components (if needed)
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Hook to check authentication with loading state
export function useAuthGuard() {
  const isAuthenticated = useIsAuthenticated();

  return {
    isAuthenticated,
    requireAuth: () => {
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }
    }
  };
}