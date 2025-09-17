import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Check,
  Edit,
  Eye,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Settings,
  Trash2
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useActiveAlertEvents,
  useAlertRules,
  useAlertStatistics,
  useBulkAlertRuleOperations,
  useCreateAlertRule,
  useDeleteAlertRule,
  useResolveAlertEvent,
  useToggleAlertRule,
  useUpdateAlertRule
} from '../hooks/use-alerts';
import { AlertRule, AlertSeverity, UpdateAlertRuleRequest } from '../types/api';
import { ALERT_SEVERITY } from '../utils/constants';

export function Alerts() {
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'events'>('rules');

  // Data hooks
  const {
    data: alertRules,
    isPending: loadingRules,
    error: rulesError,
    refetch: refetchRules
  } = useAlertRules();

  const {
    data: activeEvents = [],
    isPending: loadingEvents,
    error: eventsError,
    refetch: refetchEvents
  } = useActiveAlertEvents();

  const {
    data: statistics,
    isPending: loadingStats,
    error: statsError
  } = useAlertStatistics();

  // Mutation hooks
  const createRule = useCreateAlertRule();
  const updateRule = useUpdateAlertRule();
  const deleteRule = useDeleteAlertRule();
  const toggleRule = useToggleAlertRule();
  const resolveEvent = useResolveAlertEvent();
  const { deleteMultiple, toggleMultiple, resolveMultipleEvents } = useBulkAlertRuleOperations();

  // Form state for creating/editing rules
  const [formData, setFormData] = useState<UpdateAlertRuleRequest>({
    name: '',
    query: '',
    severity: AlertSeverity.WARNING,
    throttleSeconds: 300,
    enabled: true
  });

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (editingRule) {
      setFormData({
        name: editingRule.name,
        query: editingRule.query || '',
        severity: editingRule.severity,
        throttleSeconds: editingRule.throttleSeconds,
        enabled: editingRule.enabled
      });
    } else if (!isCreateDialogOpen) {
      setFormData({
        name: '',
        query: '',
        severity: AlertSeverity.WARNING,
        throttleSeconds: 300,
        enabled: true
      });
    }
  }, [editingRule, isCreateDialogOpen]);

  const handleCreateRule = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a rule name');
      return;
    }

    if (!formData.query?.trim()) {
      toast.error('Please enter a query');
      return;
    }

    try {
      if (editingRule) {
        await updateRule.mutateAsync({
          id: editingRule.id,
          data: formData
        });
      } else {
        await createRule.mutateAsync(formData);
      }

      setIsCreateDialogOpen(false);
      setEditingRule(null);
    } catch (error) {
      console.error('Error saving alert rule:', error);
    }
  };

  const handleEditRule = (rule: AlertRule) => {
    setEditingRule(rule);
    setIsCreateDialogOpen(true);
  };

  const handleToggleRule = async (id: string, enabled: boolean) => {
    try {
      await toggleRule.mutateAsync({ id, enabled });
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this alert rule?')) {
      try {
        await deleteRule.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting rule:', error);
      }
    }
  };

  const handleResolveEvent = async (eventId: string) => {
    try {
      await resolveEvent.mutateAsync(eventId);
    } catch (error) {
      console.error('Error resolving event:', error);
    }
  };

  const handleBulkDeleteRules = async () => {
    if (selectedRules.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedRules.length} alert rules?`)) {
      try {
        await deleteMultiple.mutateAsync(selectedRules);
        setSelectedRules([]);
      } catch (error) {
        console.error('Error deleting rules:', error);
      }
    }
  };

  const handleBulkToggleRules = async (enabled: boolean) => {
    if (selectedRules.length === 0) return;

    try {
      await toggleMultiple.mutateAsync({ ruleIds: selectedRules, enabled });
      setSelectedRules([]);
    } catch (error) {
      console.error('Error toggling rules:', error);
    }
  };

  const handleBulkResolveEvents = async () => {
    if (selectedEvents.length === 0) return;

    try {
      await resolveMultipleEvents.mutateAsync(selectedEvents);
      setSelectedEvents([]);
    } catch (error) {
      console.error('Error resolving events:', error);
    }
  };

  const toggleRuleSelection = (ruleId: string) => {
    setSelectedRules(prev =>
      prev.includes(ruleId)
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    const config = ALERT_SEVERITY[severity];
    return (
      <Badge
        variant={
          severity === 'critical' ? 'destructive' :
            severity === 'warning' ? 'secondary' : 'outline'
        }
        className="flex items-center gap-1"
      >
        {config.label}
      </Badge>
    );
  };

  const hasError = rulesError || eventsError || statsError;
  const isPending = loadingRules || loadingEvents || loadingStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground">
            Manage alert rules and monitor system events
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchRules();
              refetchEvents();
            }}
            disabled={isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setEditingRule(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Alert Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
                </DialogTitle>
                <DialogDescription>
                  {editingRule
                    ? 'Modify the alert rule settings and conditions'
                    : 'Define conditions that will trigger an alert when met'
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    placeholder="High Error Rate Alert"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="query">Alert Query</Label>
                  <Input
                    id="query"
                    placeholder="level:ERROR AND service:api"
                    value={formData.query}
                    onChange={(e) => setFormData(prev => ({ ...prev, query: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="severity">Severity</Label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value as AlertSeverity }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="throttle">Throttle (seconds)</Label>
                    <Input
                      id="throttle"
                      type="number"
                      min="0"
                      value={formData.throttleSeconds}
                      onChange={(e) => setFormData(prev => ({ ...prev, throttleSeconds: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                  />
                  <Label htmlFor="enabled" className="flex items-center gap-2">
                    Enable this alert rule
                    {getSeverityBadge(formData.severity)}
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRule}
                  disabled={
                    (editingRule ? updateRule.isPending : createRule.isPending) ||
                    !formData.name.trim() ||
                    !formData.query?.trim()
                  }
                >
                  {(editingRule ? updateRule.isPending : createRule.isPending) && (
                    <LoadingSpinner size="sm" className="mr-2" />
                  )}
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error State */}
      {hasError && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Failed to load alert data</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Please check your connection and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <div className="text-2xl font-bold">{statistics?.totalRules || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {statistics?.activeRules || 0} active
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <div className="text-2xl font-bold text-destructive">
                  {statistics?.activeEvents || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Require attention
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <div className="text-2xl font-bold">{statistics?.totalEvents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {statistics?.resolvedEvents || 0} resolved
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {statistics?.totalEvents
                    ? Math.round((statistics.resolvedEvents / statistics.totalEvents) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Events resolved
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b">
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'rules'
            ? 'bg-background border-b-2 border-primary text-primary'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          Alert Rules ({alertRules.items.length})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'events'
            ? 'bg-background border-b-2 border-primary text-primary'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          Active Events ({activeEvents.length})
        </button>
      </div>

      {/* Alert Rules Tab */}
      {activeTab === 'rules' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Alert Rules</CardTitle>
                <CardDescription>
                  Manage your alert rules and monitoring conditions
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {selectedRules.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkToggleRules(true)}
                      disabled={toggleMultiple.isPending}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Enable ({selectedRules.length})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkToggleRules(false)}
                      disabled={toggleMultiple.isPending}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Disable ({selectedRules.length})
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDeleteRules}
                      disabled={deleteMultiple.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete ({selectedRules.length})
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingRules ? (
              <div className="flex items-center justify-center p-8">
                <LoadingSpinner text="Loading alert rules..." />
              </div>
            ) : alertRules.items.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No alert rules configured</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first alert rule to start monitoring your logs
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {alertRules.items.map((rule) => (
                  <div
                    key={rule.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 ${selectedRules.includes(rule.id) ? 'bg-accent/50' : ''
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedRules.includes(rule.id)}
                        onChange={() => toggleRuleSelection(rule.id)}
                        className="rounded"
                      />

                      <div className="flex-1">
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {rule.query || 'No query defined'}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getSeverityBadge(rule.severity)}
                          <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                            {rule.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Throttle: {rule.throttleSeconds}s
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRule(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                        disabled={toggleRule.isPending}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                        disabled={deleteRule.isPending}
                      >
                        {deleteRule.isPending ? (
                          <LoadingSpinner size="xs" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Events Tab */}
      {activeTab === 'events' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Events</CardTitle>
                <CardDescription>
                  Events that require your attention
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {selectedEvents.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkResolveEvents}
                    disabled={resolveMultipleEvents.isPending}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Resolve ({selectedEvents.length})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingEvents ? (
              <div className="flex items-center justify-center p-8">
                <LoadingSpinner text="Loading active events..." />
              </div>
            ) : activeEvents.length === 0 ? (
              <div className="text-center py-8">
                <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-muted-foreground">No active events</p>
                <p className="text-sm text-muted-foreground">
                  All alerts have been resolved
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 ${selectedEvents.includes(event.id) ? 'bg-accent/50' : ''
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event.id)}
                        onChange={() => toggleEventSelection(event.id)}
                        className="rounded"
                      />

                      <div className="flex-1">
                        <div className="font-medium">{event.rule.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.message || 'No message'}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getSeverityBadge(event.rule.severity)}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(event.occurredAt), 'MMM dd, HH:mm:ss')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleResolveEvent(event.id)}
                      disabled={resolveEvent.isPending}
                    >
                      {resolveEvent.isPending ? (
                        <LoadingSpinner size="xs" className="mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Resolve
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}