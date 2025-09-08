import { Activity, AlertTriangle, Database, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { DashboardCharts } from "@/components/dashboard-charts";
import { LogTable } from "@/components/log-table";
import { BackendMonitor } from "@/components/backend-monitor";
import { useMetrics } from "@/hooks/use-metrics";

export default function Dashboard() {
  const { metrics, loading } = useMetrics();

  const getHealthVariant = () => {
    switch (metrics.systemHealth) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      default: return 'success';
    }
  };

  const getHealthValue = () => {
    switch (metrics.systemHealth) {
      case 'critical': return 'Critical';
      case 'warning': return 'Warning';
      default: return 'Healthy';
    }
  };

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Logs"
            value={loading ? "—" : metrics.totalLogs.toLocaleString()}
            subtitle="all time"
            icon={Database}
          />
          <MetricCard
            title="Active Errors"
            value={loading ? "—" : metrics.activeErrors.toString()}
            subtitle="last 24 hours"
            icon={AlertTriangle}
            variant="error"
          />
          <MetricCard
            title="System Health"
            value={loading ? "—" : getHealthValue()}
            subtitle="current status"
            icon={Activity}
            variant={getHealthVariant()}
          />
          <MetricCard
            title="Throughput"
            value={loading ? "—" : `${metrics.throughput}/min`}
            subtitle="logs per minute"
            icon={TrendingUp}
          />
        </div>

        {/* Charts Section */}
        <DashboardCharts />

        {/* Recent Logs Table */}
        <LogTable />
      </div>
    </div>
  );
}