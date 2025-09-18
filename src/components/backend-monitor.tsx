import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNotifications } from "@/hooks/use-notifications";
import { useRealTimeMonitoring } from "@/hooks/use-real-time-monitoring";
import { toast } from "@/hooks/use-toast";
import { AUTH_CONFIG } from "@/utils/constants";
import { Activity, Link as LinkIcon, PlugZap, RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// API integration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Endpoint {
  id: string;
  url: string;
  method: string;
  intervalSec: number;
  webhookUrl?: string;
  enabled: boolean;
  lastStatus: 'up' | 'down' | 'unknown';
  lastStatusCode?: number;
  lastLatencyMs?: number;
  lastCheckedAt?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export function BackendMonitor() {
  // Real-time hooks
  const {
    endpoints: realtimeEndpoints,
    metrics,
    isConnected,
    connectionState,
    requestEndpointCheck,
    error: connectionError
  } = useRealTimeMonitoring();

  const { isConnected: notificationsConnected } = useNotifications();

  // Local state
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState<"GET" | "HEAD" | "POST">("GET");
  const [intervalSec, setIntervalSec] = useState<number>(60);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync real-time data with local state
  useEffect(() => {
    if (realtimeEndpoints.length > 0) {
      // Update endpoints with real-time data
      setEndpoints(prev => {
        const updatedEndpoints = [...prev];

        realtimeEndpoints.forEach(rtEndpoint => {
          const index = updatedEndpoints.findIndex(e => e.id === rtEndpoint.id);
          if (index >= 0) {
            updatedEndpoints[index] = {
              ...updatedEndpoints[index],
              lastStatus: rtEndpoint.status,
              lastStatusCode: rtEndpoint.statusCode,
              lastLatencyMs: rtEndpoint.responseTimeMs,
              lastCheckedAt: rtEndpoint.checkedAt,
              error: rtEndpoint.error,
              enabled: rtEndpoint.enabled
            };
          }
        });

        return updatedEndpoints;
      });
    }
  }, [realtimeEndpoints]);

  // Fetch initial endpoints data
  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}/endpoints`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        setEndpoints(data.data.items || []);
      }
    } catch (error) {
      console.error('Error fetching endpoints:', error);
      toast({
        title: "❌ Error",
        description: "Failed to load endpoints",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addEndpoint = useCallback(async (endpointData: {
    url: string;
    method: string;
    intervalSec: number;
    webhookUrl?: string;
  }) => {
    try {
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}/endpoints`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(endpointData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        setEndpoints(prev => [data.data, ...prev]);
        toast({
          title: "✅ Endpoint Added",
          description: "Monitoring started successfully",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error adding endpoint:', error);
      throw error;
    }
  }, []);

  const removeEndpoint = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}/endpoints/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setEndpoints(prev => prev.filter(e => e.id !== id));
      toast({
        title: "🗑️ Endpoint Removed",
        description: "Monitoring stopped",
        variant: "default",
      });
    } catch (error) {
      console.error('Error removing endpoint:', error);
      toast({
        title: "❌ Error",
        description: "Failed to remove endpoint",
        variant: "destructive",
      });
    }
  }, []);

  const updateEndpoint = useCallback(async (id: string, updates: Partial<Endpoint>) => {
    try {
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}/endpoints/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        setEndpoints(prev => prev.map(e => e.id === id ? data.data : e));
      }
    } catch (error) {
      console.error('Error updating endpoint:', error);
      toast({
        title: "❌ Error",
        description: "Failed to update endpoint",
        variant: "destructive",
      });
    }
  }, []);

  const checkNow = useCallback(async (id: string) => {
    if (isConnected) {
      // Use real-time check request
      await requestEndpointCheck(id);
    } else {
      // Fallback to HTTP API
      try {
        const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        await fetch(`${API_BASE_URL}/endpoints/${id}/check`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        toast({
          title: "🔄 Check Requested",
          description: "Endpoint check initiated",
          variant: "default",
        });
      } catch (error) {
        console.error('Error checking endpoint:', error);
        toast({
          title: "❌ Error",
          description: "Failed to check endpoint",
          variant: "destructive",
        });
      }
    }
  }, [isConnected, requestEndpointCheck]);

  function isValidUrl(value: string): boolean {
    try {
      const u = new URL(value);
      return Boolean(u.protocol && u.host);
    } catch {
      return false;
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidUrl(url)) {
      toast({
        title: "❌ Invalid URL",
        description: "Please check the format. Ex: https://api.example.com/health",
        variant: "destructive",
      });
      return;
    }

    if (webhookUrl && !isValidUrl(webhookUrl)) {
      toast({
        title: "❌ Invalid Webhook",
        description: "Please provide a valid URL or leave empty.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    try {
      await addEndpoint({
        url: url.trim(),
        method,
        intervalSec: Number(intervalSec) || 60,
        webhookUrl: webhookUrl.trim() || undefined,
      });

      // Reset form
      setUrl("");
      setWebhookUrl("");
      setIntervalSec(60);
      setMethod("GET");
    } catch (error) {
      // Error already handled in addEndpoint
    } finally {
      setIsAdding(false);
    }
  };

  const fmtMs = (ms?: number): string => {
    return ms && typeof ms === 'number' ? `${ms}ms` : "-";
  };

  const fmtDate = (ts?: string): string => {
    return ts ? new Date(ts).toLocaleString() : "-";
  };

  return (
    <section aria-labelledby="backend-monitor-title" className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 id="backend-monitor-title" className="text-2xl font-semibold tracking-tight">
            Backend Monitoring
          </h2>
          <p className="text-sm text-muted-foreground">
            Register URLs for periodic checking with real-time notifications
          </p>
        </div>

        {/* Connection Status Indicators */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-success" />
              ) : (
                <WifiOff className="h-4 w-4 text-error" />
              )}
              <span className="text-xs text-muted-foreground">
                Monitoring: {connectionState}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {notificationsConnected ? (
                <Activity className="h-4 w-4 text-success" />
              ) : (
                <Activity className="h-4 w-4 text-error" />
              )}
              <span className="text-xs text-muted-foreground">
                Notifications
              </span>
            </div>
          </div>

          <Button
            onClick={fetchEndpoints}
            size="sm"
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      {connectionError && (
        <div className="p-3 border border-error/20 bg-error/5 rounded-lg">
          <p className="text-sm text-error">
            ⚠️ Real-time connection error: {connectionError}
          </p>
        </div>
      )}

      {/* Add Endpoint Card */}
      <Card>
        <CardHeader>
          <CardTitle>Add Endpoint</CardTitle>
          <CardDescription>
            Enter the URL to be monitored and check frequency.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-12">
            {/* URL Input */}
            <div className="md:col-span-5">
              <Label htmlFor="url">Backend URL</Label>
              <div className="flex items-center gap-2 mt-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="url"
                  placeholder="https://api.example.com/health"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Method Select */}
            <div className="md:col-span-2">
              <Label htmlFor="method">Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as any)}>
                <SelectTrigger id="method" className="mt-2">
                  <SelectValue placeholder="GET" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="HEAD">HEAD</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Interval Input */}
            <div className="md:col-span-2">
              <Label htmlFor="interval">Interval (sec)</Label>
              <Input
                id="interval"
                type="number"
                min={5}
                step={5}
                className="mt-2"
                value={intervalSec}
                onChange={(e) => setIntervalSec(Number(e.target.value))}
              />
            </div>

            {/* Webhook Input */}
            <div className="md:col-span-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="webhook">Webhook (optional)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PlugZap className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      Provide a URL to be called when status changes (e.g., Zapier).
                      Request with JSON payload and CORS headers.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="webhook"
                placeholder="https://hooks.zapier.com/..."
                className="mt-2"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <div className="md:col-span-12">
              <Button type="submit" disabled={isAdding} className="w-full md:w-auto">
                {isAdding ? "Adding..." : "Add Endpoint"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Endpoints Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Monitored Endpoints
            {metrics && (
              <Badge variant="outline" className="ml-2">
                {metrics.totalEndpoints} total • {metrics.endpointsUp} up • {metrics.endpointsDown} down
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Real-time results. Note: CORS may prevent status reading on some servers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>Last Check</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Webhook</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      {isLoading ? "Loading endpoints..." : "No endpoints registered."}
                    </TableCell>
                  </TableRow>
                ) : (
                  endpoints.map((ep) => {
                    const hostname = (() => {
                      try {
                        return new URL(ep.url).host;
                      } catch {
                        return ep.url;
                      }
                    })();

                    const statusBadge = ep.lastStatus === 'up' ? (
                      <Badge variant="outline" className="border-success/40 text-success">
                        Online
                      </Badge>
                    ) : ep.lastStatus === 'down' ? (
                      <Badge variant="outline" className="border-error/40 text-error">
                        Offline
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Unknown</Badge>
                    );

                    return (
                      <TableRow key={ep.id}>
                        <TableCell className="max-w-[280px] truncate" title={ep.url}>
                          <div>
                            <div className="font-medium">{hostname}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {ep.url}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>{statusBadge}</TableCell>

                        <TableCell>{ep.lastStatusCode ?? "-"}</TableCell>

                        <TableCell>{fmtMs(ep.lastLatencyMs)}</TableCell>

                        <TableCell>
                          <div>
                            <div className="text-sm">{fmtDate(ep.lastCheckedAt)}</div>
                            {ep.error && (
                              <div
                                className="text-xs text-muted-foreground truncate max-w-[220px]"
                                title={ep.error}
                              >
                                {ep.error}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>{ep.intervalSec}s</TableCell>

                        <TableCell>{ep.method}</TableCell>

                        <TableCell>
                          {ep.webhookUrl ? (
                            <Badge variant="outline">Enabled</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => checkNow(ep.id)}
                              title="Check now"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>

                            <Switch
                              checked={ep.enabled}
                              onCheckedChange={(checked) =>
                                updateEndpoint(ep.id, { enabled: checked })
                              }
                            />

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeEndpoint(ep.id)}
                              title="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}