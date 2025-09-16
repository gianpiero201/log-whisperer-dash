import { logService } from '@/services/logs';
import { useAuth } from '@/store/authStore';
import { LogLevel } from '@/types/api';
import { useEffect, useState } from 'react';

export type LogEntry = {
  id: number;
  timestamp: string;
  level: LogLevel;
  service?: string;
  message?: string;
  source?: string;
  meta: Record<string, any>;
  endpoint_id?: string;
};

export function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchLogs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { items } = await logService.getLogs();

      // Map the data to match our LogEntry type
      const mappedLogs: LogEntry[] = (items || []).map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level as LogLevel,
        service: log.service || undefined,
        message: log.message || undefined,
        source: log.source || undefined,
        meta: (log.meta as any) || {},
        endpoint_id: log.endpointId || undefined,
      }));

      setLogs(mappedLogs);
      setError(null);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const addLog = async (log: Omit<LogEntry, 'id' | 'user_id'>) => {
    if (!user) return;

    try {
      // const { error } = await supabase
      //   .from('logs')
      //   .insert({
      //     ...log,
      //     user_id: user.id
      //   });

      logService.createLog({
        endpointId: log.endpoint_id,
        level: log.level,
        service: log.service,
        message: log.message,
        source: log.source,
        meta: JSON.stringify(log.meta || {}),
      })

      if (error) throw error;

      // Refresh logs after adding
      fetchLogs();
    } catch (err) {
      console.error('Error adding log:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    // const channel = supabase
    //   .channel('logs-changes')
    //   .on(
    //     'postgres_changes',
    //     {
    //       event: '*',
    //       schema: 'public',
    //       table: 'logs',
    //       filter: `user_id=eq.${user.id}`
    //     },
    //     () => {
    //       fetchLogs();
    //     }
    //   )
    //   .subscribe();

    // return () => {
    //   supabase.removeChannel(channel);
    // };
  }, [user]);

  return {
    logs,
    loading,
    error,
    refetch: fetchLogs,
    addLog
  };
}