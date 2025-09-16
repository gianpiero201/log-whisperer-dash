import { useQuery } from '@tanstack/react-query';
import { format, subDays, subHours } from 'date-fns';
import { Activity, AlertCircle, RefreshCw, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { alertService } from '../services/alerts';
import { dashboardService } from '../services/dashboard';
import { endpointService } from '../services/endpoints';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LoadingSpinner } from './ui/loading-spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  secondary: '#6b7280',
  accent: '#8b5cf6'
};

const LOG_LEVEL_COLORS = {
  ERROR: COLORS.danger,
  WARN: COLORS.warning,
  INFO: COLORS.primary,
  DEBUG: COLORS.secondary
};

export function DashboardCharts() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [refreshKey, setRefreshKey] = useState(0);

  // Dashboard metrics
  const { data: metrics, isLoading: loadingMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['dashboard', 'metrics', refreshKey],
    queryFn: () => dashboardService.getDashboardMetrics(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes auto-refresh
  });

  // Logs by level
  const { data: logsByLevel = [], isLoading: loadingLogsByLevel } = useQuery({
    queryKey: ['dashboard', 'logs-by-level', timeRange, refreshKey],
    queryFn: () => {
      const endDate = new Date();
      const startDate = timeRange === '24h'
        ? subHours(endDate, 24)
        : timeRange === '7d'
          ? subDays(endDate, 7)
          : subDays(endDate, 30);

      return dashboardService.getLogsByLevel(startDate, endDate);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Logs by service
  const { data: logsByService = [], isLoading: loadingLogsByService } = useQuery({
    queryKey: ['dashboard', 'logs-by-service', timeRange, refreshKey],
    queryFn: () => {
      const endDate = new Date();
      const startDate = timeRange === '24h'
        ? subHours(endDate, 24)
        : timeRange === '7d'
          ? subDays(endDate, 7)
          : subDays(endDate, 30);

      return dashboardService.getLogsByService(startDate, endDate, 10);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Logs timeline
  const { data: logsByHour = [], isLoading: loadingLogsByHour } = useQuery({
    queryKey: ['dashboard', 'logs-by-hour', timeRange, refreshKey],
    queryFn: () => {
      const endDate = new Date();
      const startDate = timeRange === '24h'
        ? subHours(endDate, 24)
        : timeRange === '7d'
          ? subDays(endDate, 7)
          : subDays(endDate, 30);

      return dashboardService.getLogsByHour(startDate, endDate);
    },
    staleTime: 2 * 60 * 1000,
  });

  // Alert statistics
  const { data: alertStats, isLoading: loadingAlertStats } = useQuery({
    queryKey: ['alerts', 'statistics', refreshKey],
    queryFn: () => alertService.getAlertStatistics(),
    staleTime: 2 * 60 * 1000,
  });

  // Endpoint statistics
  const { data: endpointStats, isLoading: loadingEndpointStats } = useQuery({
    queryKey: ['endpoints', 'statistics', refreshKey],
    queryFn: () => endpointService.getEndpointsStatistics(),
    staleTime: 2 * 60 * 1000,
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetchMetrics();
  };

  const formatLogsByHourData = () => {
    return logsByHour.map(item => ({
      time: format(new Date(item.hour), timeRange === '24h' ? 'HH:mm' : 'MMM dd'),
      count: item.count,
      hour: item.hour
    }));
  };

  const formatLogsByLevelData = () => {
    return logsByLevel.map(item => ({
      level: item.level,
      count: item.count,
      color: LOG_LEVEL_COLORS[item.level]
    }));
  };

  const formatEndpointStatusData = () => {
    if (!endpointStats) return [];

    return [
      { name: 'Up', value: endpointStats.up, color: COLORS.success },
      { name: 'Down', value: endpointStats.down, color: COLORS.danger },
      { name: 'Unknown', value: endpointStats.unknown, color: COLORS.secondary }
    ].filter(item => item.value > 0);
  };

  const isLoadingAny = loadingMetrics || loadingLogsByLevel || loadingLogsByService ||
    loadingLogsByHour || loadingAlertStats || loadingEndpointStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your system metrics and performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingAny}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingAny ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.totalLogs?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.totalErrors || 0} errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Endpoints</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {endpointStats?.up || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {endpointStats?.total || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {alertStats?.activeEvents || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {alertStats?.totalRules || 0} rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.averageResponseTime ? `${Math.round(metrics.averageResponseTime)}ms` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Logs Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Logs Over Time</CardTitle>
            <CardDescription>
              Number of logs recorded over the selected time period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLogsByHour ? (
              <div className="h-[300px] flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={formatLogsByHourData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-md">
                            <p className="font-medium">{label}</p>
                            <p className="text-sm">
                              Logs: {payload[0].value?.toLocaleString()}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Logs by Level */}
        <Card>
          <CardHeader>
            <CardTitle>Logs by Level</CardTitle>
            <CardDescription>
              Distribution of log levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLogsByLevel ? (
              <div className="h-[300px] flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatLogsByLevelData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    label={({ level, count }) => `${level}: ${count.toLocaleString()}`}
                  >
                    {formatLogsByLevelData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle>Top Services</CardTitle>
            <CardDescription>
              Services generating the most logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLogsByService ? (
              <div className="h-[300px] flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={logsByService} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="service"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.accent} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Endpoint Status */}
        <Card>
          <CardHeader>
            <CardTitle>Endpoint Status</CardTitle>
            <CardDescription>
              Current status of monitored endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingEndpointStats ? (
              <div className="h-[300px] flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : formatEndpointStatusData().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatEndpointStatusData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {formatEndpointStatusData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No endpoint data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      {(alertStats || endpointStats) && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Alert Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Rules</span>
                  <span className="font-medium">{alertStats?.totalRules || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Events</span>
                  <span className="font-medium text-destructive">{alertStats?.activeEvents || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Resolved</span>
                  <span className="font-medium text-green-600">{alertStats?.resolvedEvents || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Endpoint Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="font-medium">
                    {endpointStats?.averageUptime ? `${(endpointStats.averageUptime * 100).toFixed(1)}%` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg Latency</span>
                  <span className="font-medium">
                    {endpointStats?.averageLatency ? `${Math.round(endpointStats.averageLatency)}ms` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Methods</span>
                  <span className="font-medium">
                    {endpointStats?.methodDistribution?.length || 0} types
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">System Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Error Rate</span>
                  <span className="font-medium">
                    {metrics?.totalLogs && metrics?.totalErrors
                      ? `${((metrics.totalErrors / metrics.totalLogs) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Services</span>
                  <span className="font-medium">{logsByService.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Data Points</span>
                  <span className="font-medium">{logsByHour.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}