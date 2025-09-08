import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const STORAGE_KEY = "backend_monitor_endpoints_v1";

function loadFromStorage(): BackendEndpoint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: BackendEndpoint[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(endpoints: BackendEndpoint[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(endpoints));
  } catch {
    // ignore
  }
}

function uuid() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2);
}

export function useBackendMonitor() {
  const [endpoints, setEndpoints] = useState<BackendEndpoint[]>(() => loadFromStorage());

  // Persist
  useEffect(() => {
    saveToStorage(endpoints);
  }, [endpoints]);

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
    (input: { url: string; method?: "GET" | "HEAD"; intervalSec?: number; webhookUrl?: string }) => {
      const method = input.method ?? "GET";
      const intervalSec = Math.max(5, Math.round(input.intervalSec ?? 60));
      const id = uuid();
      const ep: BackendEndpoint = {
        id,
        url: input.url,
        method,
        intervalSec,
        webhookUrl: input.webhookUrl?.trim() ? input.webhookUrl.trim() : undefined,
        enabled: true,
        lastStatus: "unknown",
      };
      setEndpoints((prev) => [...prev, ep]);
      return id;
    },
    []
  );

  const removeEndpoint = useCallback((id: string) => {
    clearTimer(id);
    setEndpoints((prev) => prev.filter((x) => x.id !== id));
  }, [clearTimer]);

  const updateEndpoint = useCallback(
    (id: string, patch: Partial<Pick<BackendEndpoint, "url" | "method" | "intervalSec" | "webhookUrl" | "enabled">>) => {
      setEndpoints((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    },
    []
  );

  const checkNow = useCallback(async (id: string) => {
    const ep = endpoints.find((x) => x.id === id);
    if (!ep) return;
    const result = await probe(ep);
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
    () => ({ endpoints, addEndpoint, removeEndpoint, updateEndpoint, checkNow }),
    [endpoints, addEndpoint, removeEndpoint, updateEndpoint, checkNow]
  );

  return value;
}
