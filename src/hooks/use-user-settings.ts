import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type UserSettings = Tables<'user_settings'>;
type UserSettingsInsert = TablesInsert<'user_settings'>;
type UserSettingsUpdate = TablesUpdate<'user_settings'>;

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
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load settings',
          variant: 'destructive',
        });
        return;
      }

      if (data) {
        setSettings({
          autoRefresh: data.auto_refresh,
          refreshInterval: data.refresh_interval,
          theme: data.theme,
          timezone: data.timezone,
          logRetentionDays: data.log_retention_days,
          maxLogSizeMb: data.max_log_size_mb,
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
      const settingsData: UserSettingsInsert = {
        user_id: user.id,
        auto_refresh: settingsToSave.autoRefresh,
        refresh_interval: settingsToSave.refreshInterval,
        theme: settingsToSave.theme,
        timezone: settingsToSave.timezone,
        log_retention_days: settingsToSave.logRetentionDays,
        max_log_size_mb: settingsToSave.maxLogSizeMb,
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert(settingsData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error saving settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to save settings',
          variant: 'destructive',
        });
        return;
      }

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
      const { error } = await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error resetting settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to reset settings',
          variant: 'destructive',
        });
        return;
      }

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