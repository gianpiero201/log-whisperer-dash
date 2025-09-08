import { useState } from "react";
import { TrendingUp, TrendingDown, Activity, Clock, Filter, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricCard } from "@/components/metric-card";
import { DashboardCharts } from "@/components/dashboard-charts";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("24h");
  const [serviceFilter, setServiceFilter] = useState("all");

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
              <p className="text-muted-foreground mt-2">
                Deep insights and trends analysis for your system logs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="api">API Gateway</SelectItem>
                  <SelectItem value="auth">Auth Service</SelectItem>
                  <SelectItem value="db">Database</SelectItem>
                  <SelectItem value="cache">Cache</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Average Response Time"
            value="—"
            subtitle="—"
            icon={Clock}
          />
          <MetricCard
            title="Error Rate"
            value="—"
            subtitle="—"
            icon={TrendingDown}
            variant="error"
          />
          <MetricCard
            title="Throughput"
            value="—"
            subtitle="—"
            icon={Activity}
            variant="success"
          />
          <MetricCard
            title="Availability"
            value="—"
            subtitle="—"
            icon={TrendingUp}
            variant="success"
          />
        </div>

        {/* Analytics Charts */}
        <DashboardCharts />

        {/* Additional Analytics Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Top Error Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No error data available</p>
                <p className="text-sm">Error analysis will appear here when data is collected</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Service Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No performance data available</p>
                <p className="text-sm">Service metrics will appear here when data is collected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Detailed Log Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Advanced Analytics Coming Soon</h3>
              <p className="text-sm max-w-md mx-auto">
                This section will provide detailed log analysis, pattern recognition, 
                and predictive insights to help you optimize your system performance.
              </p>
              <Button variant="outline" className="mt-4">
                Configure Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}