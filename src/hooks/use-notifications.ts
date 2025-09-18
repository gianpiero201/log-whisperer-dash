import { toast } from '@/hooks/use-toast';
import { SignalRClient, createNotificationsConnection } from '@/lib/signalr-client';
import { AUTH_CONFIG } from '@/utils/constants';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface Notification {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    createdAt: string;
    isRead: boolean;
    actionUrl?: string;
    actionText?: string;
    metadata?: Record<string, any>;
}

export interface SystemNotification {
    id: string;
    type: 'maintenance' | 'update' | 'announcement';
    title: string;
    message: string;
    createdAt: string;
    expiresAt?: string;
    priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface AlertNotification {
    id: string;
    ruleId: string;
    ruleName: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    endpointId?: string;
    endpointUrl?: string;
    occurredAt: string;
    status: 'active' | 'resolved';
}

export interface EndpointDownNotification {
    endpointId: string;
    endpointUrl: string;
    statusCode?: number;
    error?: string;
    detectedAt: string;
    responseTimeMs?: number;
    severity: string;
}

export interface EndpointRecoveredNotification {
    endpointId: string;
    endpointUrl: string;
    statusCode: number;
    responseTimeMs: number;
    recoveredAt: string;
    downtimeDuration: string;
}

export interface ConnectionStatus {
    status: 'connected' | 'disconnected' | 'reconnecting';
    timestamp: string;
    message?: string;
    reconnectAttempt?: number;
}

export function useNotifications() {
    const [connection, setConnection] = useState<SignalRClient | null>(null);
    const [connectionState, setConnectionState] = useState<string>('Disconnected');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
    const [alertNotifications, setAlertNotifications] = useState<AlertNotification[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

    // Initialize connection
    useEffect(() => {
        const accessToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        if (!accessToken) {
            setError('No access token found');
            return;
        }

        const newConnection = createNotificationsConnection(accessToken);
        setConnection(newConnection);

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            newConnection.stop();
        };
    }, []);

    // Setup event handlers and start connection
    useEffect(() => {
        if (!connection) return;

        const setupConnection = async () => {
            try {
                // Setup event handlers
                connection.on('Notification', (notification: Notification) => {
                    setNotifications(prev => [notification, ...prev.slice(0, 99)]); // Keep last 100
                    setUnreadCount(prev => prev + 1);

                    // Show toast notification
                    toast({
                        title: notification.title,
                        description: notification.message,
                        variant: notification.type === 'error' ? 'destructive' : 'default',
                    });
                });

                connection.on('SystemNotification', (notification: SystemNotification) => {
                    setSystemNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10

                    // Show toast for high priority system notifications
                    if (notification.priority === 'high' || notification.priority === 'critical') {
                        toast({
                            title: `🔔 ${notification.title}`,
                            description: notification.message,
                            variant: notification.priority === 'critical' ? 'destructive' : 'default',
                        });
                    }
                });

                connection.on('AlertNotification', (alert: AlertNotification) => {
                    setAlertNotifications(prev => [alert, ...prev.slice(0, 49)]); // Keep last 50

                    // Show toast based on severity
                    const icon = alert.severity === 'critical' ? '🚨' :
                        alert.severity === 'warning' ? '⚠️' : 'ℹ️';

                    toast({
                        title: `${icon} Alert: ${alert.ruleName}`,
                        description: alert.message,
                        variant: alert.severity === 'critical' ? 'destructive' : 'default',
                    });
                });

                connection.on('EndpointDownNotification', (notification: EndpointDownNotification) => {
                    toast({
                        title: '🔴 Endpoint Down',
                        description: `${notification.endpointUrl} is not responding${notification.error ? ': ' + notification.error : ''}`,
                        variant: 'destructive',
                    });

                    // Add to general notifications
                    const generalNotification: Notification = {
                        id: `endpoint-down-${notification.endpointId}-${Date.now()}`,
                        type: 'error',
                        title: 'Endpoint Down',
                        message: `${notification.endpointUrl} is not responding`,
                        createdAt: notification.detectedAt,
                        isRead: false,
                        actionUrl: `/endpoints/${notification.endpointId}`,
                        actionText: 'View Details',
                        metadata: { endpointId: notification.endpointId }
                    };
                    setNotifications(prev => [generalNotification, ...prev.slice(0, 99)]);
                    setUnreadCount(prev => prev + 1);
                });

                connection.on('EndpointRecoveredNotification', (notification: EndpointRecoveredNotification) => {
                    toast({
                        title: '🟢 Endpoint Recovered',
                        description: `${notification.endpointUrl} is responding again (downtime: ${notification.downtimeDuration})`,
                        variant: 'default',
                    });

                    // Add to general notifications
                    const generalNotification: Notification = {
                        id: `endpoint-recovered-${notification.endpointId}-${Date.now()}`,
                        type: 'success',
                        title: 'Endpoint Recovered',
                        message: `${notification.endpointUrl} is responding again`,
                        createdAt: notification.recoveredAt,
                        isRead: false,
                        actionUrl: `/endpoints/${notification.endpointId}`,
                        actionText: 'View Details',
                        metadata: {
                            endpointId: notification.endpointId,
                            downtimeDuration: notification.downtimeDuration
                        }
                    };
                    setNotifications(prev => [generalNotification, ...prev.slice(0, 99)]);
                    setUnreadCount(prev => prev + 1);
                });

                connection.on('ConnectionStatus', (status: ConnectionStatus) => {
                    console.log('Connection status update:', status);
                    // Could update UI connection indicator
                });

                connection.on('NotificationMarkedAsRead', (data: { notificationId: string; userId: string }) => {
                    setNotifications(prev =>
                        prev.map(n => n.id === data.notificationId ? { ...n, isRead: true } : n)
                    );
                    setUnreadCount(prev => Math.max(0, prev - 1));
                });

                connection.on('UnreadCount', (count: number) => {
                    setUnreadCount(count);
                });

                // Connection state handlers
                const originalOnClose = connection.connection?.onclose;
                if (connection.connection) {
                    connection.connection.onclose = (error) => {
                        setIsConnected(false);
                        setConnectionState('Disconnected');
                        if (originalOnClose) originalOnClose(error);
                    };

                    connection.connection.onreconnecting = (error) => {
                        setIsConnected(false);
                        setConnectionState('Reconnecting');
                        console.log('Reconnecting to notifications hub...', error);
                    };

                    connection.connection.onreconnected = (connectionId) => {
                        setIsConnected(true);
                        setConnectionState('Connected');
                        setError(null);
                        console.log('Reconnected to notifications hub:', connectionId);

                        // Rejoin user group after reconnection
                        const userId = getUserId();
                        if (userId) {
                            connection.invoke('JoinUserGroup', userId).catch(console.error);
                            connection.invoke('GetUnreadCount').catch(console.error);
                        }
                    };
                }

                // Start the connection
                await connection.start();
                setIsConnected(true);
                setConnectionState('Connected');
                setError(null);

                // Join user group and get initial data
                const userId = getUserId();
                if (userId) {
                    await connection.invoke('JoinUserGroup', userId);
                    await connection.invoke('GetUnreadCount');
                }

            } catch (err) {
                console.error('Failed to setup notifications connection:', err);
                setError(err instanceof Error ? err.message : 'Connection failed');
                setIsConnected(false);
                setConnectionState('Disconnected');

                // Retry connection after delay
                reconnectTimeoutRef.current = setTimeout(() => {
                    setupConnection();
                }, 5000);
            }
        };

        setupConnection();
    }, [connection]);

    const markAsRead = useCallback(async (notificationId: string) => {
        if (!connection || !isConnected) return;

        try {
            await connection.invoke('MarkNotificationAsRead', notificationId);
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    }, [connection, isConnected]);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        // In a real app, you'd also send this to the server
        console.log('Marked all notifications as read');
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    const getNotificationsByType = useCallback((type: string) => {
        return notifications.filter(n => n.type === type);
    }, [notifications]);

    const getUnreadNotifications = useCallback(() => {
        return notifications.filter(n => !n.isRead);
    }, [notifications]);

    const getActiveSystemNotifications = useCallback(() => {
        const now = new Date();
        return systemNotifications.filter(n =>
            !n.expiresAt || new Date(n.expiresAt) > now
        );
    }, [systemNotifications]);

    const getActiveAlerts = useCallback(() => {
        return alertNotifications.filter(a => a.status === 'active');
    }, [alertNotifications]);

    return {
        // Connection state
        isConnected,
        connectionState,
        error,

        // Data
        notifications,
        systemNotifications,
        alertNotifications,
        unreadCount,

        // Actions
        markAsRead,
        markAllAsRead,
        clearNotifications,

        // Utilities
        getNotificationsByType,
        getUnreadNotifications,
        getActiveSystemNotifications,
        getActiveAlerts,
        hasUnread: unreadCount > 0,
        totalNotifications: notifications.length,
    };
}

// Helper function to get user ID from token
function getUserId(): string | null {
    try {
        const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        if (!token) return null;

        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.nameid || null;
    } catch {
        return null;
    }
}

// Hook for alert-specific notifications
export function useAlertNotifications() {
    const { alertNotifications, isConnected } = useNotifications();

    const activeAlerts = alertNotifications.filter(a => a.status === 'active');
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
    const warningAlerts = activeAlerts.filter(a => a.severity === 'warning');

    return {
        allAlerts: alertNotifications,
        activeAlerts,
        criticalAlerts,
        warningAlerts,
        criticalCount: criticalAlerts.length,
        warningCount: warningAlerts.length,
        totalActiveCount: activeAlerts.length,
        isConnected,
    };
}