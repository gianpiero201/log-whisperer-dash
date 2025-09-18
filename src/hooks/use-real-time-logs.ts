import { toast } from '@/hooks/use-toast';
import { SignalRClient, createLogsConnection } from '@/lib/signalr-client';
import { LogLevel } from '@/types/api';
import { AUTH_CONFIG } from '@/utils/constants';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface RealTimeLog {
    id: number;
    timestamp: string;
    level: LogLevel; //'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    service?: string;
    message?: string;
    source?: string;
    endpointId?: string;
    endpointUrl?: string;
    meta: string;
    isNew?: boolean;
}

export interface LogStats {
    totalLogsToday: number;
    errorLogsToday: number;
    warningLogsToday: number;
    infoLogsToday: number;
    debugLogsToday: number;
    logsPerHour: number;
    topServices: string[];
    lastUpdated: string;
}

export interface CriticalAlert {
    id: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    source: string;
    endpointId?: string;
    endpointUrl?: string;
    occurredAt: string;
    type: string;
}

export function useRealTimeLogs() {
    const [connection, setConnection] = useState<SignalRClient | null>(null);
    const [connectionState, setConnectionState] = useState<string>('Disconnected');
    const [logs, setLogs] = useState<RealTimeLog[]>([]);
    const [stats, setStats] = useState<LogStats | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [subscribedLevels, setSubscribedLevels] = useState<Set<string>>(new Set());
    const [subscribedServices, setSubscribedServices] = useState<Set<string>>(new Set());
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const maxLogs = 1000; // Keep only last 1000 logs in memory

    // Initialize connection
    useEffect(() => {
        const accessToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        console.log('Access Token:', accessToken);
        if (!accessToken) {
            setError('No access token found');
            return;
        }

        const newConnection = createLogsConnection(accessToken);
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
                connection.on('NewLog', (log: RealTimeLog) => {
                    setLogs(prev => {
                        const newLogs = [{ ...log, isNew: true }, ...prev];
                        return newLogs.slice(0, maxLogs); // Keep only recent logs
                    });

                    // Show toast for critical logs
                    if (log.level === 'ERROR') {
                        toast({
                            title: `🔴 Error Log`,
                            description: log.message || `Error from ${log.service || 'Unknown'}`,
                            variant: 'destructive',
                        });
                    }
                });

                connection.on('LogBatch', (newLogs: RealTimeLog[]) => {
                    setLogs(prev => {
                        const allLogs = [...newLogs.map(log => ({ ...log, isNew: true })), ...prev];
                        return allLogs.slice(0, maxLogs);
                    });
                });

                connection.on('LogStatsUpdate', (newStats: LogStats) => {
                    setStats(newStats);
                });

                connection.on('CriticalAlert', (alert: CriticalAlert) => {
                    toast({
                        title: `🚨 Critical Alert`,
                        description: alert.message,
                        variant: 'destructive',
                    });

                    // Could also add alert to a separate state for alert management
                    console.log('Critical alert received:', alert);
                });

                connection.on('RecentLogs', (recentLogs: RealTimeLog[]) => {
                    setLogs(recentLogs.map(log => ({ ...log, isNew: false })));
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
                        console.log('Reconnecting to logs hub...', error);
                    };

                    connection.connection.onreconnected = (connectionId) => {
                        setIsConnected(true);
                        setConnectionState('Connected');
                        setError(null);
                        console.log('Reconnected to logs hub:', connectionId);

                        // Rejoin user group and resubscribe to filters
                        const userId = getUserId();
                        if (userId) {
                            connection.invoke('JoinUserGroup', userId).catch(console.error);

                            // Resubscribe to levels and services
                            subscribedLevels.forEach(level => {
                                connection.invoke('SubscribeToLogLevel', level).catch(console.error);
                            });
                            subscribedServices.forEach(service => {
                                connection.invoke('SubscribeToService', service).catch(console.error);
                            });
                        }
                    };
                }

                // Start the connection
                await connection.start();
                setIsConnected(true);
                setConnectionState('Connected');
                setError(null);

                // Join user group
                const userId = getUserId();
                if (userId) {
                    await connection.invoke('JoinUserGroup', userId);
                }

                // Get initial recent logs
                await connection.invoke('GetRecentLogs', 50);

            } catch (err) {
                console.error('Failed to setup logs connection:', err);
                setError(err instanceof Error ? err.message : 'Connection failed');
                setIsConnected(false);
                setConnectionState('Disconnected');

                // Retry connection after delay
                reconnectTimeoutRef.current = setTimeout(() => {
                    setupConnection();
                }, 5000);
            }
        };
        console.log('Setting up logs connection...');
        setupConnection();
    }, [connection, subscribedLevels, subscribedServices]);

    const subscribeToLogLevel = useCallback(async (level: string) => {
        if (!connection || !isConnected) return;

        try {
            await connection.invoke('SubscribeToLogLevel', level);
            setSubscribedLevels(prev => new Set([...prev, level]));
        } catch (err) {
            console.error('Failed to subscribe to log level:', err);
        }
    }, [connection, isConnected]);

    const unsubscribeFromLogLevel = useCallback(async (level: string) => {
        if (!connection || !isConnected) return;

        try {
            await connection.invoke('UnsubscribeFromLogLevel', level);
            setSubscribedLevels(prev => {
                const newSet = new Set(prev);
                newSet.delete(level);
                return newSet;
            });
        } catch (err) {
            console.error('Failed to unsubscribe from log level:', err);
        }
    }, [connection, isConnected]);

    const subscribeToService = useCallback(async (service: string) => {
        if (!connection || !isConnected) return;

        try {
            await connection.invoke('SubscribeToService', service);
            setSubscribedServices(prev => new Set([...prev, service]));
        } catch (err) {
            console.error('Failed to subscribe to service:', err);
        }
    }, [connection, isConnected]);

    const getRecentLogs = useCallback(async (count: number = 50) => {
        if (!connection || !isConnected) return;

        try {
            await connection.invoke('GetRecentLogs', count);
        } catch (err) {
            console.error('Failed to get recent logs:', err);
        }
    }, [connection, isConnected]);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    const markLogsAsRead = useCallback(() => {
        setLogs(prev => prev.map(log => ({ ...log, isNew: false })));
    }, []);

    // Filter logs by level
    const filterLogsByLevel = useCallback((level: string) => {
        return logs.filter(log => log.level === level);
    }, [logs]);

    // Filter logs by service
    const filterLogsByService = useCallback((service: string) => {
        return logs.filter(log => log.service === service);
    }, [logs]);

    // Get logs count by level
    const getLogCountsByLevel = useCallback(() => {
        return logs.reduce((acc, log) => {
            acc[log.level] = (acc[log.level] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [logs]);

    return {
        // Connection state
        isConnected,
        connectionState,
        error,

        // Data
        logs,
        stats,
        subscribedLevels: Array.from(subscribedLevels),
        subscribedServices: Array.from(subscribedServices),

        // Actions
        subscribeToLogLevel,
        unsubscribeFromLogLevel,
        subscribeToService,
        getRecentLogs,
        clearLogs,
        markLogsAsRead,

        // Utilities
        filterLogsByLevel,
        filterLogsByService,
        getLogCountsByLevel,
        newLogsCount: logs.filter(log => log.isNew).length,
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

// Hook for service-specific logs
export function useServiceLogs(serviceName: string) {
    const { logs, subscribeToService, isConnected } = useRealTimeLogs();

    const serviceLogs = logs.filter(log => log.service === serviceName);

    useEffect(() => {
        if (isConnected && serviceName) {
            subscribeToService(serviceName);
        }
    }, [isConnected, serviceName, subscribeToService]);

    return {
        logs: serviceLogs,
        count: serviceLogs.length,
        errorCount: serviceLogs.filter(log => log.level === 'ERROR').length,
        warningCount: serviceLogs.filter(log => log.level === 'WARN').length,
    };
}

// Hook for level-specific logs
export function useLevelLogs(level: string) {
    const { logs, subscribeToLogLevel, isConnected } = useRealTimeLogs();

    const levelLogs = logs.filter(log => log.level === level);

    useEffect(() => {
        if (isConnected && level) {
            subscribeToLogLevel(level);
        }
    }, [isConnected, level, subscribeToLogLevel]);

    return {
        logs: levelLogs,
        count: levelLogs.length,
        recentCount: levelLogs.filter(log => {
            const logTime = new Date(log.timestamp);
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            return logTime > oneHourAgo;
        }).length,
    };
}