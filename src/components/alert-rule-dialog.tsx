import {
  AlertTriangle,
  CheckCircle,
  Info,
  TestTube,
  XCircle
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useCreateAlertRule,
  useTestAlertRule,
  useUpdateAlertRule,
  useValidateAlertQuery
} from '../hooks/use-alerts';
import { useEndpoints } from '../hooks/use-endpoints';
import { AlertRule, AlertSeverity, CreateAlertRuleRequest, UpdateAlertRuleRequest } from '../types/api';
import { ALERT_SEVERITY } from '../utils/constants';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
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
import { Textarea } from './ui/textarea';

interface AlertRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alertRule?: AlertRule | null; // null for create, AlertRule for edit
  onSuccess?: () => void;
}

export function AlertRuleDialog({
  open,
  onOpenChange,
  alertRule,
  onSuccess
}: AlertRuleDialogProps) {
  const isEditing = !!alertRule;

  // Form state
  const [formData, setFormData] = useState<UpdateAlertRuleRequest>(() => ({
    name: alertRule?.name || '',
    query: alertRule?.query || '',
    severity: alertRule?.severity || AlertSeverity.WARNING,
    throttleSeconds: alertRule?.throttleSeconds || 300,
    enabled: alertRule?.enabled ?? true
  }));

  const [testResult, setTestResult] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Data hooks
  const { data: endpoints = [] } = useEndpoints();

  // Mutation hooks
  const createRule = useCreateAlertRule();
  const updateRule = useUpdateAlertRule();
  const testRule = useTestAlertRule();
  const validateQuery = useValidateAlertQuery();

  // Reset form when dialog opens/closes or alertRule changes
  React.useEffect(() => {
    if (alertRule) {
      setFormData({
        name: alertRule.name,
        query: alertRule.query || '',
        severity: alertRule.severity,
        throttleSeconds: alertRule.throttleSeconds,
        enabled: alertRule.enabled
      });
    } else if (!open) {
      // Reset form when closing create dialog
      setFormData({
        name: '',
        query: '',
        severity: AlertSeverity.WARNING,
        throttleSeconds: 300,
        enabled: true
      });
      setTestResult(null);
      setValidationResult(null);
    }
  }, [alertRule, open]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a rule name');
      return;
    }

    if (!formData.query?.trim()) {
      toast.error('Please enter a query');
      return;
    }

    try {
      if (isEditing && alertRule) {
        await updateRule.mutateAsync({
          id: alertRule.id,
          data: formData
        });
        toast.success('Alert rule updated successfully');
      } else {
        await createRule.mutateAsync(formData);
        toast.success('Alert rule created successfully');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving alert rule:', error);
    }
  };

  const handleTestRule = async () => {
    if (!formData.query?.trim()) {
      toast.error('Please enter a query to test');
      return;
    }

    try {
      const result = await testRule.mutateAsync(formData);
      setTestResult(result);

      if (result.isValid) {
        toast.success(`Rule is valid! Found ${result.matches} potential matches.`);
      } else {
        toast.error('Rule validation failed');
      }
    } catch (error) {
      console.error('Error testing rule:', error);
      setTestResult({ isValid: false, errors: ['Failed to test rule'] });
    }
  };

  const handleValidateQuery = async () => {
    if (!formData.query?.trim()) {
      toast.error('Please enter a query to validate');
      return;
    }

    try {
      const result = await validateQuery.mutateAsync(formData.query);
      setValidationResult(result);

      if (result.isValid) {
        toast.success('Query syntax is valid');
      } else {
        toast.error('Query syntax has errors');
      }
    } catch (error) {
      console.error('Error validating query:', error);
      setValidationResult({ isValid: false, errors: ['Failed to validate query'] });
    }
  };

  const handleFormChange = (key: keyof CreateAlertRuleRequest, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));

    // Clear test results when form changes
    if (key === 'query') {
      setTestResult(null);
      setValidationResult(null);
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Alert Rule' : 'Create Alert Rule'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modify the alert rule settings and conditions'
              : 'Define conditions that will trigger an alert when met'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Basic Settings */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                placeholder="High Error Rate Alert"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A descriptive name for this alert rule
              </p>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="query">Alert Query</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleValidateQuery}
                  disabled={validateQuery.isPending || !formData.query?.trim()}
                >
                  {validateQuery.isPending ? (
                    <LoadingSpinner className="h-3 w-3 mr-2" />
                  ) : (
                    <CheckCircle className="h-3 w-3 mr-2" />
                  )}
                  Validate
                </Button>
              </div>
              <Textarea
                id="query"
                placeholder="level:ERROR AND service:api"
                value={formData.query}
                onChange={(e) => handleFormChange('query', e.target.value)}
                rows={3}
              />
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p>Examples:</p>
                  <p>• <code>level:ERROR</code> - All error logs</p>
                  <p>• <code>service:api AND level:ERROR</code> - API errors only</p>
                  <p>• <code>message:"database connection"</code> - Specific messages</p>
                </div>
              </div>
            </div>

            {/* Validation Result */}
            {validationResult && (
              <div className={`p-3 rounded-md border ${validationResult.isValid
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                <div className="flex items-center gap-2">
                  {validationResult.isValid ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {validationResult.isValid ? 'Query Valid' : 'Query Invalid'}
                  </span>
                </div>
                {validationResult.errors?.length > 0 && (
                  <ul className="mt-2 text-sm list-disc list-inside">
                    {validationResult.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                )}
                {validationResult.suggestions?.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-sm">Suggestions:</p>
                    <ul className="text-sm list-disc list-inside">
                      {validationResult.suggestions.map((suggestion: string, index: number) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => handleFormChange('severity', value as AlertSeverity)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      Info
                    </div>
                  </SelectItem>
                  <SelectItem value="warning">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Warning
                    </div>
                  </SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Critical
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="throttle">Throttle (seconds)</Label>
              <Input
                id="throttle"
                type="number"
                min="0"
                step="1"
                value={formData.throttleSeconds}
                onChange={(e) => handleFormChange('throttleSeconds', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Minimum time between alerts
              </p>
            </div>
          </div>

          {/* Enable/Disable */}
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => handleFormChange('enabled', checked)}
            />
            <Label htmlFor="enabled" className="flex items-center gap-2">
              Enable this alert rule
              {getSeverityBadge(formData.severity)}
            </Label>
          </div>

          {/* Test Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label>Test Rule</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestRule}
                disabled={testRule.isPending || !formData.query?.trim()}
              >
                {testRule.isPending ? (
                  <LoadingSpinner className="h-3 w-3 mr-2" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test Rule
              </Button>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`p-3 rounded-md border ${testResult.isValid
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                <div className="flex items-center gap-2 mb-2">
                  {testResult.isValid ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {testResult.isValid ? 'Test Successful' : 'Test Failed'}
                  </span>
                </div>

                {testResult.isValid && (
                  <div className="text-sm">
                    <p>Found <strong>{testResult.matches}</strong> potential matches</p>
                    {testResult.sampleMatches?.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Sample matches:</p>
                        <div className="mt-1 space-y-1">
                          {testResult.sampleMatches.slice(0, 3).map((match: any, index: number) => (
                            <div key={index} className="text-xs bg-white/50 p-2 rounded">
                              {match.message || 'No message'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {testResult.errors?.length > 0 && (
                  <ul className="mt-2 text-sm list-disc list-inside">
                    {testResult.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              (isEditing ? updateRule.isPending : createRule.isPending) ||
              !formData.name.trim() ||
              !formData.query?.trim()
            }
          >
            {(isEditing ? updateRule.isPending : createRule.isPending) && (
              <LoadingSpinner className="h-3 w-3 mr-2" />
            )}
            {isEditing ? 'Update Rule' : 'Create Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}