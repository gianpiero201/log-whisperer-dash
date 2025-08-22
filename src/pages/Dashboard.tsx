import { Activity, AlertTriangle, Database, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { DashboardCharts } from "@/components/dashboard-charts";
import { LogTable } from "@/components/log-table";

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
            value="12,456"
            subtitle="Last 24 hours"
            icon={Database}
            trend={{ value: 12.5, isPositive: true }}
          />
          <MetricCard
            title="Active Errors"
            value="23"
            subtitle="Needs attention"
            icon={AlertTriangle}
            variant="error"
            trend={{ value: -8.2, isPositive: false }}
          />
          <MetricCard
            title="System Health"
            value="98.5%"
            subtitle="All systems operational"
            icon={Activity}
            variant="success"
            trend={{ value: 2.1, isPositive: true }}
          />
          <MetricCard
            title="Throughput"
            value="1.2K/min"
            subtitle="Logs per minute"
            icon={TrendingUp}
            trend={{ value: 15.3, isPositive: true }}
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