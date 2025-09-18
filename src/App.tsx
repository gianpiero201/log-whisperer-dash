import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

// Import the FIXED Auth Context
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Import the FIXED Protected Route
import { ProtectedRoute } from "@/components/ProtectedRoute";

import { LogSidebar } from "@/components/log-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";

// Pages
import Alerts from "./pages/Alerts";
import Analytics from "./pages/Analytics";
import Auth from "./pages/Auth"; // This should be the FIXED Auth page
import Dashboard from "./pages/Dashboard";
import Logs from "./pages/Logs";
import NotFound from "./pages/NotFound";
import Search from "./pages/Search";
import Settings from "./pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Auth Route */}
              <Route path="/auth" element={<Auth />} />

              {/* Protected Routes */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full bg-background">
                      <LogSidebar />

                      <div className="flex-1 flex flex-col">
                        {/* Header */}
                        <header className="h-16 flex items-center justify-between border-b border-border/50 px-6 bg-card">
                          <div className="flex items-center gap-4">
                            <SidebarTrigger className="lg:hidden" />
                            <div>
                              <h2 className="text-lg font-semibold">Log Management Dashboard</h2>
                              <p className="text-xs text-muted-foreground">Real-time monitoring and analysis</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Connection Status Indicator */}
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-success rounded-full"></div>
                              <span className="text-sm text-muted-foreground">Connected</span>
                            </div>

                            <ThemeToggle />
                            <UserMenu />
                          </div>
                        </header>

                        {/* Main Content */}
                        <main className="flex-1 p-6 overflow-auto">
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/logs" element={<Logs />} />
                            <Route path="/alerts" element={<Alerts />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/search" element={<Search />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                      </div>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;