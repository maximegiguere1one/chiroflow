export const APP_CONFIG = {
  performance: {
    slowOperationThreshold: 3000,
    cacheMaxSize: 100,
    cacheTTL: 300000,
    dataRefreshInterval: 30000,
    debounceDelay: 300,
    throttleLimit: 1000,
  },
  ui: {
    toastDuration: 5000,
    modalAnimationDuration: 300,
    maxRecentErrors: 10,
    paginationPageSize: 20,
    maxSearchResults: 50,
  },
  errorLogging: {
    maxLogs: 100,
    criticalErrorThreshold: 'critical' as const,
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
