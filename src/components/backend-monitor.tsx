import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { useBackendMonitor } from "@/hooks/use-backend-monitor";
import { EndpointStatus } from "@/types/api";
import { AlertCircle, Link as LinkIcon, PlugZap, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";

// Importar o service que criamos
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Interfaces para o backend
interface BackendEndpoint {
  id: string;
  userId: string;
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

interface CreateEndpointRequest {
  url: string;
  method?: string;
  intervalSec?: number;
  webhookUrl?: string;
}


export function BackendMonitor() {
  const { endpoints, loading, error, addEndpoint, removeEndpoint, updateEndpoint, checkNow, refetch } = useBackendMonitor();

  const [url, setUrl] = useState("");
  const [method, setMethod] = useState<"GET" | "HEAD" | "POST">("GET");
  const [intervalSec, setIntervalSec] = useState(60);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  function isValidUrl(value: string) {
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
        title: "URL inválida",
        description: "Verifique o formato. Ex: https://api.exemplo.com/health",
        variant: "destructive",
      });
      return;
    }

    if (webhookUrl && !isValidUrl(webhookUrl)) {
      toast({
        title: "Webhook inválido",
        description: "Informe um URL válido ou deixe vazio.",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    try {
      await addEndpoint({
        url: url.trim(),
        method,
        intervalSec: Number(intervalSec) || 60,
        webhookUrl: webhookUrl.trim() || undefined
      });

      // Limpar form
      setUrl("");
      setWebhookUrl("");
      setIntervalSec(60);
      setMethod("GET");
    } catch (err) {
      // Erro já tratado no hook
    } finally {
      setIsAdding(false);
    }
  };

  const formatLatency = (ms?: number) => (typeof ms === "number" ? `${ms}ms` : "—");
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Erro de conexão:</span>
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={refetch}>
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Adicionar endpoint</CardTitle>
          <CardDescription>
            Configure um novo endpoint para monitoramento automático.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL do endpoint</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://api.exemplo.com/health"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Método HTTP</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="HEAD">HEAD</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interval">Intervalo de verificação (segundos)</Label>
                <Input
                  id="interval"
                  type="number"
                  min="30"
                  value={intervalSec}
                  onChange={(e) => setIntervalSec(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo: 30 segundos
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook">Webhook para notificações (opcional)</Label>
                <Input
                  id="webhook"
                  type="url"
                  placeholder="https://hooks.zapier.com/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" disabled={isAdding || loading}>
              {isAdding ? "Adicionando..." : "Adicionar Endpoint"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Endpoints Monitorados</CardTitle>
            <CardDescription>
              {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''} configurado{endpoints.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Latência</TableHead>
                  <TableHead>Última verificação</TableHead>
                  <TableHead>Intervalo</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Webhook</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && endpoints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Carregando endpoints...
                    </TableCell>
                  </TableRow>
                ) : endpoints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Nenhum endpoint cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  endpoints.map((endpoint) => {
                    const hostname = (() => {
                      try { return new URL(endpoint.url).host; } catch { return endpoint.url; }
                    })();

                    const statusBadge = endpoint.lastStatus === EndpointStatus.UP ? (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        Online
                      </Badge>
                    ) : endpoint.lastStatus === EndpointStatus.DOWN ? (
                      <Badge variant="destructive">
                        Offline
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Aguardando
                      </Badge>
                    );

                    return (
                      <TableRow key={endpoint.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{hostname}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {endpoint.url}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge}</TableCell>
                        <TableCell>{endpoint.lastStatusCode ?? "—"}</TableCell>
                        <TableCell>{formatLatency(endpoint.lastLatencyMs)}</TableCell>
                        <TableCell>
                          <div>{formatDate(endpoint.lastCheckedAt)}</div>
                          {endpoint.error && (
                            <div className="text-sm text-destructive truncate max-w-32">
                              {endpoint.error}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{endpoint.intervalSec}s</TableCell>
                        <TableCell>
                          <Badge variant="outline">{endpoint.method}</Badge>
                        </TableCell>
                        <TableCell>
                          {endpoint.webhookUrl ? (
                            <Badge variant="outline" className="bg-blue-50">
                              <PlugZap className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => checkNow(endpoint.id)}
                                    disabled={!endpoint.enabled}
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Verificar agora</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <Switch
                              checked={endpoint.enabled}
                              onCheckedChange={(v) => updateEndpoint(endpoint.id, { enabled: v })}
                            />

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeEndpoint(endpoint.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remover endpoint</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
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
    </div>
  );
}