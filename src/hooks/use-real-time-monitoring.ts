import { toast } from '@/hooks/use-toast';
import { SignalRClient, createMonitoringConnection } from '@/lib/signalr-client';
import { AUTH_CONFIG } from '@/utils/constants';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface EndpointStatus {
    id: string;
    url: string;
    status: 'up' | 'down' | 'unknown';
    statusCode?: number;
    responseTimeMs?: number;
    error?: string;
    checkedAt: string;
    enabled: boolean;
}

export interface DashboardMetrics {
    totalEndpoints: number;
    activeEndpoints: number;
    endpointsUp: number;
    endpointsDown: number;
    logsToday: number;
    errorLogsToday: number;
    activeAlerts: number;
    lastUpdated: string;
    averageResponseTime: number;
    uptimePercentage: number;
}

export interface HealthCheckResult {
    endpointId: string;
    url: string;
    success: boolean;
    statusCode?: number;
    responseTimeMs?: number;
    error?: string;
    checkedAt: string;
    status: string;
}

export function useRealTimeMonitoring() {
    const [connection, setConnection] = useState<SignalRClient | null>(null);
    const [connectionState, setConnectionState] = useState<string>('Disconnected');
    const [endpoints, setEndpoints] = useState<EndpointStatus[]>([]);
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

    // Initialize connection
    useEffect(() => {
        const accessToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        if (!accessToken) {
            setError('No access token found');
            return;
        }

        const newConnection = createMonitoringConnection(accessToken);
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
                connection.on('EndpointStatusUpdate', (update: EndpointStatus) => {
                    setEndpoints(prev => {
                        const index = prev.findIndex(e => e.id === update.id);
                        if (index >= 0) {
                            const newEndpoints = [...prev];
                            newEndpoints[index] = update;
                            return newEndpoints;
                        } else {
                            return [...prev, update];
                        }
                    });

                    // Show toast for status changes
                    if (update.status === 'down') {
                        toast({
                            title: `🔴 Endpoint Down`,
                            description: `${update.url} is not responding`,
                            variant: 'destructive',
                        });
                    } else if (update.status === 'up') {
                        toast({
                            title: `🟢 Endpoint Up`,
                            description: `${update.url} is responding (${update.responseTimeMs}ms)`,
                            variant: 'default',
                        });
                    }
                });

                connection.on('MetricsUpdate', (newMetrics: DashboardMetrics) => {
                    setMetrics(newMetrics);
                });

                connection.on('HealthCheckResult', (result: HealthCheckResult) => {
                    console.log('Health check result:', result);
                    // Could update specific endpoint or show notification
                });

                connection.on('CheckRequested', (data: { endpointId: string; timestamp: string }) => {
                    toast({
                        title: '🔄 Check Requested',
                        description: 'Endpoint check has been queued',
                        variant: 'default',
                    });
                });

                connection.on('Error', (errorMessage: string) => {
                    setError(errorMessage);
                    toast({
                        title: '❌ Error',
                        description: errorMessage,
                        variant: 'destructive',
                    });
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
                        console.log('Reconnecting to monitoring hub...', error);
                    };

                    connection.connection.onreconnected = (connectionId) => {
                        setIsConnected(true);
                        setConnectionState('Connected');
                        setError(null);
                        console.log('Reconnected to monitoring hub:', connectionId);

                        // Rejoin user group after reconnection
                        const userId = getUserId();
                        if (userId) {
                            connection.invoke('JoinUserGroup', userId).catch(console.error);
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

            } catch (err) {
                console.error('Failed to setup monitoring connection:', err);
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

    const requestEndpointCheck = useCallback(async (endpointId: string) => {
        if (!connection || !isConnected) {
            toast({
                title: '❌ Not Connected',
                description: 'Cannot request check - not connected to server',
                variant: 'destructive',
            });
            return;
        }

        try {
            await connection.invoke('RequestEndpointCheck', endpointId);
        } catch (err) {
            console.error('Failed to request endpoint check:', err);
            toast({
                title: '❌ Request Failed',
                description: 'Failed to request endpoint check',
                variant: 'destructive',
            });
        }
    }, [connection, isConnected]);

    const refreshMetrics = useCallback(async () => {
        // This would typically make an HTTP request to get latest metrics
        // For now, we rely on real-time updates
        console.log('Metrics refresh requested');
    }, []);

    return {
        // Connection state
        isConnected,
        connectionState,
        error,

        // Data
        endpoints,
        metrics,

        // Actions
        requestEndpointCheck,
        refreshMetrics,
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

// Hook for endpoint-specific monitoring
export function useEndpointMonitoring(endpointId: string) {
    const { endpoints, requestEndpointCheck } = useRealTimeMonitoring();

    const endpoint = endpoints.find(e => e.id === endpointId);

    const checkEndpoint = useCallback(() => {
        requestEndpointCheck(endpointId);
    }, [endpointId, requestEndpointCheck]);

    return {
        endpoint,
        checkEndpoint,
        isUp: endpoint?.status === 'up',
        isDown: endpoint?.status === 'down',
        responseTime: endpoint?.responseTimeMs,
        lastChecked: endpoint?.checkedAt,
    };
}