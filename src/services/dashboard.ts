import type {
    ApiResponse,
    DashboardMetrics,
    HourlyLogCount,
    LogLevelCount,
    ServiceLogCount
} from '../types/api';
import { alertService } from './alerts';
import { apiClient } from './api';
import { endpointService } from './endpoints';

class DashboardService {

    // ==================== MAIN DASHBOARD METRICS ====================

    /**
     * Obtém métricas consolidadas do dashboard
     */
    async getDashboardMetrics(): Promise<DashboardMetrics> {
        const response = await apiClient.get<ApiResponse<DashboardMetrics>>('/dashboard/metrics');

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch dashboard metrics');
    }

    /**
     * Obtém métricas em tempo real (dados mais frequentes)
     */
    async getRealTimeMetrics(): Promise<{
        activeAlerts: number;
        recentErrors: number;
        endpointsDown: number;
        systemStatus: 'healthy' | 'warning' | 'critical';
        lastUpdate: string;
    }> {
        const response = await apiClient.get<ApiResponse<any>>('/dashboard/realtime');

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch real-time metrics');
    }

    // ==================== LOGS ANALYTICS ====================

    /**
     * Obtém distribuição de logs por nível
     */
    async getLogsByLevel(
        startDate?: Date,
        endDate?: Date
    ): Promise<LogLevelCount[]> {
        const params: any = {};
        if (startDate) params.startDate = startDate.toISOString();
        if (endDate) params.endDate = endDate.toISOString();

        const response = await apiClient.get<ApiResponse<LogLevelCount[]>>(
            '/dashboard/logs-by-level',
            params
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch logs by level');
    }

    /**
     * Obtém distribuição de logs por serviço
     */
    async getLogsByService(
        startDate?: Date,
        endDate?: Date,
        limit: number = 10
    ): Promise<ServiceLogCount[]> {
        const params: any = { limit };
        if (startDate) params.startDate = startDate.toISOString();
        if (endDate) params.endDate = endDate.toISOString();

        const response = await apiClient.get<ApiResponse<ServiceLogCount[]>>(
            '/dashboard/logs-by-service',
            params
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch logs by service');
    }

    /**
     * Obtém distribuição de logs por hora
     */
    async getLogsByHour(
        startDate?: Date,
        endDate?: Date
    ): Promise<HourlyLogCount[]> {
        const params: any = {};
        if (startDate) params.startDate = startDate.toISOString();
        if (endDate) params.endDate = endDate.toISOString();

        const response = await apiClient.get<ApiResponse<HourlyLogCount[]>>(
            '/dashboard/logs-by-hour',
            params
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch logs by hour');
    }

    // ==================== SYSTEM HEALTH ====================

    /**
     * Obtém status geral do sistema
     */
    async getSystemHealth(): Promise<{
        overall: 'healthy' | 'warning' | 'critical';
        components: Array<{
            name: string;
            status: 'healthy' | 'warning' | 'critical';
            message: string;
            lastCheck: string;
        }>;
        uptime: string;
        version: string;
    }> {
        const response = await apiClient.get<ApiResponse<any>>('/dashboard/health');

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch system health');
    }

    /**
     * Obtém métricas de performance
     */
    async getPerformanceMetrics(period: '1h' | '24h' | '7d' = '24h'): Promise<{
        averageResponseTime: number;
        requestsPerSecond: number;
        errorRate: number;
        memoryUsage: number;
        cpuUsage: number;
        timeline: Array<{
            timestamp: string;
            responseTime: number;
            requests: number;
            errors: number;
        }>;
    }> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/performance',
            { period }
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch performance metrics');
    }

    // ==================== COMPOSITE METRICS ====================

    /**
     * Obtém métricas completas para dashboard principal
     * Combina dados de múltiplas fontes
     */
    async getComprehensiveDashboard(period: '1h' | '24h' | '7d' = '24h'): Promise<{
        overview: {
            totalLogs: number;
            totalErrors: number;
            activeEndpoints: number;
            activeAlerts: number;
            systemHealth: string;
        };
        logs: {
            byLevel: LogLevelCount[];
            byService: ServiceLogCount[];
            timeline: HourlyLogCount[];
            recentErrors: any[];
        };
        endpoints: {
            total: number;
            up: number;
            down: number;
            averageUptime: number;
            recentDowntime: any[];
        };
        alerts: {
            totalRules: number;
            activeRules: number;
            recentEvents: any[];
            resolvedToday: number;
        };
        performance: {
            avgResponseTime: number;
            requestsPerSecond: number;
            errorRate: number;
        };
    }> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/comprehensive',
            { period }
        );

        if (response.success && response.data) {
            return response.data;
        }

        // Fallback: aggregate data from individual services
        try {
            return await this.aggregateMetrics(period);
        } catch (error) {
            throw new Error('Failed to fetch comprehensive dashboard data');
        }
    }

    /**
     * Agrega métricas de diferentes serviços (fallback method)
     */
    private async aggregateMetrics(period: string): Promise<any> {
        const [
            dashboardMetrics,
            alertStats,
            endpointStats,
            systemHealth
        ] = await Promise.all([
            this.getDashboardMetrics(),
            alertService.getAlertStatistics(),
            endpointService.getEndpointsStatistics(),
            this.getSystemHealth()
        ]);

        return {
            overview: {
                totalLogs: dashboardMetrics.totalLogs,
                totalErrors: dashboardMetrics.totalErrors,
                activeEndpoints: endpointStats.up,
                activeAlerts: alertStats.activeEvents,
                systemHealth: systemHealth.overall
            },
            logs: {
                byLevel: dashboardMetrics.logsByLevel,
                byService: dashboardMetrics.logsByService,
                timeline: dashboardMetrics.logsByHour,
                recentErrors: []
            },
            endpoints: {
                total: endpointStats.total,
                up: endpointStats.up,
                down: endpointStats.down,
                averageUptime: endpointStats.averageUptime,
                recentDowntime: []
            },
            alerts: {
                totalRules: alertStats.totalRules,
                activeRules: alertStats.activeRules,
                recentEvents: [],
                resolvedToday: alertStats.resolvedEvents
            },
            performance: {
                avgResponseTime: dashboardMetrics.averageResponseTime,
                requestsPerSecond: 0,
                errorRate: 0
            }
        };
    }

    // ==================== TRENDING ANALYSIS ====================

    /**
     * Obtém tendências de logs (crescimento/decrescimento)
     */
    async getLogTrends(period: '24h' | '7d' | '30d' = '7d'): Promise<{
        totalLogs: {
            current: number;
            previous: number;
            change: number;
            changePercent: number;
        };
        errorLogs: {
            current: number;
            previous: number;
            change: number;
            changePercent: number;
        };
        topServices: Array<{
            service: string;
            current: number;
            previous: number;
            change: number;
        }>;
    }> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/trends/logs',
            { period }
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch log trends');
    }

    /**
     * Obtém tendências de alertas
     */
    async getAlertTrends(period: '24h' | '7d' | '30d' = '7d'): Promise<{
        totalEvents: {
            current: number;
            previous: number;
            change: number;
            changePercent: number;
        };
        resolutionRate: {
            current: number;
            previous: number;
            change: number;
        };
        topRules: Array<{
            ruleName: string;
            events: number;
            change: number;
        }>;
    }> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/trends/alerts',
            { period }
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch alert trends');
    }

    // ==================== REPORTS ====================

    /**
     * Gera relatório executivo
     */
    async generateExecutiveReport(
        startDate: Date,
        endDate: Date,
        format: 'json' | 'pdf' = 'json'
    ): Promise<any> {
        const params = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            format
        };

        if (format === 'pdf') {
            const response = await apiClient.getAxiosInstance().get('/dashboard/reports/executive', {
                params,
                responseType: 'blob'
            });

            return new Blob([response.data], { type: 'application/pdf' });
        } else {
            const response = await apiClient.get<ApiResponse<any>>('/dashboard/reports/executive', params);

            if (response.success && response.data) {
                return response.data;
            }

            throw new Error(response.message || 'Failed to generate executive report');
        }
    }

    /**
     * Gera relatório técnico detalhado
     */
    async generateTechnicalReport(
        startDate: Date,
        endDate: Date,
        includeDetails: boolean = true
    ): Promise<{
        summary: any;
        logs: any;
        alerts: any;
        endpoints: any;
        recommendations: string[];
        generatedAt: string;
    }> {
        const params = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            includeDetails
        };

        const response = await apiClient.get<ApiResponse<any>>('/dashboard/reports/technical', params);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to generate technical report');
    }

    // ==================== NOTIFICATIONS ====================

    /**
     * Obtém configurações de notificações do dashboard
     */
    async getNotificationSettings(): Promise<{
        email: {
            enabled: boolean;
            recipients: string[];
            frequency: 'realtime' | 'hourly' | 'daily';
            threshold: 'low' | 'medium' | 'high';
        };
        webhook: {
            enabled: boolean;
            url: string;
            events: string[];
        };
        inApp: {
            enabled: boolean;
            showBadges: boolean;
            autoRefresh: boolean;
        };
    }> {
        const response = await apiClient.get<ApiResponse<any>>('/dashboard/notifications/settings');

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch notification settings');
    }

    /**
     * Atualiza configurações de notificações
     */
    async updateNotificationSettings(settings: any): Promise<void> {
        const response = await apiClient.put<ApiResponse<void>>('/dashboard/notifications/settings', settings);

        if (!response.success) {
            throw new Error(response.message || 'Failed to update notification settings');
        }
    }

    // ==================== CUSTOMIZATION ====================

    /**
     * Obtém configurações de layout do dashboard
     */
    async getDashboardLayout(): Promise<{
        widgets: Array<{
            id: string;
            type: string;
            position: { x: number; y: number; w: number; h: number };
            config: any;
        }>;
        theme: 'light' | 'dark' | 'auto';
        refreshInterval: number;
    }> {
        const response = await apiClient.get<ApiResponse<any>>('/dashboard/layout');

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch dashboard layout');
    }

    /**
     * Salva configurações de layout do dashboard
     */
    async saveDashboardLayout(layout: any): Promise<void> {
        const response = await apiClient.post<ApiResponse<void>>('/dashboard/layout', layout);

        if (!response.success) {
            throw new Error(response.message || 'Failed to save dashboard layout');
        }
    }

    // ==================== EXPORT UTILITIES ====================

    /**
     * Exporta dados do dashboard
     */
    async exportDashboardData(
        startDate: Date,
        endDate: Date,
        format: 'csv' | 'json' | 'excel' = 'csv',
        sections: string[] = ['logs', 'alerts', 'endpoints']
    ): Promise<Blob> {
        const params = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            format,
            sections: sections.join(',')
        };

        const response = await apiClient.getAxiosInstance().get('/dashboard/export', {
            params,
            responseType: 'blob'
        });

        const mimeType = {
            csv: 'text/csv',
            json: 'application/json',
            excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }[format];

        return new Blob([response.data], { type: mimeType });
    }
}

// Create and export singleton instance
export const dashboardService = new DashboardService();

// Export class for testing
export default DashboardService;