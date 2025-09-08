import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type BackendEndpoint = {
  id: string;
  url: string;
  method: "GET" | "HEAD";
  intervalSec: number;
  webhookUrl?: string;
  enabled: boolean;
  // runtime status
  lastStatus?: "up" | "down" | "unknown";
  lastStatusCode?: number;
  lastLatencyMs?: number;
  lastCheckedAt?: number; // epoch ms
  error?: string;
};

export function useBackendMonitor() {
  const [endpoints, setEndpoints] = useState<BackendEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch endpoints from Supabase
  const fetchEndpoints = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('endpoints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedEndpoints: BackendEndpoint[] = (data || []).map(endpoint => ({
        id: endpoint.id,
        url: endpoint.url,
        method: endpoint.method as "GET" | "HEAD",
        intervalSec: endpoint.interval_sec,
        webhookUrl: endpoint.webhook_url || undefined,
        enabled: endpoint.enabled,
        lastStatus: endpoint.last_status as "up" | "down" | "unknown",
        lastStatusCode: endpoint.last_status_code || undefined,
        lastLatencyMs: endpoint.last_latency_ms || undefined,
        lastCheckedAt: endpoint.last_checked_at ? new Date(endpoint.last_checked_at).getTime() : undefined,
        error: endpoint.error || undefined,
      }));

      setEndpoints(mappedEndpoints);
    } catch (err) {
      console.error('Error fetching endpoints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, [user]);

  // Map of timers by id
  const timersRef = useRef<Map<string, number>>(new Map());

  const clearTimer = useCallback((id: string) => {
    const t = timersRef.current.get(id);
    if (t) {
      clearInterval(t);
      timersRef.current.delete(id);
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearInterval(t));
    timersRef.current.clear();
  }, []);

  // Probe function
  const probe = useCallback(async (ep: BackendEndpoint) => {
    const start = performance.now();
    const controller = new AbortController();
    const timeoutMs = Math.min(Math.max(ep.intervalSec * 1000 - 500, 3000), 10000);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(ep.url, {
        method: ep.method,
        signal: controller.signal,
        // Best effort CORS; if the server doesn't allow CORS this may fail
        // For real monitoring, move this to a backend/edge function.
        mode: "cors",
        cache: "no-store",
      });
      const latency = Math.max(0, Math.round(performance.now() - start));

      const statusCode = res.status;
      const ok = res.ok; // 2xx

      return {
        status: ok ? (statusCode < 400 ? "up" : "down") : "down",
        statusCode,
        latency,
        error: undefined as string | undefined,
      } as const;
    } catch (err: any) {
      const latency = Math.max(0, Math.round(performance.now() - start));
      let error = String(err?.message || err || "erro desconhecido");
      // If aborted, present as timeout
      if (err?.name === "AbortError") {
        error = `timeout em ${timeoutMs}ms`;
      }
      return {
        status: "down" as const,
        statusCode: undefined,
        latency,
        error,
      };
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  // Webhook notify on status change
  const notifyWebhook = useCallback((ep: BackendEndpoint, newStatus: BackendEndpoint["lastStatus"]) => {
    if (!ep.webhookUrl) return;
    try {
      // Fire-and-forget to avoid blocking UI and CORS issues
      fetch(ep.webhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "endpoint_status_changed",
          timestamp: new Date().toISOString(),
          endpoint: {
            id: ep.id,
            url: ep.url,
            method: ep.method,
          },
          status: newStatus,
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  const schedule = useCallback(
    (ep: BackendEndpoint) => {
      clearTimer(ep.id);
      if (!ep.enabled) return;
      // Run immediately, then set interval
      (async () => {
        const result = await probe(ep);
        
        // Update database
        await supabase
          .from('endpoints')
          .update({
            last_status: result.status,
            last_status_code: result.statusCode,
            last_latency_ms: result.latency,
            last_checked_at: new Date().toISOString(),
            error: result.error
          })
          .eq('id', ep.id);

        setEndpoints((prev) => {
          const cur = prev.find((x) => x.id === ep.id);
          if (!cur) return prev;
          const newStatus = result.status;
          const changed = cur.lastStatus && cur.lastStatus !== newStatus;
          const updated = prev.map((x) =>
            x.id === ep.id
              ? {
                  ...x,
                  lastStatus: newStatus,
                  lastStatusCode: result.statusCode,
                  lastLatencyMs: result.latency,
                  lastCheckedAt: Date.now(),
                  error: result.error,
                }
              : x
          );
          if (changed) notifyWebhook(cur, newStatus);
          return updated;
        });
      })();

      const id = window.setInterval(async () => {
        const result = await probe(ep);
        
        // Update database
        await supabase
          .from('endpoints')
          .update({
            last_status: result.status,
            last_status_code: result.statusCode,
            last_latency_ms: result.latency,
            last_checked_at: new Date().toISOString(),
            error: result.error
          })
          .eq('id', ep.id);

        setEndpoints((prev) => {
          const cur = prev.find((x) => x.id === ep.id);
          if (!cur) return prev;
          const newStatus = result.status;
          const changed = cur.lastStatus && cur.lastStatus !== newStatus;
          const updated = prev.map((x) =>
            x.id === ep.id
              ? {
                  ...x,
                  lastStatus: newStatus,
                  lastStatusCode: result.statusCode,
                  lastLatencyMs: result.latency,
                  lastCheckedAt: Date.now(),
                  error: result.error,
                }
              : x
          );
          if (changed) notifyWebhook(cur, newStatus);
          return updated;
        });
      }, Math.max(5_000, ep.intervalSec * 1000));
      timersRef.current.set(ep.id, id);
    },
    [clearTimer, notifyWebhook, probe]
  );

  // Reschedule polling whenever endpoints list changes (id, enabled, interval, url, method)
  useEffect(() => {
    clearAllTimers();
    endpoints.forEach((ep) => schedule(ep));
    return () => clearAllTimers();
  }, [endpoints, schedule, clearAllTimers]);

  const addEndpoint = useCallback(
    async (input: { url: string; method?: "GET" | "HEAD"; intervalSec?: number; webhookUrl?: string }) => {
      if (!user) return;

      const method = input.method ?? "GET";
      const intervalSec = Math.max(5, Math.round(input.intervalSec ?? 60));
      
      try {
        const { data, error } = await supabase
          .from('endpoints')
          .insert({
            url: input.url,
            method,
            interval_sec: intervalSec,
            webhook_url: input.webhookUrl?.trim() || null,
            user_id: user.id,
            enabled: true,
            last_status: 'unknown'
          })
          .select()
          .single();

        if (error) throw error;

        fetchEndpoints(); // Refresh the list
        return data.id;
      } catch (err) {
        console.error('Error adding endpoint:', err);
        throw err;
      }
    },
    [user]
  );

  const removeEndpoint = useCallback(async (id: string) => {
    clearTimer(id);
    
    try {
      const { error } = await supabase
        .from('endpoints')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setEndpoints((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      console.error('Error removing endpoint:', err);
      throw err;
    }
  }, [clearTimer]);

  const updateEndpoint = useCallback(
    async (id: string, patch: Partial<Pick<BackendEndpoint, "url" | "method" | "intervalSec" | "webhookUrl" | "enabled">>) => {
      try {
        const dbPatch: any = {};
        if (patch.url !== undefined) dbPatch.url = patch.url;
        if (patch.method !== undefined) dbPatch.method = patch.method;
        if (patch.intervalSec !== undefined) dbPatch.interval_sec = patch.intervalSec;
        if (patch.webhookUrl !== undefined) dbPatch.webhook_url = patch.webhookUrl;
        if (patch.enabled !== undefined) dbPatch.enabled = patch.enabled;

        const { error } = await supabase
          .from('endpoints')
          .update(dbPatch)
          .eq('id', id);

        if (error) throw error;

        setEndpoints((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      } catch (err) {
        console.error('Error updating endpoint:', err);
        throw err;
      }
    },
    []
  );

  const checkNow = useCallback(async (id: string) => {
    const ep = endpoints.find((x) => x.id === id);
    if (!ep) return;
    const result = await probe(ep);
    
    // Update database
    await supabase
      .from('endpoints')
      .update({
        last_status: result.status,
        last_status_code: result.statusCode,
        last_latency_ms: result.latency,
        last_checked_at: new Date().toISOString(),
        error: result.error
      })
      .eq('id', id);

    setEndpoints((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              lastStatus: result.status,
              lastStatusCode: result.statusCode,
              lastLatencyMs: result.latency,
              lastCheckedAt: Date.now(),
              error: result.error,
            }
          : x
      )
    );
  }, [endpoints, probe]);

  const value = useMemo(
    () => ({ endpoints, loading, addEndpoint, removeEndpoint, updateEndpoint, checkNow, refetch: fetchEndpoints }),
    [endpoints, loading, addEndpoint, removeEndpoint, updateEndpoint, checkNow, fetchEndpoints]
  );

  return value;
}
