import { useState } from "react";
import { AlertTriangle, CheckCircle, Clock, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const alertRules = [
  {
    id: "1",
    name: "High Error Rate",
    description: "Trigger when error rate exceeds 5% in 5 minutes",
    severity: "critical",
    enabled: true,
    lastTriggered: "2 hours ago",
    status: "active"
  },
  {
    id: "2", 
    name: "Database Connection Timeout",
    description: "Alert when database connections timeout",
    severity: "warning",
    enabled: true,
    lastTriggered: "Never",
    status: "pending"
  },
  {
    id: "3",
    name: "Memory Usage High",
    description: "Alert when memory usage exceeds 85%",
    severity: "warning", 
    enabled: false,
    lastTriggered: "1 day ago",
    status: "disabled"
  }
];

export default function Alerts() {
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleCondition, setNewRuleCondition] = useState("");
  const [newRuleSeverity, setNewRuleSeverity] = useState("warning");

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

        {/* Alert Rules Configuration */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Create New Alert Rule */}
          <Card className="lg:col-span-1 bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                New Alert Rule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  placeholder="e.g., High CPU Usage"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="rule-condition">Condition</Label>
                <Input
                  id="rule-condition"
                  placeholder="e.g., cpu_usage > 80%"
                  value={newRuleCondition}
                  onChange={(e) => setNewRuleCondition(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="rule-severity">Severity</Label>
                <Select value={newRuleSeverity} onValueChange={setNewRuleSeverity}>
                  <SelectTrigger id="rule-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" disabled={!newRuleName || !newRuleCondition}>
                Create Alert Rule
              </Button>
            </CardContent>
          </Card>

          {/* Existing Alert Rules */}
          <Card className="lg:col-span-2 bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Active Alert Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-background/50">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(rule.status, rule.enabled)}
                      <div>
                        <h4 className="font-medium">{rule.name}</h4>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getSeverityBadge(rule.severity)}
                          <span className="text-xs text-muted-foreground">
                            Last triggered: {rule.lastTriggered}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => {}}
                      />
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert History */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent alerts</p>
              <p className="text-sm">Alert history will appear here when rules are triggered</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
