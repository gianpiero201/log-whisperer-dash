import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AlertRule } from '@/types/api';
import { Edit, Plus } from 'lucide-react';
import { useState } from 'react';


interface AlertRuleDialogProps {
  rule?: AlertRule;
  onSave: (ruleData: any) => Promise<any>;
  trigger?: React.ReactNode;
}

export function AlertRuleDialog({ rule, onSave, trigger }: AlertRuleDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    query: rule?.query || '',
    severity: rule?.severity || 'warning',
    throttle_seconds: rule?.throttleSeconds || 300,
    enabled: rule?.enabled ?? true,
  });

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      await onSave(formData);
      setOpen(false);
      if (!rule) {
        // Reset form for new rule
        setFormData({
          name: '',
          query: '',
          severity: 'warning',
          throttle_seconds: 300,
          enabled: true,
        });
      }
    } catch (error) {
      console.error('Error saving rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const defaultTrigger = rule ? (
    <Button variant="outline" size="sm">
      <Edit className="h-4 w-4 mr-2" />
      Edit
    </Button>
  ) : (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      New Alert Rule
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Edit Alert Rule' : 'Create New Alert Rule'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="rule-name">Rule Name *</Label>
            <Input
              id="rule-name"
              placeholder="e.g., High Error Rate"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="rule-query">Query/Condition</Label>
            <Textarea
              id="rule-query"
              placeholder="e.g., SELECT COUNT(*) FROM logs WHERE level = 'error' AND timestamp > NOW() - INTERVAL '5 minutes'"
              value={formData.query}
              onChange={(e) => setFormData(prev => ({ ...prev, query: e.target.value }))}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              SQL query or condition that triggers the alert
            </p>
          </div>

          <div>
            <Label htmlFor="rule-severity">Severity</Label>
            <Select
              value={formData.severity}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, severity: value }))}
            >
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

          <div>
            <Label htmlFor="throttle-seconds">Throttle (seconds)</Label>
            <Input
              id="throttle-seconds"
              type="number"
              min="60"
              placeholder="300"
              value={formData.throttle_seconds}
              onChange={(e) => setFormData(prev => ({ ...prev, throttle_seconds: parseInt(e.target.value) || 300 }))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum time between alerts for the same rule
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="rule-enabled">Enable Rule</Label>
              <p className="text-sm text-muted-foreground">
                Rule will only trigger when enabled
              </p>
            </div>
            <Switch
              id="rule-enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name.trim() || loading}
          >
            {loading ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}