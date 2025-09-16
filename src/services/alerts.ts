import type {
    AlertEvent,
    AlertRule,
    ApiResponse,
    CreateAlertRuleRequest,
    UpdateAlertRuleRequest
} from '../types/api';
import { apiClient } from './api';

class AlertService {

    // ==================== ALERT RULES ====================

    /**
     * Busca todas as regras de alerta do usuário
     */
    async getAlertRules(): Promise<AlertRule[]> {
        const response = await apiClient.get<ApiResponse<AlertRule[]>>('/alerts/rules');

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch alert rules');
    }

    /**
     * Busca uma regra de alerta específica por ID
     */
    async getAlertRuleById(id: string): Promise<AlertRule> {
        const response = await apiClient.get<ApiResponse<AlertRule>>(`/alerts/rules/${id}`);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch alert rule');
    }

    /**
     * Cria uma nova regra de alerta
     */
    async createAlertRule(alertData: CreateAlertRuleRequest): Promise<AlertRule> {
        const response = await apiClient.post<ApiResponse<AlertRule>>('/alerts/rules', alertData);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to create alert rule');
    }

    /**
     * Atualiza uma regra de alerta existente
     */
    async updateAlertRule(id: string, alertData: UpdateAlertRuleRequest): Promise<AlertRule> {
        const response = await apiClient.put<ApiResponse<AlertRule>>(
            `/alerts/rules/${id}`,
            alertData
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to update alert rule');
    }

    /**
     * Remove uma regra de alerta
     */
    async deleteAlertRule(id: string): Promise<void> {
        const response = await apiClient.delete<ApiResponse<void>>(`/alerts/rules/${id}`);

        if (!response.success) {
            throw new Error(response.message || 'Failed to delete alert rule');
        }
    }

    /**
     * Ativa/Desativa uma regra de alerta
     */
    async toggleAlertRule(id: string, enabled: boolean): Promise<AlertRule> {
        const response = await apiClient.patch<ApiResponse<AlertRule>>(
            `/alerts/rules/${id}/toggle`,
            { enabled }
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to toggle alert rule');
    }

    // ==================== ALERT EVENTS ====================

    /**
     * Busca todos os eventos de alerta
     */
    async getAlertEvents(params?: {
        ruleId?: string;
        status?: 'active' | 'resolved';
        limit?: number;
        offset?: number;
    }): Promise<AlertEvent[]> {
        const response = await apiClient.get<ApiResponse<AlertEvent[]>>('/alerts/events', params);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch alert events');
    }

    /**
     * Busca eventos de uma regra específica
     */
    async getAlertEventsByRule(ruleId: string, limit: number = 50): Promise<AlertEvent[]> {
        return this.getAlertEvents({ ruleId, limit });
    }

    /**
     * Busca apenas eventos ativos
     */
    async getActiveAlertEvents(): Promise<AlertEvent[]> {
        return this.getAlertEvents({ status: 'active' });
    }

    /**
     * Busca apenas eventos resolvidos
     */
    async getResolvedAlertEvents(limit: number = 100): Promise<AlertEvent[]> {
        return this.getAlertEvents({ status: 'resolved', limit });
    }

    /**
     * Resolve um evento de alerta
     */
    async resolveAlertEvent(eventId: string): Promise<AlertEvent> {
        const response = await apiClient.patch<ApiResponse<AlertEvent>>(
            `/alerts/events/${eventId}/resolve`
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to resolve alert event');
    }

    /**
     * Remove um evento de alerta
     */
    async deleteAlertEvent(eventId: string): Promise<void> {
        const response = await apiClient.delete<ApiResponse<void>>(`/alerts/events/${eventId}`);

        if (!response.success) {
            throw new Error(response.message || 'Failed to delete alert event');
        }
    }

    // ==================== BULK OPERATIONS ====================

    /**
     * Remove múltiplas regras de alerta
     */
    async deleteMultipleAlertRules(ruleIds: string[]): Promise<void> {
        const response = await apiClient.post<ApiResponse<void>>('/alerts/rules/delete-batch', {
            ids: ruleIds
        });

        if (!response.success) {
            throw new Error(response.message || 'Failed to delete alert rules');
        }
    }

    /**
     * Resolve múltiplos eventos de alerta
     */
    async resolveMultipleAlertEvents(eventIds: string[]): Promise<void> {
        const response = await apiClient.post<ApiResponse<void>>('/alerts/events/resolve-batch', {
            ids: eventIds
        });

        if (!response.success) {
            throw new Error(response.message || 'Failed to resolve alert events');
        }
    }

    /**
     * Ativa/Desativa múltiplas regras
     */
    async toggleMultipleAlertRules(ruleIds: string[], enabled: boolean): Promise<void> {
        const response = await apiClient.post<ApiResponse<void>>('/alerts/rules/toggle-batch', {
            ids: ruleIds,
            enabled
        });

        if (!response.success) {
            throw new Error(response.message || 'Failed to toggle alert rules');
        }
    }

    // ==================== STATISTICS & ANALYTICS ====================

    /**
     * Obtém estatísticas de alertas
     */
    async getAlertStatistics(): Promise<{
        totalRules: number;
        activeRules: number;
        totalEvents: number;
        activeEvents: number;
        resolvedEvents: number;
        rulesByServerity: Array<{ severity: string; count: number }>;
    }> {
        const response = await apiClient.get<ApiResponse<any>>('/alerts/statistics');

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch alert statistics');
    }

    /**
     * Obtém histórico de eventos por período
     */
    async getAlertHistory(
        startDate: Date,
        endDate: Date,
        groupBy: 'hour' | 'day' | 'week' = 'day'
    ): Promise<Array<{ date: string; count: number }>> {
        const params = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            groupBy
        };

        const response = await apiClient.get<ApiResponse<any>>('/alerts/history', params);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch alert history');
    }

    // ==================== TESTING & VALIDATION ====================

    /**
     * Testa uma regra de alerta
     */
    async testAlertRule(ruleData: CreateAlertRuleRequest): Promise<{
        isValid: boolean;
        matches: number;
        errors?: string[];
        sampleMatches?: any[];
    }> {
        const response = await apiClient.post<ApiResponse<any>>('/alerts/rules/test', ruleData);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to test alert rule');
    }

    /**
     * Valida sintaxe de query de alerta
     */
    async validateAlertQuery(query: string): Promise<{
        isValid: boolean;
        errors?: string[];
        suggestions?: string[];
    }> {
        const response = await apiClient.post<ApiResponse<any>>('/alerts/validate-query', {
            query
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to validate alert query');
    }

    // ==================== EXPORT & IMPORT ====================

    /**
     * Exporta regras de alerta
     */
    async exportAlertRules(format: 'json' | 'yaml' = 'json'): Promise<Blob> {
        const response = await apiClient.getAxiosInstance().get('/alerts/rules/export', {
            params: { format },
            responseType: 'blob'
        });

        const mimeType = format === 'json' ? 'application/json' : 'application/x-yaml';
        return new Blob([response.data], { type: mimeType });
    }

    /**
     * Importa regras de alerta
     */
    async importAlertRules(file: File): Promise<{
        imported: number;
        errors: string[];
        warnings: string[];
    }> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.getAxiosInstance().post('/alerts/rules/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (response.data.success) {
            return response.data.data;
        }

        throw new Error(response.data.message || 'Failed to import alert rules');
    }

    // ==================== REAL-TIME UPDATES ====================

    /**
     * Obtém contagem de eventos ativos em tempo real
     */
    async getActiveEventCount(): Promise<number> {
        const response = await apiClient.get<ApiResponse<{ count: number }>>('/alerts/events/active/count');

        if (response.success && response.data) {
            return response.data.count;
        }

        throw new Error(response.message || 'Failed to get active event count');
    }

    /**
     * Obtém eventos recentes (últimos N eventos)
     */
    async getRecentAlertEvents(limit: number = 20): Promise<AlertEvent[]> {
        const response = await apiClient.get<ApiResponse<AlertEvent[]>>(
            '/alerts/events/recent',
            { limit }
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch recent alert events');
    }
}

// Create and export singleton instance
export const alertService = new AlertService();

// Export class for testing
export default AlertService;