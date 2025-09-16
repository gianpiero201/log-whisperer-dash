import {
    AlertTriangle,
    Check,
    Eye,
    Pause,
    Play,
    Plus,
    Settings,
    TestTube,
    Trash2
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
    useActiveAlertEvents,
    useAlertRules,
    useAlertStatistics,
    useBulkAlertRuleOperations,
    useCreateAlertRule,
    useDeleteAlertRule,
    useResolveAlertEvent,
    useTestAlertRule,
    useToggleAlertRule,
    useUpdateAlertRule
} from '../hooks/use-alerts';
import {
    useEndpoints
} from '../hooks/use-endpoints';
import { AlertSeverity, CreateAlertRuleRequest } from '../types/api';
import { ALERT_SEVERITY } from '../utils/constants';
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
import LoadingSpinner from './ui/loading-spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';

export function AlertsManagement() {
    const [selectedRules, setSelectedRules] = useState<string[]>([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<string | null>(null);

    // Data hooks
    const { data: alertRules = [], isPending: loadingRules, refetch: refetchRules } = useAlertRules();
    const { data: activeEvents = [], isPending: loadingEvents } = useActiveAlertEvents();
    const { data: statistics, isPending: loadingStats } = useAlertStatistics();
    const { data: endpoints = [] } = useEndpoints();

    // Mutation hooks
    const createRule = useCreateAlertRule();
    const updateRule = useUpdateAlertRule();
    const deleteRule = useDeleteAlertRule();
    const toggleRule = useToggleAlertRule();
    const testRule = useTestAlertRule();
    const resolveEvent = useResolveAlertEvent();
    const { deleteMultiple, toggleMultiple } = useBulkAlertRuleOperations();

    // Form state
    const [formData, setFormData] = useState<CreateAlertRuleRequest>({
        name: '',
        query: '',
        severity: AlertSeverity.WARNING,
        throttleSeconds: 300,
        enabled: true
    });

    const handleCreateRule = async () => {
        try {
            await createRule.mutateAsync(formData);
            setIsCreateDialogOpen(false);
            setFormData({
                name: '',
                query: '',
                severity: AlertSeverity.WARNING,
                throttleSeconds: 300,
                enabled: true
            });
        } catch (error) {
            console.error('Error creating rule:', error);
        }
    };

    const handleTestRule = async () => {
        try {
            const result = await testRule.mutateAsync(formData);
            if (result.isValid) {
                toast.success(`Rule is valid! Found ${result.matches} potential matches.`);
            } else {
                toast.error(`Rule validation failed: ${result.errors?.join(', ')}`);
            }
        } catch (error) {
            console.error('Error testing rule:', error);
        }
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

    const handleBulkDelete = async () => {
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

    const handleBulkToggle = async (enabled: boolean) => {
        if (selectedRules.length === 0) return;

        try {
            await toggleMultiple.mutateAsync({ ruleIds: selectedRules, enabled });
            setSelectedRules([]);
        } catch (error) {
            console.error('Error toggling rules:', error);
        }
    };

    if (loadingRules || loadingStats) {
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
                        <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statistics?.totalRules || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {statistics?.activeRules || 0} active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Events</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">
                            {statistics?.activeEvents || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Require attention
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statistics?.totalEvents || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {statistics?.resolvedEvents || 0} resolved
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <Check className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {statistics?.totalEvents
                                ? Math.round((statistics.resolvedEvents / statistics.totalEvents) * 100)
                                : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Events resolved
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Active Events Section */}
            {activeEvents.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Active Alert Events
                        </CardTitle>
                        <CardDescription>
                            {activeEvents.length} events require immediate attention
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {activeEvents.slice(0, 5).map((event) => (
                                <div
                                    key={event.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium">{event.rule.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {event.message || 'No message'}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge
                                                variant={
                                                    event.rule.severity === 'critical' ? 'destructive' :
                                                        event.rule.severity === 'warning' ? 'secondary' : 'outline'
                                                }
                                            >
                                                {ALERT_SEVERITY[event.rule.severity].label}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(event.occurredAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleResolveEvent(event.id)}
                                        disabled={resolveEvent.isPending}
                                    >
                                        {resolveEvent.isPending ? <LoadingSpinner className="h-3 w-3" /> : 'Resolve'}
                                    </Button>
                                </div>
                            ))}
                            {activeEvents.length > 5 && (
                                <div className="text-center py-2">
                                    <Button variant="ghost" size="sm">
                                        View all {activeEvents.length} events
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Alert Rules Section */}
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
                                        onClick={() => handleBulkToggle(true)}
                                        disabled={toggleMultiple.isPending}
                                    >
                                        <Play className="h-4 w-4 mr-2" />
                                        Enable ({selectedRules.length})
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleBulkToggle(false)}
                                        disabled={toggleMultiple.isPending}
                                    >
                                        <Pause className="h-4 w-4 mr-2" />
                                        Disable ({selectedRules.length})
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleBulkDelete}
                                        disabled={deleteMultiple.isPending}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete ({selectedRules.length})
                                    </Button>
                                </>
                            )}

                            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        New Rule
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Create Alert Rule</DialogTitle>
                                        <DialogDescription>
                                            Define conditions that will trigger an alert
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Rule Name</Label>
                                            <Input
                                                id="name"
                                                placeholder="Enter rule name"
                                                value={formData.name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="query">Query</Label>
                                            <Input
                                                id="query"
                                                placeholder="level:ERROR AND service:api"
                                                value={formData.query}
                                                onChange={(e) => setFormData(prev => ({ ...prev, query: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-2">
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

                                        <div className="space-y-2">
                                            <Label htmlFor="throttle">Throttle (seconds)</Label>
                                            <Input
                                                id="throttle"
                                                type="number"
                                                value={formData.throttleSeconds}
                                                onChange={(e) => setFormData(prev => ({ ...prev, throttleSeconds: parseInt(e.target.value) }))}
                                            />
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="enabled"
                                                checked={formData.enabled}
                                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                                            />
                                            <Label htmlFor="enabled">Enable rule</Label>
                                        </div>
                                    </div>

                                    <DialogFooter className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={handleTestRule}
                                            disabled={testRule.isPending || !formData.name || !formData.query}
                                        >
                                            {testRule.isPending ? <LoadingSpinner className="h-3 w-3 mr-2" /> : <TestTube className="h-4 w-4 mr-2" />}
                                            Test
                                        </Button>
                                        <Button
                                            onClick={handleCreateRule}
                                            disabled={createRule.isPending || !formData.name || !formData.query}
                                        >
                                            {createRule.isPending ? <LoadingSpinner className="h-3 w-3 mr-2" /> : null}
                                            Create Rule
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {alertRules.length === 0 ? (
                        <div className="text-center py-8">
                            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No alert rules configured</p>
                            <p className="text-sm text-muted-foreground mb-4">
                                Create your first alert rule to start monitoring your logs
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {alertRules.map((rule) => (
                                <div
                                    key={rule.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedRules.includes(rule.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedRules(prev => [...prev, rule.id]);
                                                } else {
                                                    setSelectedRules(prev => prev.filter(id => id !== rule.id));
                                                }
                                            }}
                                            className="rounded"
                                        />

                                        <div className="flex-1">
                                            <div className="font-medium">{rule.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {rule.query || 'No query defined'}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge
                                                    variant={
                                                        rule.severity === 'critical' ? 'destructive' :
                                                            rule.severity === 'warning' ? 'secondary' : 'outline'
                                                    }
                                                >
                                                    {ALERT_SEVERITY[rule.severity].label}
                                                </Badge>
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