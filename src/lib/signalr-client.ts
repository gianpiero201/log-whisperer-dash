import { AUTH_CONFIG } from '@/utils/constants';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface SignalRConnectionConfig {
    hubUrl: string;
    accessToken?: string;
    automaticReconnect?: boolean;
    reconnectIntervals?: number[];
}

export class SignalRClient {
    public connection: HubConnection | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private isConnecting = false;
    private connectionPromise: Promise<void> | null = null;

    constructor(private config: SignalRConnectionConfig) {
        this.connection = this.buildConnection();
    }

    private buildConnection(): HubConnection {
        const builder = new HubConnectionBuilder()
            .withUrl(`${API_BASE_URL}${this.config.hubUrl}`, {
                accessTokenFactory: () => this.config.accessToken || localStorage.getItem(AUTH_CONFIG.TOKEN_KEY) || ''
            })
            .withAutomaticReconnect(this.config.reconnectIntervals || [0, 2000, 10000, 30000])
            .configureLogging(LogLevel.Information);

        const connection = builder.build();

        // Setup connection event handlers
        connection.onclose((error) => {
            console.warn(`SignalR connection closed: ${this.config.hubUrl}`, error);
            this.handleConnectionClosed(error);
        });

        connection.onreconnecting((error) => {
            console.info(`SignalR reconnecting: ${this.config.hubUrl}`, error);
            this.reconnectAttempts++;
            this.handleReconnecting();
        });

        connection.onreconnected((connectionId) => {
            console.info(`SignalR reconnected: ${this.config.hubUrl}`, connectionId);
            this.reconnectAttempts = 0;
            this.handleReconnected(connectionId);
        });

        return connection;
    }

    public async start(): Promise<void> {
        if (this.isConnecting || this.connection?.state === 'Connected') {
            return this.connectionPromise || Promise.resolve();
        }

        this.isConnecting = true;

        this.connectionPromise = this.connection!.start()
            .then(() => {
                console.info(`SignalR connected: ${this.config.hubUrl}`);
                this.isConnecting = false;
                this.reconnectAttempts = 0;
            })
            .catch((error) => {
                console.error(`SignalR connection failed: ${this.config.hubUrl}`, error);
                this.isConnecting = false;
                throw error;
            });

        return this.connectionPromise;
    }

    public async stop(): Promise<void> {
        if (this.connection) {
            await this.connection.stop();
            console.info(`SignalR stopped: ${this.config.hubUrl}`);
        }
    }

    public on(methodName: string, method: (...args: any[]) => void): void {
        this.connection?.on(methodName, method);
    }

    public off(methodName: string, method?: (...args: any[]) => void): void {
        this.connection?.off(methodName, method);
    }

    public async invoke(methodName: string, ...args: any[]): Promise<any> {
        await this.ensureConnected();
        return this.connection!.invoke(methodName, ...args);
    }

    public async send(methodName: string, ...args: any[]): Promise<void> {
        await this.ensureConnected();
        return this.connection!.send(methodName, ...args);
    }

    private async ensureConnected(): Promise<void> {
        if (this.connection?.state !== 'Connected') {
            await this.start();
        }
    }

    private handleConnectionClosed(error?: Error): void {
        // Custom logic for connection closed
        if (error && this.reconnectAttempts < this.maxReconnectAttempts) {
            console.info(`Attempting to reconnect in 5 seconds...`);
            setTimeout(() => {
                this.start().catch(console.error);
            }, 5000);
        }
    }

    private handleReconnecting(): void {
        // Custom logic for reconnecting
        // Could emit events to UI components
    }

    private handleReconnected(connectionId?: string): void {
        // Custom logic for reconnected
        console.info(`Successfully reconnected with connection ID: ${connectionId}`);
    }

    public get connectionId(): string | null {
        return this.connection?.connectionId || null;
    }

    public get state(): string {
        return this.connection?.state || 'Disconnected';
    }

    public isConnected(): boolean {
        return this.connection?.state === 'Connected';
    }
}

// Factory functions for different hubs
export const createMonitoringConnection = (accessToken?: string): SignalRClient => {
    return new SignalRClient({
        hubUrl: '/hubs/monitoring',
        accessToken,
        automaticReconnect: true,
        reconnectIntervals: [0, 2000, 10000, 30000]
    });
};

export const createLogsConnection = (accessToken?: string): SignalRClient => {
    return new SignalRClient({
        hubUrl: '/hubs/logs',
        accessToken,
        automaticReconnect: true,
        reconnectIntervals: [0, 2000, 10000, 30000]
    });
};

export const createNotificationsConnection = (accessToken?: string): SignalRClient => {
    return new SignalRClient({
        hubUrl: '/hubs/notifications',
        accessToken,
        automaticReconnect: true,
        reconnectIntervals: [0, 2000, 10000, 30000]
    });
};

// Connection status enum
export enum ConnectionState {
    Disconnected = 'Disconnected',
    Connecting = 'Connecting',
    Connected = 'Connected',
    Disconnecting = 'Disconnecting',
    Reconnecting = 'Reconnecting'
}

// Event types
export interface ConnectionStatusEvent {
    hubUrl: string;
    state: ConnectionState;
    error?: Error;
    connectionId?: string;
}

// Global connection manager
class SignalRConnectionManager {
    private connections = new Map<string, SignalRClient>();
    private listeners = new Set<(event: ConnectionStatusEvent) => void>();

    public addConnection(name: string, client: SignalRClient): void {
        this.connections.set(name, client);
    }

    public getConnection(name: string): SignalRClient | undefined {
        return this.connections.get(name);
    }

    public async startAll(): Promise<void> {
        const startPromises = Array.from(this.connections.values()).map(client =>
            client.start().catch(error => console.error('Failed to start connection:', error))
        );
        await Promise.all(startPromises);
    }

    public async stopAll(): Promise<void> {
        const stopPromises = Array.from(this.connections.values()).map(client =>
            client.stop().catch(error => console.error('Failed to stop connection:', error))
        );
        await Promise.all(stopPromises);
    }

    public onStatusChange(listener: (event: ConnectionStatusEvent) => void): void {
        this.listeners.add(listener);
    }

    public offStatusChange(listener: (event: ConnectionStatusEvent) => void): void {
        this.listeners.delete(listener);
    }

    private notifyStatusChange(event: ConnectionStatusEvent): void {
        this.listeners.forEach(listener => listener(event));
    }
}

export const signalRManager = new SignalRConnectionManager();