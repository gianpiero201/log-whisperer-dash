import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type AlertRule = Tables<'alert_rules'>;
type AlertRuleInsert = TablesInsert<'alert_rules'>;
type AlertRuleUpdate = TablesUpdate<'alert_rules'>;

export function useAlertRules() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(false);

  // Load alert rules
  const loadRules = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading alert rules:', error);
        toast({
          title: 'Error',
          description: 'Failed to load alert rules',
          variant: 'destructive',
        });
        return;
      }

      setRules(data || []);
    } catch (error) {
      console.error('Error loading alert rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load alert rules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create new alert rule
  const createRule = async (ruleData: Omit<AlertRuleInsert, 'user_id'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('alert_rules')
        .insert({
          ...ruleData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating alert rule:', error);
        toast({
          title: 'Error',
          description: 'Failed to create alert rule',
          variant: 'destructive',
        });
        return null;
      }

      setRules(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Alert rule created successfully',
      });

      return data;
    } catch (error) {
      console.error('Error creating alert rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to create alert rule',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update alert rule
  const updateRule = async (id: string, updates: AlertRuleUpdate) => {
    try {
      const { data, error } = await supabase
        .from('alert_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating alert rule:', error);
        toast({
          title: 'Error',
          description: 'Failed to update alert rule',
          variant: 'destructive',
        });
        return null;
      }

      setRules(prev => prev.map(rule => rule.id === id ? data : rule));
      toast({
        title: 'Success',
        description: 'Alert rule updated successfully',
      });

      return data;
    } catch (error) {
      console.error('Error updating alert rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update alert rule',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Delete alert rule
  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('alert_rules')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting alert rule:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete alert rule',
          variant: 'destructive',
        });
        return false;
      }

      setRules(prev => prev.filter(rule => rule.id !== id));
      toast({
        title: 'Success',
        description: 'Alert rule deleted successfully',
      });

      return true;
    } catch (error) {
      console.error('Error deleting alert rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete alert rule',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Toggle rule enabled status
  const toggleRule = async (id: string, enabled: boolean) => {
    return updateRule(id, { enabled });
  };

  // Load rules when user changes
  useEffect(() => {
    if (user) {
      loadRules();
    } else {
      setRules([]);
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('alert_rules_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alert_rules',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRules(prev => [payload.new as AlertRule, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setRules(prev => prev.map(rule => 
              rule.id === payload.new.id ? payload.new as AlertRule : rule
            ));
          } else if (payload.eventType === 'DELETE') {
            setRules(prev => prev.filter(rule => rule.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    rules,
    loading,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    loadRules,
  };
}