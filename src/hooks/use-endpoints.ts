// src/hooks/use-endpoints.ts - Hook para gerenciar endpoints
import { EndpointStatus } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from '../components/ui/use-toast';
import { endpointService, type CreateEndpointRequest, type Endpoint, type UpdateEndpointRequest } from '../services/endpoints';

export interface UseEndpointsOptions {
    page?: number;
    pageSize?: number;
    status?: 'up' | 'down' | 'unknown';
    enabled?: boolean;
    search?: string;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

export interface UseEndpointsResult {
    // Data
    endpoints: Endpoint[];
    loading: boolean;
    error: string | null;
    totalCount: number;
    totalPages: number;
    currentPage: number;

    // Actions
    addEndpoint: (data: CreateEndpointRequest) => Promise<void>;
    updateEndpoint: (id: string, data: UpdateEndpointRequest) => Promise<void>;
    removeEndpoint: (id: string) => Promise<void>;
    toggleEndpoint: (id: string, enabled: boolean) => Promise<void>;
    checkEndpoint: (id: string) => Promise<void>;
    refetch: () => void;

    // Filters
    setFilters: (filters: Partial<UseEndpointsOptions>) => void;
    filters: UseEndpointsOptions;
}

const QUERY_KEY = 'endpoints';

export function useEndpoints(options: UseEndpointsOptions = {}): UseEndpointsResult {
    const queryClient = useQueryClient();

    const [filters, setFilters] = useState<UseEndpointsOptions>({
        page: 1,
        pageSize: 50,
        autoRefresh: true,
        refreshInterval: 30000, // 30 seconds
        ...options
    });

    // Main query for fetching endpoints
    const {
        data: endpointsData,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: [QUERY_KEY, filters],
        queryFn: () => endpointService.getEndpoints({
            page: filters.page,
            pageSize: filters.pageSize,
            status: filters.status,
            enabled: filters.enabled,
            search: filters.search
        }),
        refetchInterval: filters.autoRefresh ? filters.refreshInterval : false,
        refetchIntervalInBackground: false,
        staleTime: 30000,
    });

    // Create endpoint mutation
    const createMutation = useMutation({
        mutationFn: (data: CreateEndpointRequest) => endpointService.createEndpoint(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast({
                title: 'Endpoint criado',
                description: 'O endpoint foi adicionado com sucesso.',
                variant: 'default'
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro ao criar endpoint',
                description: error.message,
                variant: 'destructive'
            });
        }
    });

    // Update endpoint mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateEndpointRequest }) =>
            endpointService.updateEndpoint(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast({
                title: 'Endpoint atualizado',
                description: 'As alterações foram salvas com sucesso.',
                variant: 'default'
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro ao atualizar endpoint',
                description: error.message,
                variant: 'destructive'
            });
        }
    });

    // Delete endpoint mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => endpointService.deleteEndpoint(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast({
                title: 'Endpoint removido',
                description: 'O endpoint foi removido com sucesso.',
                variant: 'default'
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro ao remover endpoint',
                description: error.message,
                variant: 'destructive'
            });
        }
    });

    // Check endpoint mutation
    const checkMutation = useMutation({
        mutationFn: (id: string) => endpointService.checkEndpoint(id),
        onSuccess: (result, id) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            const statusText = result.status === EndpointStatus.UP ? 'Online' :
                result.status === EndpointStatus.DOWN ? 'Offline' : 'Desconhecido';
            toast({
                title: 'Verificação concluída',
                description: `Status: ${statusText}${result.responseTimeMs ? ` (${result.responseTimeMs}ms)` : ''}`,
                variant: result.status === EndpointStatus.UP ? 'default' : 'destructive'
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro na verificação',
                description: error.message,
                variant: 'destructive'
            });
        }
    });

    // Action handlers
    const addEndpoint = useCallback(async (data: CreateEndpointRequest) => {
        await createMutation.mutateAsync(data);
    }, [createMutation]);

    const updateEndpoint = useCallback(async (id: string, data: UpdateEndpointRequest) => {
        await updateMutation.mutateAsync({ id, data });
    }, [updateMutation]);

    const removeEndpoint = useCallback(async (id: string) => {
        await deleteMutation.mutateAsync(id);
    }, [deleteMutation]);

    const toggleEndpoint = useCallback(async (id: string, enabled: boolean) => {
        await updateMutation.mutateAsync({ id, data: { enabled } });
    }, [updateMutation]);

    const checkNow = useCallback(async (id: string) => {
        await checkMutation.mutateAsync(id);
    }, [checkMutation]);

    const updateFilters = useCallback((newFilters: Partial<UseEndpointsOptions>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    return {
        // Data
        endpoints: endpointsData?.items || [],
        loading: isLoading || createMutation.isPending || updateMutation.isPending ||
            deleteMutation.isPending || checkMutation.isPending,
        error: error?.message || null,
        totalCount: endpointsData?.total || 0,
        totalPages: endpointsData?.totalPages || 0,
        currentPage: endpointsData?.page || 1,

        // Actions
        addEndpoint,
        updateEndpoint,
        removeEndpoint,
        toggleEndpoint,
        checkEndpoint: checkNow,
        refetch,

        // Filters
        setFilters: updateFilters,
        filters
    };
}
