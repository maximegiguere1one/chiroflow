export const UI_CONFIG = {
  pagination: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },
  tables: {
    maxVisibleRows: 50,
    compactRowHeight: 48,
    normalRowHeight: 64,
  },
  forms: {
    maxFileSize: 10485760,
    allowedFileTypes: ['pdf', 'jpg', 'png', 'doc', 'docx'],
    maxTextLength: 5000,
  },
  dashboard: {
    statsRefreshInterval: 30000,
    chartAnimationDuration: 500,
    maxRecentActivities: 10,
  },
  notifications: {
    maxVisible: 5,
    defaultDuration: 5000,
    position: 'top-right' as const,
  },
} as const;

export type UIConfig = typeof UI_CONFIG;
