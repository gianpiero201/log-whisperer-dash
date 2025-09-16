import type {
    ApiResponse,
    CreateEndpointRequest,
    Endpoint,
    UpdateEndpointRequest
} from '../types/api';
import { apiClient } from './api';

class EndpointService {

    // ==================== ENDPOINT MANAGEMENT ====================

    /**
     * Busca todos os endpoints do usuário
     */
    async getEndpoints(): Promise<Endpoint[]> {
        const response = await apiClient.get<ApiResponse<Endpoint[]>>('/endpoints');

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch endpoints');
    }

    /**
     * Busca um endpoint específico por ID
     */
    async getEndpointById(id: string): Promise<Endpoint> {
        const response = await apiClient.get<ApiResponse<Endpoint>>(`/endpoints/${id}`);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch endpoint');
    }

    /**
     * Cria um novo endpoint
     */
    async createEndpoint(endpointData: CreateEndpointRequest): Promise<Endpoint> {
        const response = await apiClient.post<ApiResponse<Endpoint>>('/endpoints', endpointData);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to create endpoint');
    }

    /**
     * Atualiza um endpoint existente
     */
    async updateEndpoint(id: string, endpointData: UpdateEndpointRequest): Promise<Endpoint> {
        const response = await apiClient.put<ApiResponse<Endpoint>>(
            `/endpoints/${id}`,
            endpointData
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to update endpoint');
    }

    /**
     * Remove um endpoint
     */
    async deleteEndpoint(id: string): Promise<void> {
        const response = await apiClient.delete<ApiResponse<void>>(`/endpoints/${id}`);

        if (!response.success) {
            throw new Error(response.message || 'Failed to delete endpoint');
        }
    }

    /**
     * Ativa/Desativa um endpoint
     */
    async toggleEndpoint(id: string, enabled: boolean): Promise<Endpoint> {
        const response = await apiClient.patch<ApiResponse<Endpoint>>(
            `/endpoints/${id}/toggle`,
            { enabled }
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to toggle endpoint');
    }

    // ==================== ENDPOINT MONITORING ====================

    /**
     * Testa um endpoint manualmente
     */
    async testEndpoint(id: string): Promise<{
        status: 'up' | 'down';
        statusCode?: number;
        latency: number;
        error?: string;
        timestamp: string;
    }> {
        const response = await apiClient.post<ApiResponse<any>>(`/endpoints/${id}/test`);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to test endpoint');
    }

    /**
     * Testa um URL antes de criar o endpoint
     */
    async testUrl(url: string, method: string = 'GET'): Promise<{
        status: 'up' | 'down';
        statusCode?: number;
        latency: number;
        error?: string;
        timestamp: string;
    }> {
        const response = await apiClient.post<ApiResponse<any>>('/endpoints/test-url', {
            url,
            method
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to test URL');
    }

    /**
     * Obtém histórico de status de um endpoint
     */
    async getEndpointHistory(
        id: string,
        startDate?: Date,
        endDate?: Date,
        limit: number = 100
    ): Promise<Array<{
        timestamp: string;
        status: 'up' | 'down';
        statusCode?: number;
        latency?: number;
        error?: string;
    }>> {
        const params: any = { limit };
        if (startDate) params.startDate = startDate.toISOString();
        if (endDate) params.endDate = endDate.toISOString();

        const response = await apiClient.get<ApiResponse<any>>(
            `/endpoints/${id}/history`,
            params
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch endpoint history');
    }

    /**
     * Obtém métricas de um endpoint
     */
    async getEndpointMetrics(id: string, period: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
        uptime: number;
        averageLatency: number;
        totalChecks: number;
        successfulChecks: number;
        failedChecks: number;
        lastCheck: string;
        status: 'up' | 'down' | 'unknown';
    }> {
        const response = await apiClient.get<ApiResponse<any>>(
            `/endpoints/${id}/metrics`,
            { period }
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch endpoint metrics');
    }

    // ==================== BULK OPERATIONS ====================

    /**
     * Remove múltiplos endpoints
     */
    async deleteMultipleEndpoints(endpointIds: string[]): Promise<void> {
        const response = await apiClient.post<ApiResponse<void>>('/endpoints/delete-batch', {
            ids: endpointIds
        });

        if (!response.success) {
            throw new Error(response.message || 'Failed to delete endpoints');
        }
    }

    /**
     * Ativa/Desativa múltiplos endpoints
     */
    async toggleMultipleEndpoints(endpointIds: string[], enabled: boolean): Promise<void> {
        const response = await apiClient.post<ApiResponse<void>>('/endpoints/toggle-batch', {
            ids: endpointIds,
            enabled
        });

        if (!response.success) {
            throw new Error(response.message || 'Failed to toggle endpoints');
        }
    }

    /**
     * Testa múltiplos endpoints
     */
    async testMultipleEndpoints(endpointIds: string[]): Promise<Array<{
        id: string;
        status: 'up' | 'down';
        statusCode?: number;
        latency: number;
        error?: string;
        timestamp: string;
    }>> {
        const response = await apiClient.post<ApiResponse<any>>('/endpoints/test-batch', {
            ids: endpointIds
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to test endpoints');
    }

    // ==================== FILTERING & SEARCH ====================

    /**
     * Busca endpoints com filtros
     */
    async getFilteredEndpoints(filters: {
        status?: 'up' | 'down' | 'unknown';
        method?: string;
        enabled?: boolean;
        search?: string;
    } = {}): Promise<Endpoint[]> {
        const response = await apiClient.get<ApiResponse<Endpoint[]>>(
            '/endpoints/filtered',
            filters
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch filtered endpoints');
    }

    /**
     * Busca apenas endpoints ativos (enabled = true)
     */
    async getActiveEndpoints(): Promise<Endpoint[]> {
        return this.getFilteredEndpoints({ enabled: true });
    }

    /**
     * Busca apenas endpoints com problemas (status = down)
     */
    async getDownEndpoints(): Promise<Endpoint[]> {
        return this.getFilteredEndpoints({ status: 'down' });
    }

    /**
     * Busca endpoints por método HTTP
     */
    async getEndpointsByMethod(method: string): Promise<Endpoint[]> {
        return this.getFilteredEndpoints({ method });
    }

    // ==================== STATISTICS & ANALYTICS ====================

    /**
     * Obtém estatísticas gerais de endpoints
     */
    async getEndpointsStatistics(): Promise<{
        total: number;
        active: number;
        inactive: number;
        up: number;
        down: number;
        unknown: number;
        averageUptime: number;
        averageLatency: number;
        methodDistribution: Array<{ method: string; count: number }>;
        statusDistribution: Array<{ status: string; count: number }>;
    }> {
        const response = await apiClient.get<ApiResponse<any>>('/endpoints/statistics');

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch endpoints statistics');
    }

    /**
     * Obtém uptime geral de todos os endpoints
     */
    async getOverallUptime(period: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
        uptime: number;
        totalChecks: number;
        successfulChecks: number;
        failedChecks: number;
        period: string;
    }> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/endpoints/uptime',
            { period }
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch overall uptime');
    }

    // ==================== WEBHOOKS ====================

    /**
     * Obtém histórico de webhooks de um endpoint
     */
    async getEndpointWebhooks(
        id: string,
        limit: number = 50
    ): Promise<Array<{
        id: string;
        targetUrl: string;
        success: boolean;
        statusCode?: number;
        responseTime: number;
        error?: string;
        sentAt: string;
        payload: any;
    }>> {
        const response = await apiClient.get<ApiResponse<any>>(
            `/endpoints/${id}/webhooks`,
            { limit }
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch endpoint webhooks');
    }

    /**
     * Testa webhook de um endpoint
     */
    async testEndpointWebhook(id: string): Promise<{
        success: boolean;
        statusCode?: number;
        responseTime: number;
        error?: string;
        timestamp: string;
    }> {
        const response = await apiClient.post<ApiResponse<any>>(`/endpoints/${id}/webhook/test`);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to test endpoint webhook');
    }

    // ==================== EXPORT & IMPORT ====================

    /**
     * Exporta endpoints
     */
    async exportEndpoints(format: 'json' | 'csv' = 'json'): Promise<Blob> {
        const response = await apiClient.getAxiosInstance().get('/endpoints/export', {
            params: { format },
            responseType: 'blob'
        });

        const mimeType = format === 'json' ? 'application/json' : 'text/csv';
        return new Blob([response.data], { type: mimeType });
    }

    /**
     * Importa endpoints
     */
    async importEndpoints(file: File): Promise<{
        imported: number;
        errors: string[];
        warnings: string[];
    }> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.getAxiosInstance().post('/endpoints/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (response.data.success) {
            return response.data.data;
        }

        throw new Error(response.data.message || 'Failed to import endpoints');
    }

    // ==================== REAL-TIME MONITORING ====================

    /**
     * Inicia monitoramento de um endpoint
     */
    async startMonitoring(id: string): Promise<void> {
        const response = await apiClient.post<ApiResponse<void>>(`/endpoints/${id}/start-monitoring`);

        if (!response.success) {
            throw new Error(response.message || 'Failed to start monitoring');
        }
    }

    /**
     * Para monitoramento de um endpoint
     */
    async stopMonitoring(id: string): Promise<void> {
        const response = await apiClient.post<ApiResponse<void>>(`/endpoints/${id}/stop-monitoring`);

        if (!response.success) {
            throw new Error(response.message || 'Failed to stop monitoring');
        }
    }

    /**
     * Obtém status em tempo real de todos os endpoints
     */
    async getRealTimeStatus(): Promise<Array<{
        id: string;
        url: string;
        status: 'up' | 'down' | 'unknown';
        lastChecked: string;
        latency?: number;
        enabled: boolean;
    }>> {
        const response = await apiClient.get<ApiResponse<any>>('/endpoints/realtime-status');

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch real-time status');
    }
}

// Create and export singleton instance
export const endpointService = new EndpointService();

// Export class for testing
export default EndpointService;