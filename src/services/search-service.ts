// src/services/searchService.ts

import { apiClient } from "./api";

// Log Search
export interface LogSearchRequest {
    query?: string;
    levels?: ('ERROR' | 'WARN' | 'INFO' | 'DEBUG')[];
    services?: string[];
    sources?: string[];
    endpointIds?: string[];
    startDate?: string;
    endDate?: string;
    metadataFilters?: Record<string, string>;
    sortBy?: 'timestamp' | 'level' | 'service';
    sortDirection?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
}

export interface LogSearchResult {
    id: number;
    timestamp: string;
    level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
    service?: string;
    message?: string;
    source?: string;
    meta: string;
    endpointId?: string;
    endpointUrl?: string;
    relevance: number;
}

export interface SearchResultDto {
    logs: LogSearchResult[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    query?: string;
    executionTimeMs: number;
    filters: LogSearchRequest;
}

// Endpoint Search
export interface EndpointSearchRequest {
    query?: string;
    statuses?: ('up' | 'down' | 'unknown')[];
    methods?: string[];
    enabled?: boolean;
    minInterval?: number;
    maxInterval?: number;
    sortBy?: 'url' | 'status' | 'lastchecked' | 'created';
    sortDirection?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
}

export interface EndpointSearchResult {
    id: string;
    url: string;
    method: string;
    intervalSec: number;
    webhookUrl?: string;
    enabled: boolean;
    lastStatus: 'up' | 'down' | 'unknown';
    lastStatusCode?: number;
    lastLatencyMs?: number;
    lastCheckedAt?: string;
    error?: string;
    createdAt: string;
    updatedAt: string;
    relevance: number;
}

export interface EndpointSearchResultDto {
    endpoints: EndpointSearchResult[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    query?: string;
    filters: EndpointSearchRequest;
}

// Search Suggestions
export interface SearchSuggestions {
    services: string[];
    sources: string[];
    domains: string[];
    commonPatterns: string[];
}

// Saved Queries
export interface SavedQuery {
    id: string;
    name: string;
    query: string;
    filters: string;
    createdAt: string;
    updatedAt: string;
}

export interface SaveQueryRequest {
    name: string;
    query?: string;
    filters?: any;
}

class SearchService {
    // Log Search
    async searchLogs(request: LogSearchRequest): Promise<SearchResultDto> {
        const response = await apiClient.post<SearchResultDto>('/search/logs', request);
        return response.data;
    }

    // Endpoint Search
    async searchEndpoints(request: EndpointSearchRequest): Promise<EndpointSearchResultDto> {
        const response = await apiClient.post<EndpointSearchResultDto>('/search/endpoints', request);
        return response.data;
    }

    // Search Suggestions
    async getSearchSuggestions(
        type: 'logs' | 'endpoints' = 'logs',
        prefix?: string
    ): Promise<SearchSuggestions> {
        const params = new URLSearchParams();
        params.append('type', type);
        if (prefix) params.append('prefix', prefix);

        const query = params.toString();
        const endpoint = `/search/suggestions${query ? `?${query}` : ''}`;

        const response = await apiClient.get<SearchSuggestions>(endpoint);
        return response.data;
    }

    // Saved Queries
    async saveQuery(request: SaveQueryRequest): Promise<SavedQuery> {
        const response = await apiClient.post<SavedQuery>('/search/saved-queries', request);
        return response.data;
    }

    async getSavedQueries(): Promise<SavedQuery[]> {
        const response = await apiClient.get<SavedQuery[]>('/search/saved-queries');
        return response.data;
    }

    async getSavedQuery(id: string): Promise<SavedQuery> {
        const response = await apiClient.get<SavedQuery>(`/search/saved-queries/${id}`);
        return response.data;
    }

    async deleteSavedQuery(id: string): Promise<void> {
        await apiClient.delete(`/search/saved-queries/${id}`);
    }

    // Advanced Log Search with Builder Pattern
    createLogSearchBuilder(): LogSearchBuilder {
        return new LogSearchBuilder(this);
    }

    // Advanced Endpoint Search with Builder Pattern
    createEndpointSearchBuilder(): EndpointSearchBuilder {
        return new EndpointSearchBuilder(this);
    }
}

// Search Builder Classes for Fluent API
export class LogSearchBuilder {
    private request: LogSearchRequest = {};

    constructor(private searchService: SearchService) { }

    query(query: string): LogSearchBuilder {
        this.request.query = query;
        return this;
    }

    levels(levels: ('ERROR' | 'WARN' | 'INFO' | 'DEBUG')[]): LogSearchBuilder {
        this.request.levels = levels;
        return this;
    }

    services(services: string[]): LogSearchBuilder {
        this.request.services = services;
        return this;
    }

    sources(sources: string[]): LogSearchBuilder {
        this.request.sources = sources;
        return this;
    }

    endpoints(endpointIds: string[]): LogSearchBuilder {
        this.request.endpointIds = endpointIds;
        return this;
    }

    dateRange(startDate: string, endDate: string): LogSearchBuilder {
        this.request.startDate = startDate;
        this.request.endDate = endDate;
        return this;
    }

    metadata(filters: Record<string, string>): LogSearchBuilder {
        this.request.metadataFilters = filters;
        return this;
    }

    sort(by: 'timestamp' | 'level' | 'service', direction: 'asc' | 'desc' = 'desc'): LogSearchBuilder {
        this.request.sortBy = by;
        this.request.sortDirection = direction;
        return this;
    }

    page(page: number, pageSize: number = 50): LogSearchBuilder {
        this.request.page = page;
        this.request.pageSize = pageSize;
        return this;
    }

    async execute(): Promise<SearchResultDto> {
        return this.searchService.searchLogs(this.request);
    }

    getRequest(): LogSearchRequest {
        return { ...this.request };
    }
}

export class EndpointSearchBuilder {
    private request: EndpointSearchRequest = {};

    constructor(private searchService: SearchService) { }

    query(query: string): EndpointSearchBuilder {
        this.request.query = query;
        return this;
    }

    statuses(statuses: ('up' | 'down' | 'unknown')[]): EndpointSearchBuilder {
        this.request.statuses = statuses;
        return this;
    }

    methods(methods: string[]): EndpointSearchBuilder {
        this.request.methods = methods;
        return this;
    }

    enabled(enabled: boolean): EndpointSearchBuilder {
        this.request.enabled = enabled;
        return this;
    }

    intervalRange(min: number, max: number): EndpointSearchBuilder {
        this.request.minInterval = min;
        this.request.maxInterval = max;
        return this;
    }

    sort(by: 'url' | 'status' | 'lastchecked' | 'created', direction: 'asc' | 'desc' = 'desc'): EndpointSearchBuilder {
        this.request.sortBy = by;
        this.request.sortDirection = direction;
        return this;
    }

    page(page: number, pageSize: number = 50): EndpointSearchBuilder {
        this.request.page = page;
        this.request.pageSize = pageSize;
        return this;
    }

    async execute(): Promise<EndpointSearchResultDto> {
        return this.searchService.searchEndpoints(this.request);
    }

    getRequest(): EndpointSearchRequest {
        return { ...this.request };
    }
}

export const searchService = new SearchService();