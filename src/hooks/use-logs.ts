import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

export type LogEntry = {
  id: number;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
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
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Map the data to match our LogEntry type
      const mappedLogs: LogEntry[] = (data || []).map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
        service: log.service || undefined,
        message: log.message || undefined,
        source: log.source || undefined,
        meta: (log.meta as any) || {},
        endpoint_id: log.endpoint_id || undefined
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
      const { error } = await supabase
        .from('logs')
        .insert({
          ...log,
          user_id: user.id
        });

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

    const channel = supabase
      .channel('logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logs',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    logs,
    loading,
    error,
    refetch: fetchLogs,
    addLog
  };
}