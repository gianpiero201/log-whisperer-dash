// src/services/alertService.ts

import { AlertSeverity, PaginatedResponse } from "@/types/api";
import { apiClient } from "./api";

export interface AlertRule {
    id: string;
    userId: string;
    name: string;
    query?: string;
    severity: AlertSeverity;// 'info' | 'warning' | 'error' | 'critical';
    enabled: boolean;
    throttleSeconds: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAlertRuleRequest {
    name: string;
    query?: string;
    severity?: 'info' | 'warning' | 'error' | 'critical';
    throttleSeconds?: number;
}

export interface UpdateAlertRuleRequest {
    name?: string;
    query?: string;
    severity?: 'info' | 'warning' | 'error' | 'critical';
    enabled?: boolean;
    throttleSeconds?: number;
}

export interface AlertEvent {
    id: string;
    ruleId: string;
    ruleName: string;
    endpointId?: string;
    endpointUrl?: string;
    occurredAt: string;
    status: 'active' | 'resolved';
    message?: string;
    payload?: string;
    resolvedAt?: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface AlertTestResult {
    ruleId: string;
    ruleName: string;
    executedAt: string;
    success: boolean;
    matchCount: number;
    message?: string;
    error?: string;
}

export interface AlertStats {
    totalRules: number;
    enabledRules: number;
    totalEvents: number;
    activeEvents: number;
    resolvedEvents: number;
    eventsBySeverity: AlertSeverityCount[];
    startDate: string;
    endDate: string;
}

export interface AlertSeverityCount {
    severity: 'info' | 'warning' | 'error' | 'critical';
    count: number;
}

export interface AlertRuleFilters {
    page?: number;
    pageSize?: number;
    enabled?: boolean;
    severity?: 'info' | 'warning' | 'error' | 'critical';
}

export interface AlertEventFilters {
    page?: number;
    pageSize?: number;
    status?: 'active' | 'resolved';
    ruleId?: string;
    startDate?: string;
    endDate?: string;
}

class AlertService {
    // Alert Rules
    async getAlertRules(filters: AlertRuleFilters = {}): Promise<PaginatedResponse<AlertRule>> {
        const params = new URLSearchParams();

        if (filters.page) params.append('page', filters.page.toString());
        if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
        if (filters.enabled !== undefined) params.append('enabled', filters.enabled.toString());
        if (filters.severity) params.append('severity', filters.severity);

        const query = params.toString();
        const endpoint = `/alerts/rules${query ? `?${query}` : ''}`;

        const response = await apiClient.get<PaginatedResponse<AlertRule>>(endpoint);
        return response.data;
    }

    async getAlertRule(id: string): Promise<AlertRule> {
        const response = await apiClient.get<AlertRule>(`/alerts/rules/${id}`);
        return response.data;
    }

    async createAlertRule(data: CreateAlertRuleRequest): Promise<AlertRule> {
        const response = await apiClient.post<AlertRule>('/alerts/rules', data);
        return response.data;
    }

    async updateAlertRule(id: string, data: UpdateAlertRuleRequest): Promise<AlertRule> {
        const response = await apiClient.put<AlertRule>(`/alerts/rules/${id}`, data);
        return response.data;
    }

    async deleteAlertRule(id: string): Promise<void> {
        await apiClient.delete(`/alerts/rules/${id}`);
    }

    async testAlertRule(id: string): Promise<AlertTestResult> {
        const response = await apiClient.post<AlertTestResult>(`/alerts/rules/${id}/test`);
        return response.data;
    }

    async toggleAlertRule(id: string, enabled: boolean): Promise<AlertRule> {
        return this.updateAlertRule(id, { enabled });
    }

    // Alert Events
    async getAlertEvents(filters: AlertEventFilters = {}): Promise<PaginatedResponse<AlertEvent>> {
        const params = new URLSearchParams();

        if (filters.page) params.append('page', filters.page.toString());
        if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
        if (filters.status) params.append('status', filters.status);
        if (filters.ruleId) params.append('ruleId', filters.ruleId);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);

        const query = params.toString();
        const endpoint = `/alerts/events${query ? `?${query}` : ''}`;

        const response = await apiClient.get<PaginatedResponse<AlertEvent>>(endpoint);
        return response.data;
    }

    async resolveAlertEvent(id: string): Promise<AlertEvent> {
        const response = await apiClient.post<AlertEvent>(`/alerts/events/${id}/resolve`);
        return response.data;
    }

    // Alert Statistics
    async getAlertStats(startDate?: string, endDate?: string): Promise<AlertStats> {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const query = params.toString();
        const endpoint = `/alerts/stats${query ? `?${query}` : ''}`;

        const response = await apiClient.get<AlertStats>(endpoint);
        return response.data;
    }
}

export const alertService = new AlertService();