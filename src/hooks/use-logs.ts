// src/hooks/use-logs.ts - Hook para gerenciar logs com React Query
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from '../components/ui/use-toast';

// Temporary mock data structure until we implement the actual log service
interface LogEntry {
  id: number;
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  service?: string;
  message?: string;
  source?: string;
  endpointId?: string;
}

interface LogFilters {
  level?: string;
  service?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface PaginatedLogs {
  items: LogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Mock service - replace with actual logService when available
const mockLogService = {
  async getLogs(filters: LogFilters = {}): Promise<PaginatedLogs> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock data
    const mockLogs: LogEntry[] = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'api-gateway',
        message: 'Request processed successfully',
        source: 'http-handler'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'ERROR',
        service: 'database',
        message: 'Connection timeout',
        source: 'connection-pool'
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: 'WARN',
        service: 'auth-service',
        message: 'Invalid token provided',
        source: 'jwt-middleware'
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 180000).toISOString(),
        level: 'DEBUG',
        service: 'cache-service',
        message: 'Cache hit for key: user_123',
        source: 'redis-client'
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 240000).toISOString(),
        level: 'ERROR',
        service: 'payment-service',
        message: 'Payment processing failed',
        source: 'stripe-webhook'
      }
    ];

    // Apply filters
    let filteredLogs = mockLogs;

    if (filters.level && filters.level !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level);
    }

    if (filters.service && filters.service !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.service === filters.service);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log =>
        log.message?.toLowerCase().includes(searchLower) ||
        log.service?.toLowerCase().includes(searchLower) ||
        log.source?.toLowerCase().includes(searchLower)
      );
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 50;
    const total = filteredLogs.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const items = filteredLogs.slice(startIndex, startIndex + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages
    };
  },

  async createLog(data: Partial<LogEntry>): Promise<LogEntry> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      id: Math.floor(Math.random() * 10000),
      timestamp: new Date().toISOString(),
      level: 'INFO',
      ...data
    } as LogEntry;
  },

  async deleteLog(id: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
  }
};

export interface UseLogsOptions {
  page?: number;
  pageSize?: number;
  level?: string;
  service?: string;
  search?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseLogsResult {
  // Data
  logs: LogEntry[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  totalPages: number;
  currentPage: number;

  // Actions
  createLog: (data: Partial<LogEntry>) => Promise<void>;
  deleteLog: (id: number) => Promise<void>;
  refetch: () => void;

  // Filters
  setFilters: (filters: Partial<UseLogsOptions>) => void;
  filters: UseLogsOptions;
}

const QUERY_KEY = 'logs';

export function useLogs(options: UseLogsOptions = {}): UseLogsResult {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<UseLogsOptions>({
    page: 1,
    pageSize: 50,
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    ...options
  });

  // Main query for fetching logs
  const {
    data: logsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: () => mockLogService.getLogs({
      page: filters.page,
      pageSize: filters.pageSize,
      level: filters.level,
      service: filters.service,
      search: filters.search
    }),
    refetchInterval: filters.autoRefresh ? filters.refreshInterval : false,
    refetchIntervalInBackground: false,
    staleTime: 10000, // 10 seconds
  });

  // Create log mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<LogEntry>) => mockLogService.createLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'Log criado',
        description: 'O log foi adicionado com sucesso.',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar log',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete log mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => mockLogService.deleteLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'Log removido',
        description: 'O log foi removido com sucesso.',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover log',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Action handlers
  const createLog = useCallback(async (data: Partial<LogEntry>) => {
    await createMutation.mutateAsync(data);
  }, [createMutation]);

  const deleteLog = useCallback(async (id: number) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const updateFilters = useCallback((newFilters: Partial<UseLogsOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    // Data
    logs: logsData?.items || [],
    loading: isLoading || createMutation.isPending || deleteMutation.isPending,
    error: error?.message || null,
    totalCount: logsData?.total || 0,
    totalPages: logsData?.totalPages || 0,
    currentPage: logsData?.page || 1,

    // Actions
    createLog,
    deleteLog,
    refetch,

    // Filters
    setFilters: updateFilters,
    filters
  };
}

// Simple compatibility hook for components that just need logs array
export function useLogsSimple() {
  const { logs, loading, refetch } = useLogs();
  return { logs, loading, refetch };
}