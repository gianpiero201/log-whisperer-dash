import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { alertService } from '../services/alerts';
import type {
    AlertRule,
    CreateAlertRuleRequest,
    UpdateAlertRuleRequest
} from '../types/api';
import { QUERY_KEYS } from '../utils/constants';

// ==================== ALERT RULES HOOKS ====================

/**
 * Hook para buscar todas as regras de alerta
 */
export function useAlertRules() {
    return useQuery({
        queryKey: QUERY_KEYS.ALERT_RULES,
        queryFn: () => alertService.getAlertRules(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Hook para buscar uma regra de alerta específica
 */
export function useAlertRule(id: string) {
    return useQuery({
        queryKey: QUERY_KEYS.ALERT_RULE_DETAIL(id),
        queryFn: () => alertService.getAlertRuleById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook para criar nova regra de alerta
 */
export function useCreateAlertRule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (alertData: CreateAlertRuleRequest) =>
            alertService.createAlertRule(alertData),
        onSuccess: (newRule) => {
            // Update cache with new rule
            queryClient.setQueryData<AlertRule[]>(
                QUERY_KEYS.ALERT_RULES,
                (old) => old ? [...old, newRule] : [newRule]
            );

            // Invalidate related queries
            queryClient.invalidateQueries({
                queryKey: ['alerts']
            });

            toast.success('Alert rule created successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create alert rule');
        },
    });
}

/**
 * Hook para atualizar regra de alerta
 */
export function useUpdateAlertRule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAlertRuleRequest }) =>
            alertService.updateAlertRule(id, data),
        onSuccess: (updatedRule, { id }) => {
            // Update specific rule in cache
            queryClient.setQueryData<AlertRule>(
                QUERY_KEYS.ALERT_RULE_DETAIL(id),
                updatedRule
            );

            // Update rules list
            queryClient.setQueryData<AlertRule[]>(
                QUERY_KEYS.ALERT_RULES,
                (old) => old?.map(rule => rule.id === id ? updatedRule : rule) || []
            );

            // Invalidate related queries
            queryClient.invalidateQueries({
                queryKey: ['alerts']
            });

            toast.success('Alert rule updated successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update alert rule');
        },
    });
}

/**
 * Hook para deletar regra de alerta
 */
export function useDeleteAlertRule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => alertService.deleteAlertRule(id),
        onSuccess: (_, id) => {
            // Remove from rules list
            queryClient.setQueryData<AlertRule[]>(
                QUERY_KEYS.ALERT_RULES,
                (old) => old?.filter(rule => rule.id !== id) || []
            );

            // Remove specific rule from cache
            queryClient.removeQueries({
                queryKey: QUERY_KEYS.ALERT_RULE_DETAIL(id)
            });

            // Invalidate related queries
            queryClient.invalidateQueries({
                queryKey: ['alerts']
            });

            toast.success('Alert rule deleted successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete alert rule');
        },
    });
}

/**
 * Hook para ativar/desativar regra de alerta
 */
export function useToggleAlertRule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
            alertService.toggleAlertRule(id, enabled),
        onSuccess: (updatedRule, { id, enabled }) => {
            // Update specific rule in cache
            queryClient.setQueryData<AlertRule>(
                QUERY_KEYS.ALERT_RULE_DETAIL(id),
                updatedRule
            );

            // Update rules list
            queryClient.setQueryData<AlertRule[]>(
                QUERY_KEYS.ALERT_RULES,
                (old) => old?.map(rule => rule.id === id ? updatedRule : rule) || []
            );

            const message = enabled ? 'Alert rule enabled!' : 'Alert rule disabled!';
            toast.success(message);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to toggle alert rule');
        },
    });
}

// ==================== ALERT EVENTS HOOKS ====================

/**
 * Hook para buscar eventos de alerta
 */
export function useAlertEvents(params?: {
    ruleId?: string;
    status?: 'active' | 'resolved';
    limit?: number;
}) {
    return useQuery({
        queryKey: [...QUERY_KEYS.ALERT_EVENTS, params],
        queryFn: () => alertService.getAlertEvents(params),
        staleTime: 30 * 1000, // 30 seconds (events change frequently)
    });
}

/**
 * Hook para buscar eventos ativos
 */
export function useActiveAlertEvents() {
    return useQuery({
        queryKey: [...QUERY_KEYS.ALERT_EVENTS, { status: 'active' }],
        queryFn: () => alertService.getActiveAlertEvents(),
        staleTime: 15 * 1000, // 15 seconds
        refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    });
}

/**
 * Hook para buscar eventos de uma regra específica
 */
export function useAlertEventsByRule(ruleId: string, limit?: number) {
    return useQuery({
        queryKey: [...QUERY_KEYS.ALERT_EVENTS, { ruleId, limit }],
        queryFn: () => alertService.getAlertEventsByRule(ruleId, limit),
        enabled: !!ruleId,
        staleTime: 1 * 60 * 1000, // 1 minute
    });
}

/**
 * Hook para resolver evento de alerta
 */
export function useResolveAlertEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (eventId: string) => alertService.resolveAlertEvent(eventId),
        onSuccess: (resolvedEvent) => {
            // Invalidate all alert events queries
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.ALERT_EVENTS
            });

            toast.success('Alert event resolved!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to resolve alert event');
        },
    });
}

/**
 * Hook para deletar evento de alerta
 */
export function useDeleteAlertEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (eventId: string) => alertService.deleteAlertEvent(eventId),
        onSuccess: () => {
            // Invalidate all alert events queries
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.ALERT_EVENTS
            });

            toast.success('Alert event deleted!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete alert event');
        },
    });
}

// ==================== BULK OPERATIONS HOOKS ====================

/**
 * Hook para operações em lote em regras de alerta
 */
export function useBulkAlertRuleOperations() {
    const queryClient = useQueryClient();

    const deleteMultiple = useMutation({
        mutationFn: (ruleIds: string[]) => alertService.deleteMultipleAlertRules(ruleIds),
        onSuccess: (_, ruleIds) => {
            // Remove deleted rules from cache
            queryClient.setQueryData<AlertRule[]>(
                QUERY_KEYS.ALERT_RULES,
                (old) => old?.filter(rule => !ruleIds.includes(rule.id)) || []
            );

            queryClient.invalidateQueries({
                queryKey: ['alerts']
            });

            toast.success(`${ruleIds.length} alert rules deleted!`);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete alert rules');
        },
    });

    const toggleMultiple = useMutation({
        mutationFn: ({ ruleIds, enabled }: { ruleIds: string[]; enabled: boolean }) =>
            alertService.toggleMultipleAlertRules(ruleIds, enabled),
        onSuccess: (_, { ruleIds, enabled }) => {
            // Invalidate queries to refetch updated data
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.ALERT_RULES
            });

            const action = enabled ? 'enabled' : 'disabled';
            toast.success(`${ruleIds.length} alert rules ${action}!`);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to toggle alert rules');
        },
    });

    const resolveMultipleEvents = useMutation({
        mutationFn: (eventIds: string[]) => alertService.resolveMultipleAlertEvents(eventIds),
        onSuccess: (_, eventIds) => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.ALERT_EVENTS
            });

            toast.success(`${eventIds.length} alert events resolved!`);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to resolve alert events');
        },
    });

    return {
        deleteMultiple,
        toggleMultiple,
        resolveMultipleEvents,
    };
}

// ==================== STATISTICS HOOKS ====================

/**
 * Hook para estatísticas de alertas
 */
export function useAlertStatistics() {
    return useQuery({
        queryKey: ['alerts', 'statistics'],
        queryFn: () => alertService.getAlertStatistics(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Hook para histórico de alertas
 */
export function useAlertHistory(
    startDate: Date,
    endDate: Date,
    groupBy: 'hour' | 'day' | 'week' = 'day'
) {
    return useQuery({
        queryKey: ['alerts', 'history', { startDate, endDate, groupBy }],
        queryFn: () => alertService.getAlertHistory(startDate, endDate, groupBy),
        enabled: !!(startDate && endDate),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook para contagem de eventos ativos
 */
export function useActiveEventCount() {
    return useQuery({
        queryKey: ['alerts', 'events', 'active', 'count'],
        queryFn: () => alertService.getActiveEventCount(),
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60 * 1000, // Auto-refresh every minute
    });
}

/**
 * Hook para eventos recentes
 */
export function useRecentAlertEvents(limit: number = 20) {
    return useQuery({
        queryKey: ['alerts', 'events', 'recent', { limit }],
        queryFn: () => alertService.getRecentAlertEvents(limit),
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    });
}

// ==================== TESTING & VALIDATION HOOKS ====================

/**
 * Hook para testar regra de alerta
 */
export function useTestAlertRule() {
    return useMutation({
        mutationFn: (ruleData: CreateAlertRuleRequest) =>
            alertService.testAlertRule(ruleData),
        onError: (error: any) => {
            toast.error(error.message || 'Failed to test alert rule');
        },
    });
}

/**
 * Hook para validar query de alerta
 */
export function useValidateAlertQuery() {
    return useMutation({
        mutationFn: (query: string) => alertService.validateAlertQuery(query),
        onError: (error: any) => {
            toast.error(error.message || 'Failed to validate alert query');
        },
    });
}

// ==================== IMPORT/EXPORT HOOKS ====================

/**
 * Hook para exportar regras de alerta
 */
export function useExportAlertRules() {
    return useMutation({
        mutationFn: (format: 'json' | 'yaml' = 'json') =>
            alertService.exportAlertRules(format),
        onSuccess: (blob, format) => {
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `alert-rules.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Alert rules exported successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to export alert rules');
        },
    });
}

/**
 * Hook para importar regras de alerta
 */
export function useImportAlertRules() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => alertService.importAlertRules(file),
        onSuccess: (result) => {
            // Invalidate alert rules to refetch
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.ALERT_RULES
            });

            const { imported, errors, warnings } = result;

            if (imported > 0) {
                toast.success(`${imported} alert rules imported successfully!`);
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
            toast.error(error.message || 'Failed to import alert rules');
        },
    });
}

// ==================== COMPOUND HOOKS ====================

/**
 * Hook combinado para dashboard de alertas
 */
export function useAlertsDashboard() {
    const alertRules = useAlertRules();
    const activeEvents = useActiveAlertEvents();
    const statistics = useAlertStatistics();
    const activeCount = useActiveEventCount();

    return {
        alertRules,
        activeEvents,
        statistics,
        activeCount,
        isLoading: alertRules.isLoading || activeEvents.isLoading || statistics.isLoading,
        hasError: alertRules.error || activeEvents.error || statistics.error,
    };
}

/**
 * Hook para gerenciamento completo de regras
 */
export function useAlertRuleManagement(ruleId?: string) {
    const rules = useAlertRules();
    const rule = useAlertRule(ruleId || '');
    const createRule = useCreateAlertRule();
    const updateRule = useUpdateAlertRule();
    const deleteRule = useDeleteAlertRule();
    const toggleRule = useToggleAlertRule();
    const testRule = useTestAlertRule();
    const validateQuery = useValidateAlertQuery();

    return {
        // Data
        rules: rules.data || [],
        rule: rule.data,

        // Loading states
        isLoadingRules: rules.isLoading,
        isLoadingRule: rule.isLoading,

        // Error states
        rulesError: rules.error,
        ruleError: rule.error,

        // Mutations
        createRule,
        updateRule,
        deleteRule,
        toggleRule,
        testRule,
        validateQuery,

        // Refetch functions
        refetchRules: rules.refetch,
        refetchRule: rule.refetch,
    };
}