import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LogSidebar } from "@/components/log-sidebar";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <LogSidebar />
            <div className="flex-1 flex flex-col">
              <header className="h-16 flex items-center justify-between border-b border-border/50 px-6 bg-card">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="lg:hidden" />
                  <div>
                    <h2 className="text-lg font-semibold">Log Management Dashboard</h2>
                    <p className="text-xs text-muted-foreground">Real-time monitoring and analysis</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Connected</span>
                </div>
              </header>
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;