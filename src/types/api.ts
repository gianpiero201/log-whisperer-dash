// Tipos da API baseados no backend .NET
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errors: string[];
}

export interface PaginatedResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

// Auth Types
export interface User {
    id: string;
    displayName?: string;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    displayName: string;
}

export interface AuthResponse {
    token: string;
    refreshToken: string;
    user: User;
}

// Log Types
export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

export interface LogEntry {
    id: number;
    userId: string;
    endpointId?: string;
    timestamp: string;
    level: LogLevel;
    service?: string;
    message?: string;
    source?: string;
    meta: string;
    endpoint?: Endpoint;
}

export interface CreateLogRequest {
    level: LogLevel;
    service?: string;
    message: string;
    source?: string;
    endpointId?: string;
    meta?: string;
}

export interface LogQuery {
    page?: number;
    pageSize?: number;
    level?: LogLevel;
    service?: string;
    source?: string;
    endpointId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
}

// Endpoint Types
export enum EndpointStatus {
    UP = 'up',
    DOWN = 'down',
    UNKNOWN = 'unknown'
}

export interface Endpoint {
    id: string;
    userId: string;
    url: string;
    method: string;
    intervalSec: number;
    webhookUrl?: string;
    enabled: boolean;
    lastStatus: EndpointStatus;
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
    enabled?: boolean;
}

export interface UpdateEndpointRequest {
    url: string;
    method: string;
    intervalSec: number;
    webhookUrl?: string;
    enabled: boolean;
}

// Alert Types
export enum AlertSeverity {
    INFO = 'info',
    WARNING = 'warning',
    CRITICAL = 'critical'
}

export enum AlertStatus {
    ACTIVE = 'active',
    RESOLVED = 'resolved'
}

export interface AlertRule {
    id: string;
    userId: string;
    name: string;
    query?: string;
    severity: AlertSeverity;
    enabled: boolean;
    throttleSeconds: number;
    createdAt: string;
    updatedAt: string;
}

export interface AlertEvent {
    id: string;
    ruleId: string;
    endpointId?: string;
    occurredAt: string;
    status: AlertStatus;
    message?: string;
    payload?: string;
    resolvedAt?: string;
    rule: AlertRule;
    endpoint?: Endpoint;
}

export interface CreateAlertRuleRequest {
    name: string;
    query?: string;
    severity?: AlertSeverity;
    throttleSeconds?: number;
    enabled?: boolean;
}

export interface UpdateAlertRuleRequest {
    name: string;
    query?: string;
    severity: AlertSeverity;
    throttleSeconds: number;
    enabled: boolean;
}

// Dashboard Types
export interface DashboardMetrics {
    totalLogs: number;
    totalErrors: number;
    activeEndpoints: number;
    activeAlerts: number;
    averageResponseTime: number;
    logsByLevel: LogLevelCount[];
    logsByService: ServiceLogCount[];
    logsByHour: HourlyLogCount[];
}

export interface LogLevelCount {
    level: LogLevel;
    count: number;
}

export interface ServiceLogCount {
    service: string;
    count: number;
}

export interface HourlyLogCount {
    hour: string;
    count: number;
}

// User Settings Types
export interface UserSettings {
    userId: string;
    autoRefresh: boolean;
    refreshInterval: number;
    theme: string;
    timezone: string;
    logRetentionDays: number;
    maxLogSizeMb: number;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateUserSettingsRequest {
    autoRefresh: boolean;
    refreshInterval: number;
    theme: string;
    timezone: string;
    logRetentionDays: number;
    maxLogSizeMb: number;
}