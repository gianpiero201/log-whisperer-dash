// src/hooks/use-backend-monitor-integrated.ts - Hook integrado com o backend real
import { toast } from '@/components/ui/use-toast';
import { apiClient } from '@/services/api';
import { EndpointCheckResult } from '@/services/endpoints';
import { EndpointStatus, PaginatedResponse } from '@/types/api';
import { useCallback, useEffect, useState } from 'react';

// Usar a mesma API base que configuramos
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Interface do endpoint do backend
interface BackendEndpoint {
    id: string;
    userId: string;
    url: string;
    method: string;
    intervalSec: number;
    webhookUrl?: string;
    enabled: boolean;
    lastStatus: EndpointStatus; //'up' | 'down' | 'unknown';
    lastStatusCode?: number;
    lastLatencyMs?: number;
    lastCheckedAt?: string;
    error?: string;
    createdAt: string;
    updatedAt: string;
}

// Service para comunicação com a API
class BackendEndpointService {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async getEndpoints(): Promise<PaginatedResponse<BackendEndpoint>> {
        return (await apiClient.get<PaginatedResponse<BackendEndpoint>>('/endpoints')).data;
    }

    async createEndpoint(data: {
        url: string;
        method?: string;
        intervalSec?: number;
        webhookUrl?: string;
    }): Promise<BackendEndpoint> {
        return (await apiClient.post<BackendEndpoint>('/endpoints', data)).data;
    }

    async updateEndpoint(id: string, data: Partial<BackendEndpoint>): Promise<BackendEndpoint> {
        return (await apiClient.put<BackendEndpoint>(`/endpoints/${id}`, data)).data;
    }

    async deleteEndpoint(id: string): Promise<void> {
        await apiClient.delete(`/endpoints/${id}`);
    }

    async checkEndpoint(id: string): Promise<EndpointCheckResult> {
        return (await apiClient.post<EndpointCheckResult>(`/endpoints/${id}/check`)).data;
    }
}

// Instância do service
const endpointService = new BackendEndpointService(API_BASE_URL);

export function useBackendMonitor() {


    const [endpoints, setEndpoints] = useState<BackendEndpoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [intervals, setIntervals] = useState<{ [key: string]: NodeJS.Timeout }>({});

    // Carregar endpoints na inicialização
    useEffect(() => {
        loadEndpoints();
    }, []);

    // Configurar intervalos automáticos
    useEffect(() => {
        const intervals: { [key: string]: NodeJS.Timeout } = {};

        endpoints.forEach(endpoint => {
            if (endpoint.enabled && endpoint.intervalSec > 0) {
                intervals[endpoint.id] = setInterval(() => {
                    checkNow(endpoint.id);
                }, endpoint.intervalSec * 1000);
            }
        });

        // Cleanup
        return () => {
            Object.values(intervals).forEach(clearInterval);
        };
    }, [endpoints]);

    const loadEndpoints = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await endpointService.getEndpoints();
            setEndpoints(response.items || []);

            console.log(`Carregados ${response.items?.length || 0} endpoints`);
        } catch (err: any) {
            setError(err.message);
            console.error('Erro ao carregar endpoints:', err);

            toast({
                title: "Erro ao carregar endpoints",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, []);

    const addEndpoint = useCallback(async (data: {
        url: string;
        method: 'GET' | 'HEAD' | 'POST';
        intervalSec: number;
        webhookUrl?: string;
    }) => {
        try {
            setLoading(true);

            const newEndpoint = await endpointService.createEndpoint({
                url: data.url.trim(),
                method: data.method,
                intervalSec: Math.max(data.intervalSec, 30), // Mínimo 30s
                webhookUrl: data.webhookUrl?.trim() || undefined
            });

            setEndpoints(prev => [...prev, newEndpoint]);

            toast({
                title: "Endpoint adicionado",
                description: `${newEndpoint.url} foi adicionado ao monitoramento.`
            });

            // Fazer check inicial após 2 segundos
            setTimeout(() => {
                checkNow(newEndpoint.id);
            }, 2000);

            console.log('Endpoint criado:', newEndpoint);
        } catch (err: any) {
            setError(err.message);
            console.error('Erro ao adicionar endpoint:', err);
            throw err; // Re-throw para o componente tratar
        } finally {
            setLoading(false);
        }
    }, []);

    const removeEndpoint = useCallback(async (id: string) => {
        try {
            const endpoint = endpoints.find(ep => ep.id === id);

            await endpointService.deleteEndpoint(id);

            // Limpar intervalo se existe
            if (intervals[id]) {
                clearInterval(intervals[id]);
                setIntervals(prev => {
                    const { [id]: removed, ...rest } = prev;
                    return rest;
                });
            }

            setEndpoints(prev => prev.filter(ep => ep.id !== id));

            toast({
                title: "Endpoint removido",
                description: `${endpoint?.url || 'Endpoint'} foi removido do monitoramento.`
            });

            console.log('Endpoint removido:', id);
        } catch (err: any) {
            setError(err.message);
            console.error('Erro ao remover endpoint:', err);

            toast({
                title: "Erro ao remover endpoint",
                description: err.message,
                variant: "destructive"
            });
        }
    }, [endpoints, intervals]);

    const updateEndpoint = useCallback(async (id: string, data: Partial<BackendEndpoint>) => {
        try {
            const updated = await endpointService.updateEndpoint(id, data);

            setEndpoints(prev => prev.map(ep => ep.id === id ? updated : ep));

            toast({
                title: "Endpoint atualizado",
                description: "As configurações foram salvas no servidor."
            });

            console.log('Endpoint atualizado:', updated);
        } catch (err: any) {
            setError(err.message);
            console.error('Erro ao atualizar endpoint:', err);

            toast({
                title: "Erro ao atualizar endpoint",
                description: err.message,
                variant: "destructive"
            });
        }
    }, []);

    const checkNow = useCallback(async (id: string) => {
        const endpoint = endpoints.find(ep => ep.id === id);
        if (!endpoint) {
            console.warn('Endpoint não encontrado para check:', id);
            return;
        }

        try {
            console.log(`Iniciando health check para: ${endpoint.url}`);

            const result = await endpointService.checkEndpoint(id);
            console.log(`endpoint result`, result);

            // Atualizar o estado local com o resultado
            setEndpoints(prev => prev.map(ep => {
                if (ep.id === id) {
                    return {
                        ...ep,
                        lastStatus: result.status,
                        lastStatusCode: result.statusCode,
                        lastLatencyMs: result.responseTimeMs,
                        lastCheckedAt: new Date().toISOString(),
                        error: result.error || undefined
                    };
                }
                return ep;
            }));

            // Feedback de sucesso apenas para checks manuais
            const isManualCheck = !intervals[id]; // Se não há intervalo, é manual
            if (isManualCheck) {
                const status = result.status === EndpointStatus.UP ? 'Online' :
                    result.status === EndpointStatus.DOWN ? 'Offline' : 'Status desconhecido';
                const latency = result.responseTimeMs ? ` (${result.responseTimeMs}ms)` : '';
            }

            console.log(`Health check concluído para ${endpoint.url}:`, result);
        } catch (err: any) {
            console.error(`Erro no health check para ${endpoint.url}:`, err);

            // Marcar como erro no estado local
            setEndpoints(prev => prev.map(ep => {
                if (ep.id === id) {
                    return {
                        ...ep,
                        lastStatus: EndpointStatus.DOWN,
                        lastCheckedAt: new Date().toISOString(),
                        error: err.message
                    };
                }
                return ep;
            }));
        }
    }, [endpoints, intervals]);

    // Cleanup ao desmontar
    useEffect(() => {
        return () => {
            Object.values(intervals).forEach(clearInterval);
        };
    }, []);

    return {
        endpoints,
        loading,
        error,
        addEndpoint,
        removeEndpoint,
        updateEndpoint,
        checkNow,
        refetch: loadEndpoints
    };
}