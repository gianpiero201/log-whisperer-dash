// import { useState, useEffect } from 'react';
// import { useToast } from '@/hooks/use-toast';
// import { AlertEvent } from '@/types/api';
// import { useAuth } from '@/store/authStore';


// interface AlertEventWithRule extends AlertEvent {
//   alert_rules: {
//     name: string;
//     severity: string;
//   } | null;
//   endpoints: {
//     url: string;
//   } | null;
// }

// export function useAlertEvents() {
//   const { user } = useAuth();
//   const { toast } = useToast();
//   const [events, setEvents] = useState<AlertEventWithRule[]>([]);
//   const [loading, setLoading] = useState(false);

//   // Load alert events with rule and endpoint information
//   const loadEvents = async (limit = 50) => {
//     if (!user) return;
    
//     setLoading(true);
//     try {
//       // const { data, error } = await supabase
//       //   .from('alert_events')
//       //   .select(`
//       //     *,
//       //     alert_rules!inner (
//       //       name,
//       //       severity,
//       //       user_id
//       //     ),
//       //     endpoints (
//       //       url
//       //     )
//       //   `)
//       //   .eq('alert_rules.user_id', user.id)
//       //   .order('occurred_at', { ascending: false })
//       //   .limit(limit);



//       if (error) {
//         console.error('Error loading alert events:', error);
//         toast({
//           title: 'Error',
//           description: 'Failed to load alert events',
//           variant: 'destructive',
//         });
//         return;
//       }

//       setEvents(data || []);
//     } catch (error) {
//       console.error('Error loading alert events:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to load alert events',
//         variant: 'destructive',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Resolve alert event
//   const resolveEvent = async (id: string) => {
//     try {
//       const { error } = await supabase
//         .from('alert_events')
//         .update({ 
//           status: 'resolved',
//           resolved_at: new Date().toISOString()
//         })
//         .eq('id', id);

//       if (error) {
//         console.error('Error resolving alert event:', error);
//         toast({
//           title: 'Error',
//           description: 'Failed to resolve alert',
//           variant: 'destructive',
//         });
//         return false;
//       }

//       setEvents(prev => prev.map(event => 
//         event.id === id 
//           ? { ...event, status: 'resolved' as any, resolved_at: new Date().toISOString() }
//           : event
//       ));

//       toast({
//         title: 'Success',
//         description: 'Alert resolved successfully',
//       });

//       return true;
//     } catch (error) {
//       console.error('Error resolving alert event:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to resolve alert',
//         variant: 'destructive',
//       });
//       return false;
//     }
//   };

//   // Delete alert event
//   const deleteEvent = async (id: string) => {
//     try {
//       const { error } = await supabase
//         .from('alert_events')
//         .delete()
//         .eq('id', id);

//       if (error) {
//         console.error('Error deleting alert event:', error);
//         toast({
//           title: 'Error',
//           description: 'Failed to delete alert',
//           variant: 'destructive',
//         });
//         return false;
//       }

//       setEvents(prev => prev.filter(event => event.id !== id));
//       toast({
//         title: 'Success',
//         description: 'Alert deleted successfully',
//       });

//       return true;
//     } catch (error) {
//       console.error('Error deleting alert event:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to delete alert',
//         variant: 'destructive',
//       });
//       return false;
//     }
//   };

//   // Get events by status
//   const getEventsByStatus = (status: 'active' | 'resolved') => {
//     return events.filter(event => event.status === status);
//   };

//   // Get events count by severity
//   const getEventCountsBySeverity = () => {
//     const counts = { critical: 0, warning: 0, info: 0 };
//     events
//       .filter(event => event.status === 'active')
//       .forEach(event => {
//         const severity = event.alert_rules?.severity as keyof typeof counts;
//         if (severity && counts.hasOwnProperty(severity)) {
//           counts[severity]++;
//         }
//       });
//     return counts;
//   };

//   // Load events when user changes
//   useEffect(() => {
//     if (user) {
//       loadEvents();
//     } else {
//       setEvents([]);
//     }
//   }, [user]);

//   // Set up real-time subscription for alert events
//   useEffect(() => {
//     if (!user) return;

//     const channel = supabase
//       .channel('alert_events_changes')
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'alert_events',
//         },
//         async (payload) => {
//           // Reload events to get the full data with joins
//           await loadEvents();
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [user]);

//   return {
//     events,
//     loading,
//     loadEvents,
//     resolveEvent,
//     deleteEvent,
//     getEventsByStatus,
//     getEventCountsBySeverity,
//   };
// }