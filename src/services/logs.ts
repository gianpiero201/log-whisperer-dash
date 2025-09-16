import type {
    ApiResponse,
    CreateLogRequest,
    LogEntry,
    LogQuery,
    PaginatedResponse
} from '../types/api';
import { PAGINATION } from '../utils/constants';
import { apiClient } from './api';

class LogService {

    /**
     * Busca logs com paginação e filtros
     */
    async getLogs(query: LogQuery = {}): Promise<PaginatedResponse<LogEntry>> {
        const params = {
            page: query.page || PAGINATION.DEFAULT_PAGE,
            pageSize: query.pageSize || PAGINATION.DEFAULT_PAGE_SIZE,
            ...query
        };

        const response = await apiClient.get<ApiResponse<PaginatedResponse<LogEntry>>>(
            '/logs',
            params
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch logs');
    }

    /**
     * Busca um log específico por ID
     */
    async getLogById(id: number): Promise<LogEntry> {
        const response = await apiClient.get<ApiResponse<LogEntry>>(`/logs/${id}`);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch log');
    }

    /**
     * Cria um novo log
     */
    async createLog(logData: CreateLogRequest): Promise<LogEntry> {
        const response = await apiClient.post<ApiResponse<LogEntry>>('/logs', logData);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to create log');
    }

    /**
     * Remove um log por ID
     */
    async deleteLog(id: number): Promise<void> {
        const response = await apiClient.delete<ApiResponse<void>>(`/logs/${id}`);

        if (!response.success) {
            throw new Error(response.message || 'Failed to delete log');
        }
    }

    /**
     * Busca logs por nível específico
     */
    async getLogsByLevel(level: string, limit: number = 100): Promise<LogEntry[]> {
        const query: LogQuery = {
            level: level as any,
            pageSize: limit,
            page: 1
        };

        const result = await this.getLogs(query);
        return result.items;
    }

    /**
     * Busca logs por serviço
     */
    async getLogsByService(service: string, limit: number = 100): Promise<LogEntry[]> {
        const query: LogQuery = {
            service,
            pageSize: limit,
            page: 1
        };

        const result = await this.getLogs(query);
        return result.items;
    }

    /**
     * Busca logs por endpoint
     */
    async getLogsByEndpoint(endpointId: string, limit: number = 100): Promise<LogEntry[]> {
        const query: LogQuery = {
            endpointId,
            pageSize: limit,
            page: 1
        };

        const result = await this.getLogs(query);
        return result.items;
    }

    /**
     * Busca logs em um período específico
     */
    async getLogsByDateRange(
        startDate: Date,
        endDate: Date,
        query: Partial<LogQuery> = {}
    ): Promise<PaginatedResponse<LogEntry>> {
        const searchQuery: LogQuery = {
            ...query,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            page: query.page || 1,
            pageSize: query.pageSize || PAGINATION.DEFAULT_PAGE_SIZE
        };

        return this.getLogs(searchQuery);
    }

    /**
     * Busca logs com texto específico
     */
    async searchLogs(
        searchText: string,
        query: Partial<LogQuery> = {}
    ): Promise<PaginatedResponse<LogEntry>> {
        const searchQuery: LogQuery = {
            ...query,
            search: searchText,
            page: query.page || 1,
            pageSize: query.pageSize || PAGINATION.DEFAULT_PAGE_SIZE
        };

        return this.getLogs(searchQuery);
    }

    /**
     * Obtém estatísticas de logs
     */
    async getLogStats(startDate?: Date, endDate?: Date) {
        const params: any = {};
        if (startDate) params.startDate = startDate.toISOString();
        if (endDate) params.endDate = endDate.toISOString();

        const response = await apiClient.get<ApiResponse<any>>('/logs/stats', params);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch log statistics');
    }

    /**
     * Remove logs em lote
     */
    async deleteLogs(logIds: number[]): Promise<void> {
        const response = await apiClient.post<ApiResponse<void>>('/logs/delete-batch', {
            ids: logIds
        });

        if (!response.success) {
            throw new Error(response.message || 'Failed to delete logs');
        }
    }

    /**
     * Exporta logs para CSV
     */
    async exportLogs(query: LogQuery = {}): Promise<Blob> {
        const params = {
            ...query,
            format: 'csv'
        };

        const response = await apiClient.getAxiosInstance().get('/logs/export', {
            params,
            responseType: 'blob'
        });

        return new Blob([response.data], { type: 'text/csv' });
    }

    /**
     * Obtém logs recentes (últimos N logs)
     */
    async getRecentLogs(limit: number = 50): Promise<LogEntry[]> {
        const query: LogQuery = {
            page: 1,
            pageSize: limit
        };

        const result = await this.getLogs(query);
        return result.items;
    }
}

// Create and export singleton instance
export const logService = new LogService();

// Export class for testing
export default LogService;