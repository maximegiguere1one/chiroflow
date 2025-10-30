export const TIMING_CONFIG = {
  appointments: {
    defaultDuration: 30,
    reminderLeadTime: 24,
    confirmationTimeout: 15,
    autoRefreshInterval: 30000,
  },
  email: {
    invitationExpiry: 60,
    reminderSchedule: [24, 2],
    retryDelay: 5000,
    maxRetries: 3,
  },
  ui: {
    loadingDebounce: 300,
    searchDebounce: 500,
    autoSaveDelay: 2000,
  },
} as const;

export type TimingConfig = typeof TIMING_CONFIG;
