import { format } from 'date-fns';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Pause,
  Play,
  Plus,
  RefreshCw,
  TestTube,
  Trash2,
  Zap
} from 'lucide-react';
import { useState } from 'react';
import {
  useBulkEndpointOperations,
  useCreateEndpoint,
  useDeleteEndpoint,
  useEndpoints,
  useEndpointsStatistics,
  useRealTimeEndpointStatus,
  useTestEndpoint,
  useToggleEndpoint,
  useUpdateEndpoint
} from '../hooks/use-endpoints';
import { CreateEndpointRequest, EndpointStatus } from '../types/api';
import { ENDPOINT_STATUS, HTTP_METHODS } from '../utils/constants';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { LoadingSpinner } from './ui/loading-spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Switch } from './ui/switch';

export function BackendMonitor() {
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Data hooks
  const { data: endpoints = [], isPending: loadingEndpoints, refetch: refetchEndpoints } = useEndpoints();
  const { data: statistics, isPending: loadingStats } = useEndpointsStatistics();
  const { data: realtimeStatus = [] } = useRealTimeEndpointStatus();

  // Mutation hooks
  const createEndpoint = useCreateEndpoint();
  const updateEndpoint = useUpdateEndpoint();
  const deleteEndpoint = useDeleteEndpoint();
  const toggleEndpoint = useToggleEndpoint();
  const testEndpoint = useTestEndpoint();
  const { deleteMultiple, toggleMultiple, testMultiple } = useBulkEndpointOperations();

  // Form state
  const [formData, setFormData] = useState<CreateEndpointRequest>({
    url: '',
    method: 'GET',
    intervalSec: 60,
    webhookUrl: '',
    enabled: true
  });

  const handleCreateEndpoint = async () => {
    try {
      await createEndpoint.mutateAsync(formData);
      setIsCreateDialogOpen(false);
      setFormData({
        url: '',
        method: 'GET',
        intervalSec: 60,
        webhookUrl: '',
        enabled: true
      });
    } catch (error) {
      console.error('Error creating endpoint:', error);
    }
  };

  const handleToggleEndpoint = async (id: string, enabled: boolean) => {
    try {
      await toggleEndpoint.mutateAsync({ id, enabled });
    } catch (error) {
      console.error('Error toggling endpoint:', error);
    }
  };

  const handleDeleteEndpoint = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this endpoint?')) {
      try {
        await deleteEndpoint.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting endpoint:', error);
      }
    }
  };

  const handleTestEndpoint = async (id: string) => {
    try {
      await testEndpoint.mutateAsync(id);
    } catch (error) {
      console.error('Error testing endpoint:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEndpoints.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedEndpoints.length} endpoints?`)) {
      try {
        await deleteMultiple.mutateAsync(selectedEndpoints);
        setSelectedEndpoints([]);
      } catch (error) {
        console.error('Error deleting endpoints:', error);
      }
    }
  };

  const handleBulkToggle = async (enabled: boolean) => {
    if (selectedEndpoints.length === 0) return;

    try {
      await toggleMultiple.mutateAsync({ endpointIds: selectedEndpoints, enabled });
      setSelectedEndpoints([]);
    } catch (error) {
      console.error('Error toggling endpoints:', error);
    }
  };

  const handleBulkTest = async () => {
    if (selectedEndpoints.length === 0) return;

    try {
      await testMultiple.mutateAsync(selectedEndpoints);
    } catch (error) {
      console.error('Error testing endpoints:', error);
    }
  };

  const getStatusBadge = (status: EndpointStatus) => {
    const config = ENDPOINT_STATUS[status];
    const IconComponent = {
      up: CheckCircle,
      down: AlertCircle,
      unknown: Clock
    }[status];

    return (
      <Badge
        variant={status === 'up' ? 'default' : status === 'down' ? 'destructive' : 'secondary'}
        className="flex items-center gap-1"
      >
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loadingEndpoints || loadingStats) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Endpoints</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {statistics?.active || 0} enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics?.up || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Healthy endpoints
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {statistics?.down || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.averageLatency ? `${Math.round(statistics.averageLatency)}ms` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Endpoints Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Endpoint Monitoring</CardTitle>
              <CardDescription>
                Monitor your APIs and services in real-time
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedEndpoints.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkToggle(true)}
                    disabled={toggleMultiple.isPending}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Enable ({selectedEndpoints.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkToggle(false)}
                    disabled={toggleMultiple.isPending}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Disable ({selectedEndpoints.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkTest}
                    disabled={testMultiple.isPending}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test ({selectedEndpoints.length})
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={deleteMultiple.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedEndpoints.length})
                  </Button>
                </>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchEndpoints()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Endpoint
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Endpoint</DialogTitle>
                    <DialogDescription>
                      Monitor a new API endpoint or service
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        placeholder="https://api.example.com/health"
                        value={formData.url}
                        onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="method">HTTP Method</Label>
                      <Select
                        value={formData.method}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, method: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HTTP_METHODS.map(method => (
                            <SelectItem key={method} value={method}>{method}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interval">Check Interval (seconds)</Label>
                      <Input
                        id="interval"
                        type="number"
                        min="5"
                        value={formData.intervalSec}
                        onChange={(e) => setFormData(prev => ({ ...prev, intervalSec: parseInt(e.target.value) || 60 }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="webhook">Webhook URL (optional)</Label>
                      <Input
                        id="webhook"
                        placeholder="https://hooks.slack.com/..."
                        value={formData.webhookUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enabled"
                        checked={formData.enabled}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                      />
                      <Label htmlFor="enabled">Enable monitoring</Label>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      onClick={handleCreateEndpoint}
                      disabled={createEndpoint.isPending || !formData.url}
                    >
                      {createEndpoint.isPending ? <LoadingSpinner className="h-3 w-3 mr-2" /> : null}
                      Add Endpoint
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {endpoints.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No endpoints configured</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first endpoint to start monitoring
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {endpoints.map((endpoint) => (
                <div
                  key={endpoint.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedEndpoints.includes(endpoint.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEndpoints(prev => [...prev, endpoint.id]);
                        } else {
                          setSelectedEndpoints(prev => prev.filter(id => id !== endpoint.id));
                        }
                      }}
                      className="rounded"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium truncate">{endpoint.url}</h3>
                        {getStatusBadge(endpoint.lastStatus)}
                        <Badge variant="outline" className="text-xs">
                          {endpoint.method}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Interval: {endpoint.intervalSec}s
                        </span>
                        {endpoint.lastLatencyMs && (
                          <span>
                            Latency: {endpoint.lastLatencyMs}ms
                          </span>
                        )}
                        {endpoint.lastCheckedAt && (
                          <span>
                            Last check: {format(new Date(endpoint.lastCheckedAt), 'MMM dd, HH:mm')}
                          </span>
                        )}
                        {endpoint.error && (
                          <span className="text-destructive">
                            Error: {endpoint.error}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestEndpoint(endpoint.id)}
                      disabled={testEndpoint.isPending}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={endpoint.enabled}
                      onCheckedChange={(checked) => handleToggleEndpoint(endpoint.id, checked)}
                      disabled={toggleEndpoint.isPending}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEndpoint(endpoint.id)}
                      disabled={deleteEndpoint.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}