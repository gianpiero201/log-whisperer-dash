import { AlertRuleDialog } from "@/components/alert-rule-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useAlertEvents, useAlertRules } from "@/hooks/use-alerts";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, CheckCircle, Clock, MoreVertical, Settings, Trash2 } from "lucide-react";

export default function Alerts() {
  const { rules, loading: rulesLoading, createRule, updateRule, deleteRule, toggleRule } = useAlertRules();
  const { events, loading: eventsLoading, resolveEvent, deleteEvent, getEventCountsBySeverity } = useAlertEvents();

  const eventCounts = getEventCountsBySeverity();
  const activeEvents = events.filter(event => event.status === 'active');

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "warning":
        return <Badge className="bg-warning text-warning-foreground">Warning</Badge>;
      case "info":
        return <Badge variant="secondary">Info</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusIcon = (status: string, enabled: boolean) => {
    if (!enabled) return <Clock className="h-4 w-4 text-muted-foreground" />;

    switch (status) {
      case "active":
        return <AlertTriangle className="h-4 w-4 text-error" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const handleDeleteRule = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the rule "${name}"?`)) {
      await deleteRule(id);
    }
  };

  const formatTimeAgo = (date: string | null) => {
    if (!date) return 'Never';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="border-b border-border/50 pb-4">
          <h1 className="text-3xl font-bold tracking-tight">Alert Management</h1>
          <p className="text-muted-foreground mt-2">
            Configure and manage alert rules for proactive monitoring
          </p>
        </div>

        {/* Alert Overview */}
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                  <p className="text-2xl font-bold">{activeEvents.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold text-destructive">{eventCounts.critical}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alert Rules</p>
                  <p className="text-2xl font-bold">{rules.length}</p>
                </div>
                <Settings className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Rules Management */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card className="lg:col-span-1 bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AlertRuleDialog onSave={createRule} />
              <div className="text-sm text-muted-foreground">
                <p>Create custom alert rules to monitor your system proactively.</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Monitor error rates</li>
                  <li>Track performance metrics</li>
                  <li>Database health checks</li>
                  <li>Custom SQL queries</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Alert Rules List */}
          <Card className="lg:col-span-2 bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Alert Rules ({rules.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading alert rules...
                </div>
              ) : rules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No alert rules configured</p>
                  <p className="text-sm">Create your first alert rule to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-background/50">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(rule.enabled ? 'active' : 'disabled', rule.enabled)}
                        <div>
                          <h4 className="font-medium">{rule.name}</h4>
                          {rule.query && (
                            <p className="text-sm text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded mt-1">
                              {rule.query.length > 60 ? `${rule.query.substring(0, 60)}...` : rule.query}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {getSeverityBadge(rule.severity)}
                            <span className="text-xs text-muted-foreground">
                              Throttle: {rule.throttle_seconds}s
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Created: {formatTimeAgo(rule.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                        />
                        <AlertRuleDialog
                          rule={rule}
                          onSave={(data) => updateRule(rule.id, data)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteRule(rule.id, rule.name)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Rule
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alert Events */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Recent Alert Events ({events.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading alert events...
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No alert events</p>
                <p className="text-sm">Alert events will appear here when rules are triggered</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 10).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg bg-background/50">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(event.status, true)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{event.alert_rules?.name || 'Unknown Rule'}</h4>
                          {getSeverityBadge(event.alert_rules?.severity || 'info')}
                          {event.status === 'resolved' && (
                            <Badge variant="outline" className="text-success border-success">
                              Resolved
                            </Badge>
                          )}
                        </div>
                        {event.message && (
                          <p className="text-sm text-muted-foreground mt-1">{event.message}</p>
                        )}
                        {event.endpoints?.url && (
                          <p className="text-xs text-muted-foreground">
                            Endpoint: {event.endpoints.url}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>Occurred: {formatTimeAgo(event.occurred_at)}</span>
                          {event.resolved_at && (
                            <span>• Resolved: {formatTimeAgo(event.resolved_at)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveEvent(event.id)}
                        >
                          Resolve
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteEvent(event.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
                {events.length > 10 && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing 10 of {events.length} events
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
