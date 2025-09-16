import { useToast } from '@/hooks/use-toast';
import { userSettingsService } from '@/services/user-settings';
import { useAuth } from '@/store/authStore';
import { UpdateUserSettingsRequest } from '@/types/api';
import { useEffect, useState } from 'react';

interface UserSettingsState {
  autoRefresh: boolean;
  refreshInterval: number;
  theme: string;
  timezone: string;
  logRetentionDays: number;
  maxLogSizeMb: number;
}

const DEFAULT_SETTINGS: UserSettingsState = {
  autoRefresh: true,
  refreshInterval: 30,
  theme: 'system',
  timezone: 'UTC',
  logRetentionDays: 30,
  maxLogSizeMb: 100,
};

export function useUserSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load user settings
  const loadSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userSettings = await userSettingsService.getUserSettings();

      if (userSettings) {
        setSettings({
          ...userSettings,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Save user settings
  const saveSettings = async (newSettings?: Partial<UserSettingsState>) => {
    if (!user) return;

    setSaving(true);
    const settingsToSave = { ...settings, ...newSettings };

    try {
      const settingsData: UpdateUserSettingsRequest = {
        autoRefresh: settingsToSave.autoRefresh,
        refreshInterval: settingsToSave.refreshInterval,
        theme: settingsToSave.theme,
        timezone: settingsToSave.timezone,
        logRetentionDays: settingsToSave.logRetentionDays,
        maxLogSizeMb: settingsToSave.maxLogSizeMb,
      };

      await userSettingsService.createOrUpdateUserSettings(settingsData);

      if (newSettings) {
        setSettings(settingsToSave);
      }

      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset to default settings
  const resetToDefaults = async () => {
    if (!user) return;

    setSaving(true);
    try {
      userSettingsService.createOrUpdateUserSettings(DEFAULT_SETTINGS);

      setSettings(DEFAULT_SETTINGS);
      toast({
        title: 'Success',
        description: 'Settings reset to defaults',
      });
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Update individual setting
  const updateSetting = (key: keyof UserSettingsState, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Load settings when user changes
  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
  }, [user]);

  return {
    settings,
    loading,
    saving,
    updateSetting,
    saveSettings,
    resetToDefaults,
    loadSettings,
  };
}