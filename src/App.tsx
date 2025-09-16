import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

// Store and hooks
import { useAuth } from './store/authStore';

// Components
import { ProtectedRoute } from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Settings from './pages/Settings';

// Styles
import './App.css';
import LoadingSpinner from './components/ui/loading-spinner';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';
import { Alerts } from './pages/Alerts';
import Analytics from './pages/Analytics';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import Search from './pages/Search';

// Create a client for React Query
const queryClient = new QueryClient();

function AppContent() {
  const { initialize, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Initialize auth on app start
    initialize();
  }, [initialize]);

  // Show loading spinner while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/auth"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Auth />
          }
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logs"
          element={
            <ProtectedRoute>
              <Logs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <Alerts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Default redirects */}
        <Route
          path="/"
          element={
            <Navigate
              to={isAuthenticated ? "/" : "/auth"}
              replace
            />
          }
        />

        {/* Catch-all redirect */}
        <Route
          path="*"
          element={
            <NotFound />
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />

        {/* Toast notifications */}
        <Toaster />

        {/* React Query Devtools (only in development) */}
        {import.meta.env.DEV && (
          <ReactQueryDevtools
            initialIsOpen={false}
            position="bottom"
          />
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;