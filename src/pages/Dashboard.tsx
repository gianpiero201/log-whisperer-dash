import { DashboardCharts } from "@/components/dashboard-charts";
import { LogTable } from "@/components/log-table";
import { MetricCard } from "@/components/metric-card";
import { useNotifications } from "@/hooks/use-notifications";
import { useRealTimeLogs } from "@/hooks/use-real-time-logs";
import { useRealTimeMonitoring } from "@/hooks/use-real-time-monitoring";
import { TrendingDown } from "lucide-react";

export default function Dashboard() {
  const { metrics, isConnected } = useRealTimeMonitoring();
  const { stats, logs } = useRealTimeLogs();
  const { unreadCount } = useNotifications();

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="border-b border-border/50 pb-4">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your system logs and performance metrics in real-time
          </p>
        </div>

        {/* Metrics Cards */}
        <div>
          {/* Show real-time metrics */}
          <MetricCard
            title="Active Endpoints"
            value={metrics?.activeEndpoints.toString() || "0"}
            icon={TrendingDown}
          />

          {/* Connection status indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Charts Section */}
        <DashboardCharts />

        {/* Recent Logs Table */}
        <LogTable logs={logs} />
      </div>
    </div>
  );
}