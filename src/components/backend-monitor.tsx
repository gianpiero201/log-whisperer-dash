import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { RefreshCw, Trash2, Link as LinkIcon, PlugZap } from "lucide-react";
import { useBackendMonitor } from "@/hooks/use-backend-monitor";

export function BackendMonitor() {
  const { endpoints, addEndpoint, removeEndpoint, updateEndpoint, checkNow } = useBackendMonitor();

  const [url, setUrl] = useState("");
  const [method, setMethod] = useState<"GET" | "HEAD">("GET");
  const [intervalSec, setIntervalSec] = useState<number>(60);
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
      toast({ title: "Webhook inválido", description: "Informe um URL válido ou deixe vazio.", variant: "destructive" });
      return;
    }

    setIsAdding(true);
    try {
      addEndpoint({ url: url.trim(), method, intervalSec: Number(intervalSec) || 60, webhookUrl: webhookUrl.trim() });
      setUrl("");
      setWebhookUrl("");
      setIntervalSec(60);
      setMethod("GET");
      toast({ title: "Endpoint adicionado", description: "Monitoramento iniciado." });
    } finally {
      setIsAdding(false);
    }
  };

  const fmtMs = (ms?: number) => (typeof ms === "number" ? `${ms} ms` : "—");
  const fmtDate = (ts?: number) => (ts ? new Date(ts).toLocaleString() : "—");

  return (
    <section aria-labelledby="backend-monitor-title" className="space-y-4">
      <header>
        <h2 id="backend-monitor-title" className="text-2xl font-semibold tracking-tight">Monitoramento de Backends</h2>
        <p className="text-sm text-muted-foreground">Cadastre URLs para checagem periódica e notifique via webhook em mudanças de status.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar endpoint</CardTitle>
          <CardDescription>Informe a URL a ser monitorada e a frequência de checagem.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-5">
              <Label htmlFor="url">URL do backend</Label>
              <div className="flex items-center gap-2 mt-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <Input id="url" placeholder="https://api.exemplo.com/health" value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="method">Método</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as any)}>
                <SelectTrigger id="method" className="mt-2"><SelectValue placeholder="GET" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="HEAD">HEAD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="interval">Intervalo (seg)</Label>
              <Input id="interval" type="number" min={5} step={5} className="mt-2" value={intervalSec}
                onChange={(e) => setIntervalSec(Number(e.target.value))} />
            </div>

            <div className="md:col-span-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="webhook">Webhook (opcional)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PlugZap className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      Informe um URL para ser chamado quando o status mudar (ex: Zapier). Requisição com JSON e no-cors.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input id="webhook" placeholder="https://hooks.zapier.com/..." className="mt-2" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
            </div>

            <div className="md:col-span-12">
              <Button type="submit" disabled={isAdding}>
                Adicionar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endpoints monitorados</CardTitle>
          <CardDescription>Resultados em tempo real. Observação: CORS pode impedir a leitura do status em alguns servidores.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Latência</TableHead>
                  <TableHead>Última checagem</TableHead>
                  <TableHead>Intervalo</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Webhook</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">Nenhum endpoint cadastrado.</TableCell>
                  </TableRow>
                ) : (
                  endpoints.map((ep) => {
                    const hostname = (() => {
                      try { return new URL(ep.url).host; } catch { return ep.url; }
                    })();
                    const statusBadge = ep.lastStatus === "up" ? (
                      <Badge variant="outline" className="border-green-500/40 text-green-600 dark:text-green-400">Ativo</Badge>
                    ) : ep.lastStatus === "down" ? (
                      <Badge variant="outline" className="border-red-500/40 text-red-600 dark:text-red-400">Inativo</Badge>
                    ) : (
                      <Badge variant="secondary">Desconhecido</Badge>
                    );
                    return (
                      <TableRow key={ep.id}>
                        <TableCell className="max-w-[280px] truncate" title={ep.url}>
                          <div className="font-medium">{hostname}</div>
                          <div className="text-xs text-muted-foreground truncate">{ep.url}</div>
                        </TableCell>
                        <TableCell>{statusBadge}</TableCell>
                        <TableCell>{ep.lastStatusCode ?? "—"}</TableCell>
                        <TableCell>{fmtMs(ep.lastLatencyMs)}</TableCell>
                        <TableCell>
                          <div className="text-sm">{fmtDate(ep.lastCheckedAt)}</div>
                          {ep.error && <div className="text-xs text-muted-foreground truncate max-w-[220px]" title={ep.error}>{ep.error}</div>}
                        </TableCell>
                        <TableCell>{ep.intervalSec}s</TableCell>
                        <TableCell>{ep.method}</TableCell>
                        <TableCell>{ep.webhookUrl ? <Badge variant="outline">Ativado</Badge> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Button size="icon" variant="ghost" onClick={() => checkNow(ep.id)} title="Checar agora">
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Switch checked={ep.enabled} onCheckedChange={(v) => updateEndpoint(ep.id, { enabled: v })} />
                            <Button size="icon" variant="ghost" onClick={() => removeEndpoint(ep.id)} title="Remover">
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
