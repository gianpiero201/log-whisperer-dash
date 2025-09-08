import { Activity, AlertTriangle, Database, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { DashboardCharts } from "@/components/dashboard-charts";
import { LogTable } from "@/components/log-table";
import { BackendMonitor } from "@/components/backend-monitor";

export default function Dashboard() {
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
            value="—"
            subtitle="—"
            icon={Database}
          />
          <MetricCard
            title="Active Errors"
            value="—"
            subtitle="—"
            icon={AlertTriangle}
            variant="error"
          />
          <MetricCard
            title="System Health"
            value="—"
            subtitle="—"
            icon={Activity}
            variant="success"
          />
          <MetricCard
            title="Throughput"
            value="—"
            subtitle="—"
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