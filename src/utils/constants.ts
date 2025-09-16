// Configurações e constantes da aplicação

export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
};

export const AUTH_CONFIG = {
    TOKEN_KEY: 'logwhisperer_token',
    REFRESH_TOKEN_KEY: 'logwhisperer_refresh_token',
    USER_KEY: 'logwhisperer_user',
    TOKEN_EXPIRE_BUFFER: 5 * 60 * 1000, // 5 minutes in milliseconds
};

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 1000,
    DEFAULT_PAGE: 1,
};

export const LOG_LEVELS = {
    DEBUG: { value: 'DEBUG', label: 'Debug', color: 'text-gray-600' },
    INFO: { value: 'INFO', label: 'Info', color: 'text-blue-600' },
    WARN: { value: 'WARN', label: 'Warning', color: 'text-yellow-600' },
    ERROR: { value: 'ERROR', label: 'Error', color: 'text-red-600' },
} as const;

export const ENDPOINT_STATUS = {
    up: { label: 'Up', color: 'text-green-600', bgColor: 'bg-green-100' },
    down: { label: 'Down', color: 'text-red-600', bgColor: 'bg-red-100' },
    unknown: { label: 'Unknown', color: 'text-gray-600', bgColor: 'bg-gray-100' },
} as const;

export const ALERT_SEVERITY = {
    info: { label: 'Info', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    warning: { label: 'Warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    critical: { label: 'Critical', color: 'text-red-600', bgColor: 'bg-red-100' },
} as const;

export const ALERT_STATUS = {
    active: { label: 'Active', color: 'text-red-600', bgColor: 'bg-red-100' },
    resolved: { label: 'Resolved', color: 'text-green-600', bgColor: 'bg-green-100' },
} as const;

export const HTTP_METHODS = [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
    'HEAD',
    'OPTIONS',
] as const;

export const THEMES = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
] as const;

export const REFRESH_INTERVALS = [
    { value: 5, label: '5 seconds' },
    { value: 10, label: '10 seconds' },
    { value: 30, label: '30 seconds' },
    { value: 60, label: '1 minute' },
    { value: 300, label: '5 minutes' },
] as const;

export const DATE_FORMATS = {
    DATETIME: 'yyyy-MM-dd HH:mm:ss',
    DATE: 'yyyy-MM-dd',
    TIME: 'HH:mm:ss',
    RELATIVE: 'relative',
} as const;

export const QUERY_KEYS = {
    // Auth
    AUTH_ME: ['auth', 'me'],

    // Logs
    LOGS: ['logs'],
    LOGS_LIST: (params: any) => ['logs', 'list', params],
    LOGS_DETAIL: (id: number) => ['logs', 'detail', id],

    // Endpoints
    ENDPOINTS: ['endpoints'],
    ENDPOINTS_LIST: ['endpoints', 'list'],
    ENDPOINTS_DETAIL: (id: string) => ['endpoints', 'detail', id],

    // Alerts
    ALERT_RULES: ['alerts', 'rules'],
    ALERT_EVENTS: ['alerts', 'events'],
    ALERT_RULE_DETAIL: (id: string) => ['alerts', 'rules', id],

    // Dashboard
    DASHBOARD_METRICS: ['dashboard', 'metrics'],
    DASHBOARD_LOGS_BY_LEVEL: ['dashboard', 'logs-by-level'],
    DASHBOARD_LOGS_BY_SERVICE: ['dashboard', 'logs-by-service'],
    DASHBOARD_LOGS_BY_HOUR: ['dashboard', 'logs-by-hour'],

    // User Settings
    USER_SETTINGS: ['user', 'settings'],
} as const;

export const TOAST_MESSAGES = {
    // Success messages
    LOGIN_SUCCESS: 'Successfully logged in',
    REGISTER_SUCCESS: 'Account created successfully',
    LOGOUT_SUCCESS: 'Successfully logged out',
    SAVE_SUCCESS: 'Changes saved successfully',
    DELETE_SUCCESS: 'Deleted successfully',
    CREATE_SUCCESS: 'Created successfully',
    UPDATE_SUCCESS: 'Updated successfully',

    // Error messages
    LOGIN_ERROR: 'Login failed. Please check your credentials.',
    REGISTER_ERROR: 'Registration failed. Please try again.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    PERMISSION_ERROR: 'You do not have permission to perform this action.',
    VALIDATION_ERROR: 'Please check the form for errors.',
    GENERIC_ERROR: 'Something went wrong. Please try again.',

    // Loading messages
    LOADING: 'Loading...',
    SAVING: 'Saving...',
    DELETING: 'Deleting...',
} as const;

export const ROUTES = {
    HOME: '/',
    LOGIN: '/auth',
    REGISTER: '/auth',
    DASHBOARD: '/',
    LOGS: '/logs',
    ENDPOINTS: '/endpoints',
    ALERTS: '/alerts',
    SETTINGS: '/settings',
    PROFILE: '/profile',
} as const;

export const LOCAL_STORAGE_KEYS = {
    THEME: 'logwhisperer_theme',
    SIDEBAR_COLLAPSED: 'logwhisperer_sidebar_collapsed',
    TABLE_PREFERENCES: 'logwhisperer_table_preferences',
    DASHBOARD_PREFERENCES: 'logwhisperer_dashboard_preferences',
} as const;

export const VALIDATION = {
    PASSWORD_MIN_LENGTH: 6,
    DISPLAY_NAME_MIN_LENGTH: 2,
    DISPLAY_NAME_MAX_LENGTH: 50,
    URL_PATTERN: /^https?:\/\/.+/,
    EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    INTERVAL_MIN: 5,
    INTERVAL_MAX: 86400, // 24 hours
} as const;

export const DEFAULT_VALUES = {
    LOG_LEVEL: 'INFO',
    ENDPOINT_METHOD: 'GET',
    ENDPOINT_INTERVAL: 60,
    ALERT_SEVERITY: 'warning',
    ALERT_THROTTLE: 300,
    THEME: 'system',
    TIMEZONE: 'UTC',
    REFRESH_INTERVAL: 30,
    LOG_RETENTION_DAYS: 30,
    MAX_LOG_SIZE_MB: 100,
} as const;