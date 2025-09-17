// src/services/dashboardService.ts

import { apiClient } from "./api";

export interface DashboardMetrics {
    totalEndpoints: number;
    activeEndpoints: number;
    totalAlertRules: number;
    activeAlertRules: number;
    totalLogs: number;
    logsLast24h: number;
    errorLogsLast24h: number;
    warningLogsLast24h: number;
    endpointStatusCounts: EndpointStatusCount[];
    activeAlerts: number;
    alertsLast24h: number;
    recentLogs: RecentLog[];
    lastUpdated: string;
}

export interface EndpointStatusCount {
    status: 'up' | 'down' | 'unknown';
    count: number;
}

export interface RecentLog {
    id: number;
    timestamp: string;
    level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
    service?: string;
    message?: string;
    source?: string;
}

export interface LogChartData {
    period: string;
    startDate: string;
    endDate: string;
    dataPoints: LogChartPoint[];
    totalCount: number;
    level?: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
}

export interface LogChartPoint {
    timestamp: string;
    count: number;
    errorCount: number;
    warnCount: number;
    infoCount: number;
    debugCount: number;
}

export interface EndpointChartData {
    period: string;
    startDate: string;
    endDate: string;
    endpointData: EndpointStatusHistory[];
}

export interface EndpointStatusHistory {
    endpointId: string;
    endpointUrl: string;
    statusHistory: EndpointStatusPoint[];
}

export interface EndpointStatusPoint {
    timestamp: string;
    status: string;
    responseTime?: number;
}

export interface EndpointPerformance {
    period: string;
    startDate: string;
    endDate: string;
    endpoints: EndpointPerformanceItem[];
    overallUptimePercentage: number;
    averageResponseTime: number;
}

export interface EndpointPerformanceItem {
    endpointId: string;
    url: string;
    uptimePercentage: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    totalChecks: number;
    successfulChecks: number;
    lastStatus: 'up' | 'down' | 'unknown';
    lastCheckedAt?: string;
}

export interface ActivitySummary {
    activities: ActivityItem[];
    totalActivities: number;
    period: string;
    lastUpdated: string;
}

export interface ActivityItem {
    id: string;
    type: 'log' | 'alert' | 'endpoint';
    timestamp: string;
    title: string;
    description: string;
    level: string;
    source?: string;
    endpointUrl?: string;
    status?: string;
}

class DashboardService {
    async getMetrics(): Promise<DashboardMetrics> {
        const response = await apiClient.get<DashboardMetrics>('/dashboard/metrics');
        return response.data;
    }

    async getLogsChartData(
        period: '1h' | '24h' | '7d' | '30d' = '24h',
        level?: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'
    ): Promise<LogChartData> {
        const params = new URLSearchParams();
        params.append('period', period);
        if (level) params.append('level', level);

        const query = params.toString();
        const endpoint = `/dashboard/logs/chart${query ? `?${query}` : ''}`;

        const response = await apiClient.get<LogChartData>(endpoint);
        return response.data;
    }

    async getEndpointsChartData(
        period: '1h' | '24h' | '7d' | '30d' = '24h'
    ): Promise<EndpointChartData> {
        const params = new URLSearchParams();
        params.append('period', period);

        const query = params.toString();
        const endpoint = `/dashboard/endpoints/chart${query ? `?${query}` : ''}`;

        const response = await apiClient.get<EndpointChartData>(endpoint);
        return response.data;
    }

    async getEndpointPerformance(
        period: '1h' | '24h' | '7d' | '30d' = '24h'
    ): Promise<EndpointPerformance> {
        const params = new URLSearchParams();
        params.append('period', period);

        const query = params.toString();
        const endpoint = `/dashboard/endpoints/performance${query ? `?${query}` : ''}`;

        const response = await apiClient.get<EndpointPerformance>(endpoint);
        return response.data;
    }

    async getActivitySummary(limit: number = 50): Promise<ActivitySummary> {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());

        const query = params.toString();
        const endpoint = `/dashboard/activity${query ? `?${query}` : ''}`;

        const response = await apiClient.get<ActivitySummary>(endpoint);
        return response.data;
    }
}

export const dashboardService = new DashboardService();