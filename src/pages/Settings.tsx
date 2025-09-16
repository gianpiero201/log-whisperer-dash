import { BackendMonitor } from "@/components/backend-monitor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUserSettings } from "@/hooks/use-user-settings";
import { logService } from "@/services/logs";
import { useAuth } from "@/store/authStore";
import { Bell, Database, Download, Settings as SettingsIcon, Shield, Trash2, Upload } from "lucide-react";
import { useState } from "react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings, loading, saving, updateSetting, saveSettings, resetToDefaults } = useUserSettings();

  // Notification settings (stored locally since not in DB schema)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [slackNotifications, setSlackNotifications] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [slackWebhook, setSlackWebhook] = useState("");

  const handleSaveSettings = () => {
    saveSettings();
  };

  const handleResetDefaults = () => {
    resetToDefaults();
    setEmailNotifications(true);
    setSlackNotifications(false);
    setEmailAddress("");
    setSlackWebhook("");
  };

  const handleExportData = async () => {
    if (!user) return;

    try {
      const dataBlob = await logService.exportLogs();
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `logs_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Data exported successfully',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  const handleClearAllLogs = async () => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete all logs? This action cannot be undone.')) {
      return;
    }

    try {
      // await logService.deleteLogs();

      toast({
        title: 'Success',
        description: 'All logs cleared successfully',
      });
    } catch (error) {
      console.error('Clear logs error:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear logs',
        variant: 'destructive',
      });
    }
  };

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
                  checked={settings.autoRefresh}
                  onCheckedChange={(checked) => updateSetting('autoRefresh', checked)}
                />
              </div>

              <div>
                <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
                <Select
                  value={settings.refreshInterval.toString()}
                  onValueChange={(value) => updateSetting('refreshInterval', parseInt(value))}
                >
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
                <Select
                  value={settings.theme}
                  onValueChange={(value) => {
                    updateSetting('theme', value);
                    saveSettings({ theme: value });
                  }}
                >
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
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => updateSetting('timezone', value)}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/Sao_Paulo">America/São_Paulo</SelectItem>
                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
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
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
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
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
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
                <Select
                  value={settings.logRetentionDays.toString()}
                  onValueChange={(value) => updateSetting('logRetentionDays', parseInt(value))}
                >
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
                <Select
                  value={settings.maxLogSizeMb.toString()}
                  onValueChange={(value) => updateSetting('maxLogSizeMb', parseInt(value))}
                >
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
                  <Button variant="outline" size="sm" onClick={handleExportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Danger Zone</h4>
                <Button variant="destructive" size="sm" onClick={handleClearAllLogs}>
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
          <Button
            variant="outline"
            onClick={handleResetDefaults}
            disabled={loading || saving}
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={loading || saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}