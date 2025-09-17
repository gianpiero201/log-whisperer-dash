// src/services/endpointService.ts

import { EndpointStatus, PaginatedResponse } from "@/types/api";
import { apiClient } from "./api";

export interface Endpoint {
    id: string;
    userId: string;
    url: string;
    method: string;
    intervalSec: number;
    webhookUrl?: string;
    enabled: boolean;
    lastStatus: EndpointStatus;// 'up' | 'down' | 'unknown';
    lastStatusCode?: number;
    lastLatencyMs?: number;
    lastCheckedAt?: string;
    error?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateEndpointRequest {
    url: string;
    method?: string;
    intervalSec?: number;
    webhookUrl?: string;
}

export interface UpdateEndpointRequest {
    url?: string;
    method?: string;
    intervalSec?: number;
    webhookUrl?: string;
    enabled?: boolean;
}

export interface EndpointCheckResult {
    status: 'up' | 'down' | 'unknown';
    statusCode?: number;
    responseTimeMs?: number;
    error?: string;
}

export interface EndpointStats {
    endpointId: string;
    totalChecks: number;
    upChecks: number;
    downChecks: number;
    uptimePercentage: number;
    averageResponseTime: number;
    startDate: string;
    endDate: string;
}

export interface EndpointFilters {
    page?: number;
    pageSize?: number;
    status?: 'up' | 'down' | 'unknown';
    enabled?: boolean;
    search?: string;
}

class EndpointService {
    async getEndpoints(filters: EndpointFilters = {}): Promise<PaginatedResponse<Endpoint>> {
        const params = new URLSearchParams();

        if (filters.page) params.append('page', filters.page.toString());
        if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
        if (filters.status) params.append('status', filters.status);
        if (filters.enabled !== undefined) params.append('enabled', filters.enabled.toString());
        if (filters.search) params.append('search', filters.search);

        const query = params.toString();
        const endpoint = `/endpoints${query ? `?${query}` : ''}`;

        const response = await apiClient.get<PaginatedResponse<Endpoint>>(endpoint);
        return response.data;
    }

    async getEndpoint(id: string): Promise<Endpoint> {
        const response = await apiClient.get<Endpoint>(`/endpoints/${id}`);
        return response.data;
    }

    async createEndpoint(data: CreateEndpointRequest): Promise<Endpoint> {
        const response = await apiClient.post<Endpoint>('/endpoints', data);
        return response.data;
    }

    async updateEndpoint(id: string, data: UpdateEndpointRequest): Promise<Endpoint> {
        const response = await apiClient.put<Endpoint>(`/endpoints/${id}`, data);
        return response.data;
    }

    async deleteEndpoint(id: string): Promise<void> {
        await apiClient.delete(`/endpoints/${id}`);
    }

    async checkEndpoint(id: string): Promise<EndpointCheckResult> {
        const response = await apiClient.post<EndpointCheckResult>(`/endpoints/${id}/check`);
        return response.data;
    }

    async getEndpointStats(
        id: string,
        startDate?: string,
        endDate?: string
    ): Promise<EndpointStats> {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const query = params.toString();
        const endpoint = `/endpoints/${id}/stats${query ? `?${query}` : ''}`;

        const response = await apiClient.get<EndpointStats>(endpoint);
        return response.data;
    }

    async toggleEndpoint(id: string, enabled: boolean): Promise<Endpoint> {
        return this.updateEndpoint(id, { enabled });
    }

    async toggleMultipleEndpoints(id: string[], enabled: boolean): Promise<Endpoint[]> {
        let endpointResults: Endpoint[] = [];

        await id.forEach(async endpoint => {
            endpointResults.push(await this.updateEndpoint(endpoint, { enabled }));
        });

        return endpointResults;
    }
}

export const endpointService = new EndpointService();