import { useState } from "react";
import { Settings as SettingsIcon, Database, Bell, Shield, Download, Upload, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BackendMonitor } from "@/components/backend-monitor";

export default function Settings() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("30");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [slackNotifications, setSlackNotifications] = useState(false);
  const [logRetention, setLogRetention] = useState("30");
  const [maxLogSize, setMaxLogSize] = useState("100");

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="border-b border-border/50 pb-4">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure your log management system preferences and integrations
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* General Settings */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-refresh">Auto Refresh</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically refresh log data
                  </p>
                </div>
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
              </div>

              <div>
                <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
                <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                  <SelectTrigger id="refresh-interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select defaultValue="system">
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="utc">
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="america/sao_paulo">America/São_Paulo</SelectItem>
                    <SelectItem value="america/new_york">America/New_York</SelectItem>
                    <SelectItem value="europe/london">Europe/London</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="slack-notifications">Slack Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send alerts to Slack channel
                  </p>
                </div>
                <Switch
                  id="slack-notifications"
                  checked={slackNotifications}
                  onCheckedChange={setSlackNotifications}
                />
              </div>

              {emailNotifications && (
                <div>
                  <Label htmlFor="email-address">Email Address</Label>
                  <Input
                    id="email-address"
                    type="email"
                    placeholder="your-email@company.com"
                  />
                </div>
              )}

              {slackNotifications && (
                <div>
                  <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
                  <Input
                    id="slack-webhook"
                    type="url"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="log-retention">Log Retention (days)</Label>
                <Select value={logRetention} onValueChange={setLogRetention}>
                  <SelectTrigger id="log-retention">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="max-log-size">Max Log Size (MB)</Label>
                <Select value={maxLogSize} onValueChange={setMaxLogSize}>
                  <SelectTrigger id="max-log-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 MB</SelectItem>
                    <SelectItem value="100">100 MB</SelectItem>
                    <SelectItem value="500">500 MB</SelectItem>
                    <SelectItem value="1000">1 GB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Data Export/Import</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Danger Zone</h4>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Logs
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Version:</span>
                  <Badge variant="outline" className="ml-2">v2.1.0</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Environment:</span>
                  <Badge variant="outline" className="ml-2">Production</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Database:</span>
                  <Badge variant="outline" className="ml-2">Connected</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">API Status:</span>
                  <Badge className="ml-2 bg-success text-success-foreground">Online</Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Storage Usage</h4>
                <div className="w-full bg-secondary/50 rounded-full h-2">
                  <div className="bg-gradient-primary h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>45 MB used</span>
                  <span>100 MB total</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Backend Monitoring */}
        <BackendMonitor />

        {/* Save Settings */}
        <div className="flex justify-end gap-2">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Settings</Button>
        </div>
      </div>
    </div>
  );
}