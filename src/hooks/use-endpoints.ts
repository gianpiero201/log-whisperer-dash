import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { endpointService } from '../services/endpoints';
import type {
    CreateEndpointRequest,
    Endpoint,
    UpdateEndpointRequest
} from '../types/api';
import { QUERY_KEYS } from '../utils/constants';

// ==================== ENDPOINT MANAGEMENT HOOKS ====================

/**
 * Hook para buscar todos os endpoints
 */
export function useEndpoints() {
    return useQuery({
        queryKey: QUERY_KEYS.ENDPOINTS_LIST,
        queryFn: () => endpointService.getEndpoints(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Hook para buscar um endpoint específico
 */
export function useEndpoint(id: string) {
    return useQuery({
        queryKey: QUERY_KEYS.ENDPOINTS_DETAIL(id),
        queryFn: () => endpointService.getEndpointById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook para endpoints filtrados
 */
export function useFilteredEndpoints(filters: {
    status?: 'up' | 'down' | 'unknown';
    method?: string;
    enabled?: boolean;
    search?: string;
} = {}) {
    return useQuery({
        queryKey: [...QUERY_KEYS.ENDPOINTS_LIST, 'filtered', filters],
        queryFn: () => endpointService.getFilteredEndpoints(filters),
        staleTime: 1 * 60 * 1000, // 1 minute
    });
}

/**
 * Hook para endpoints ativos
 */
export function useActiveEndpoints() {
    return useQuery({
        queryKey: [...QUERY_KEYS.ENDPOINTS_LIST, 'active'],
        queryFn: () => endpointService.getActiveEndpoints(),
        staleTime: 1 * 60 * 1000, // 1 minute
    });
}

/**
 * Hook para endpoints com problemas
 */
export function useDownEndpoints() {
    return useQuery({
        queryKey: [...QUERY_KEYS.ENDPOINTS_LIST, 'down'],
        queryFn: () => endpointService.getDownEndpoints(),
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60 * 1000, // Auto-refresh every minute
    });
}

/**
 * Hook para criar novo endpoint
 */
export function useCreateEndpoint() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (endpointData: CreateEndpointRequest) =>
            endpointService.createEndpoint(endpointData),
        onSuccess: (newEndpoint) => {
            // Update cache with new endpoint
            queryClient.setQueryData<Endpoint[]>(
                QUERY_KEYS.ENDPOINTS_LIST,
                (old) => old ? [...old, newEndpoint] : [newEndpoint]
            );

            // Invalidate related queries
            queryClient.invalidateQueries({
                queryKey: ['endpoints']
            });

            toast.success('Endpoint created successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create endpoint');
        },
    });
}

/**
 * Hook para atualizar endpoint
 */
export function useUpdateEndpoint() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateEndpointRequest }) =>
            endpointService.updateEndpoint(id, data),
        onSuccess: (updatedEndpoint, { id }) => {
            // Update specific endpoint in cache
            queryClient.setQueryData<Endpoint>(
                QUERY_KEYS.ENDPOINTS_DETAIL(id),
                updatedEndpoint
            );

            // Update endpoints list
            queryClient.setQueryData<Endpoint[]>(
                QUERY_KEYS.ENDPOINTS_LIST,
                (old) => old?.map(endpoint => endpoint.id === id ? updatedEndpoint : endpoint) || []
            );

            // Invalidate related queries
            queryClient.invalidateQueries({
                queryKey: ['endpoints']
            });

            toast.success('Endpoint updated successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update endpoint');
        },
    });
}

/**
 * Hook para deletar endpoint
 */
export function useDeleteEndpoint() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => endpointService.deleteEndpoint(id),
        onSuccess: (_, id) => {
            // Remove from endpoints list
            queryClient.setQueryData<Endpoint[]>(
                QUERY_KEYS.ENDPOINTS_LIST,
                (old) => old?.filter(endpoint => endpoint.id !== id) || []
            );

            // Remove specific endpoint from cache
            queryClient.removeQueries({
                queryKey: QUERY_KEYS.ENDPOINTS_DETAIL(id)
            });

            // Invalidate related queries
            queryClient.invalidateQueries({
                queryKey: ['endpoints']
            });

            toast.success('Endpoint deleted successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete endpoint');
        },
    });
}

/**
 * Hook para ativar/desativar endpoint
 */
export function useToggleEndpoint() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
            endpointService.toggleEndpoint(id, enabled),
        onSuccess: (updatedEndpoint, { id, enabled }) => {
            // Update specific endpoint in cache
            queryClient.setQueryData<Endpoint>(
                QUERY_KEYS.ENDPOINTS_DETAIL(id),
                updatedEndpoint
            );

            // Update endpoints list
            queryClient.setQueryData<Endpoint[]>(
                QUERY_KEYS.ENDPOINTS_LIST,
                (old) => old?.map(endpoint => endpoint.id === id ? updatedEndpoint : endpoint) || []
            );

            const message = enabled ? 'Endpoint enabled!' : 'Endpoint disabled!';
            toast.success(message);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to toggle endpoint');
        },
    });
}

// ==================== MONITORING HOOKS ====================

/**
 * Hook para testar endpoint
 */
export function useTestEndpoint() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => endpointService.testEndpoint(id),
        onSuccess: (result, id) => {
            // Optionally update endpoint status in cache
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.ENDPOINTS_DETAIL(id)
            });

            const status = result.status === 'up' ? 'successful' : 'failed';
            toast.success(`Endpoint test ${status}! Latency: ${result.latency}ms`);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to test endpoint');
        },
    });
}

/**
 * Hook para testar URL antes de criar endpoint
 */
export function useTestUrl() {
    return useMutation({
        mutationFn: ({ url, method = 'GET' }: { url: string; method?: string }) =>
            endpointService.testUrl(url, method),
        onSuccess: (result) => {
            const status = result.status === 'up' ? 'reachable' : 'unreachable';
            const message = result.status === 'up'
                ? `URL is ${status}! Latency: ${result.latency}ms`
                : `URL is ${status}: ${result.error}`;

            if (result.status === 'up') {
                toast.success(message);
            } else {
                toast.error(message);
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to test URL');
        },
    });
}

/**
 * Hook para histórico de endpoint
 */
export function useEndpointHistory(
    id: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
) {
    return useQuery({
        queryKey: ['endpoints', 'history', id, { startDate, endDate, limit }],
        queryFn: () => endpointService.getEndpointHistory(id, startDate, endDate, limit),
        enabled: !!id,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Hook para métricas de endpoint
 */
export function useEndpointMetrics(id: string, period: '1h' | '24h' | '7d' | '30d' = '24h') {
    return useQuery({
        queryKey: ['endpoints', 'metrics', id, period],
        queryFn: () => endpointService.getEndpointMetrics(id, period),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
    });
}

/**
 * Hook para status em tempo real
 */
export function useRealTimeEndpointStatus() {
    return useQuery({
        queryKey: ['endpoints', 'realtime-status'],
        queryFn: () => endpointService.getRealTimeStatus(),
        staleTime: 10 * 1000, // 10 seconds
        refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    });
}

// ==================== BULK OPERATIONS HOOKS ====================

/**
 * Hook para operações em lote em endpoints
 */
export function useBulkEndpointOperations() {
    const queryClient = useQueryClient();

    const deleteMultiple = useMutation({
        mutationFn: (endpointIds: string[]) => endpointService.deleteMultipleEndpoints(endpointIds),
        onSuccess: (_, endpointIds) => {
            // Remove deleted endpoints from cache
            queryClient.setQueryData<Endpoint[]>(
                QUERY_KEYS.ENDPOINTS_LIST,
                (old) => old?.filter(endpoint => !endpointIds.includes(endpoint.id)) || []
            );

            queryClient.invalidateQueries({
                queryKey: ['endpoints']
            });

            toast.success(`${endpointIds.length} endpoints deleted!`);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete endpoints');
        },
    });

    const toggleMultiple = useMutation({
        mutationFn: ({ endpointIds, enabled }: { endpointIds: string[]; enabled: boolean }) =>
            endpointService.toggleMultipleEndpoints(endpointIds, enabled),
        onSuccess: (_, { endpointIds, enabled }) => {
            // Invalidate queries to refetch updated data
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.ENDPOINTS_LIST
            });

            const action = enabled ? 'enabled' : 'disabled';
            toast.success(`${endpointIds.length} endpoints ${action}!`);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to toggle endpoints');
        },
    });

    const testMultiple = useMutation({
        mutationFn: (endpointIds: string[]) => endpointService.testMultipleEndpoints(endpointIds),
        onSuccess: (results, endpointIds) => {
            const upCount = results.filter(r => r.status === 'up').length;
            const downCount = results.filter(r => r.status === 'down').length;

            toast.success(`Test completed: ${upCount} up, ${downCount} down`);

            // Invalidate endpoints to refresh status
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.ENDPOINTS_LIST
            });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to test endpoints');
        },
    });

    return {
        deleteMultiple,
        toggleMultiple,
        testMultiple,
    };
}

// ==================== STATISTICS HOOKS ====================

/**
 * Hook para estatísticas de endpoints
 */
export function useEndpointsStatistics() {
    return useQuery({
        queryKey: ['endpoints', 'statistics'],
        queryFn: () => endpointService.getEndpointsStatistics(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Hook para uptime geral
 */
export function useOverallUptime(period: '1h' | '24h' | '7d' | '30d' = '24h') {
    return useQuery({
        queryKey: ['endpoints', 'uptime', period],
        queryFn: () => endpointService.getOverallUptime(period),
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
    });
}

// ==================== WEBHOOK HOOKS ====================

/**
 * Hook para webhooks de endpoint
 */
export function useEndpointWebhooks(id: string, limit: number = 50) {
    return useQuery({
        queryKey: ['endpoints', 'webhooks', id, { limit }],
        queryFn: () => endpointService.getEndpointWebhooks(id, limit),
        enabled: !!id,
        staleTime: 1 * 60 * 1000, // 1 minute
    });
}

/**
 * Hook para testar webhook de endpoint
 */
export function useTestEndpointWebhook() {
    return useMutation({
        mutationFn: (id: string) => endpointService.testEndpointWebhook(id),
        onSuccess: (result) => {
            if (result.success) {
                toast.success(`Webhook test successful! Response time: ${result.responseTime}ms`);
            } else {
                toast.error(`Webhook test failed: ${result.error}`);
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to test webhook');
        },
    });
}

// ==================== MONITORING CONTROL HOOKS ====================

/**
 * Hook para controlar monitoramento
 */
export function useEndpointMonitoringControl() {
    const queryClient = useQueryClient();

    const startMonitoring = useMutation({
        mutationFn: (id: string) => endpointService.startMonitoring(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.ENDPOINTS_DETAIL(id)
            });
            toast.success('Monitoring started!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to start monitoring');
        },
    });

    const stopMonitoring = useMutation({
        mutationFn: (id: string) => endpointService.stopMonitoring(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.ENDPOINTS_DETAIL(id)
            });
            toast.success('Monitoring stopped!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to stop monitoring');
        },
    });

    return {
        startMonitoring,
        stopMonitoring,
    };
}

// ==================== IMPORT/EXPORT HOOKS ====================

/**
 * Hook para exportar endpoints
 */
export function useExportEndpoints() {
    return useMutation({
        mutationFn: (format: 'json' | 'csv' = 'json') =>
            endpointService.exportEndpoints(format),
        onSuccess: (blob, format) => {
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `endpoints.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Endpoints exported successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to export endpoints');
        },
    });
}

/**
 * Hook para importar endpoints
 */
export function useImportEndpoints() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => endpointService.importEndpoints(file),
        onSuccess: (result) => {
            // Invalidate endpoints to refetch
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.ENDPOINTS_LIST
            });

            const { imported, errors, warnings } = result;

            if (imported > 0) {
                toast.success(`${imported} endpoints imported successfully!`);
            }

            if (errors.length > 0) {
                errors.forEach(error => toast.error(error));
            }

            if (warnings.length > 0) {
                warnings.forEach(warning => toast(warning, {
                    icon: '⚠️',
                    duration: 6000
                }));
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to import endpoints');
        },
    });
}

// ==================== COMPOUND HOOKS ====================

/**
 * Hook combinado para dashboard de endpoints
 */
export function useEndpointsDashboard() {
    const endpoints = useEndpoints();
    const statistics = useEndpointsStatistics();
    const downEndpoints = useDownEndpoints();
    const realtimeStatus = useRealTimeEndpointStatus();

    return {
        endpoints,
        statistics,
        downEndpoints,
        realtimeStatus,
        isLoading: endpoints.isLoading || statistics.isLoading,
        hasError: endpoints.error || statistics.error,
    };
}

/**
 * Hook para gerenciamento completo de endpoints
 */
export function useEndpointManagement(endpointId?: string) {
    const endpoints = useEndpoints();
    const endpoint = useEndpoint(endpointId || '');
    const createEndpoint = useCreateEndpoint();
    const updateEndpoint = useUpdateEndpoint();
    const deleteEndpoint = useDeleteEndpoint();
    const toggleEndpoint = useToggleEndpoint();
    const testEndpoint = useTestEndpoint();
    const testUrl = useTestUrl();

    return {
        // Data
        endpoints: endpoints.data || [],
        endpoint: endpoint.data,

        // Loading states
        isLoadingEndpoints: endpoints.isLoading,
        isLoadingEndpoint: endpoint.isLoading,

        // Error states
        endpointsError: endpoints.error,
        endpointError: endpoint.error,

        // Mutations
        createEndpoint,
        updateEndpoint,
        deleteEndpoint,
        toggleEndpoint,
        testEndpoint,
        testUrl,

        // Refetch functions
        refetchEndpoints: endpoints.refetch,
        refetchEndpoint: endpoint.refetch,
    };
}