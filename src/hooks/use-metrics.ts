import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type MetricData = {
  totalLogs: number;
  activeErrors: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  throughput: number;
  trends: {
    logs: number;
    errors: number;
  };
};

export function useMetrics() {
  const [metrics, setMetrics] = useState<MetricData>({
    totalLogs: 0,
    activeErrors: 0,
    systemHealth: 'healthy',
    throughput: 0,
    trends: { logs: 0, errors: 0 }
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMetrics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get total logs count
      const { count: totalLogs } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true });

      // Get error logs count (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      
      const { count: activeErrors } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true })
        .eq('level', 'ERROR')
        .gte('timestamp', oneDayAgo.toISOString());

      // Get logs from last hour for trends
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const { count: recentLogs } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', oneHourAgo.toISOString());

      const { count: recentErrors } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true })
        .eq('level', 'ERROR')
        .gte('timestamp', oneHourAgo.toISOString());

      // Calculate system health
      let systemHealth: MetricData['systemHealth'] = 'healthy';
      if ((activeErrors || 0) > 10) systemHealth = 'critical';
      else if ((activeErrors || 0) > 0) systemHealth = 'warning';

      // Calculate throughput (logs per minute in last hour)
      const throughput = Math.round((recentLogs || 0) / 60);

      setMetrics({
        totalLogs: totalLogs || 0,
        activeErrors: activeErrors || 0,
        systemHealth,
        throughput,
        trends: {
          logs: 0, // Would need historical data to calculate trends
          errors: 0
        }
      });
    } catch (err) {
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  return { metrics, loading, refetch: fetchMetrics };
}