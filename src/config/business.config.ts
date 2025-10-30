export const BUSINESS_CONFIG = {
  pricing: {
    averageVisitCost: 85,
    currency: 'CAD',
  },
  appointments: {
    defaultDuration: 30,
    minDuration: 15,
    maxDuration: 120,
    bufferTime: 5,
  },
  clinic: {
    openingHour: 8,
    closingHour: 18,
    daysOfWeek: [1, 2, 3, 4, 5],
  },
  waitlist: {
    maxInvitationAttempts: 5,
    invitationExpiry: 60,
    priorityOrder: 'fifo' as const,
  },
  billing: {
    taxRate: 0,
    paymentTermsDays: 30,
    lateFeeDays: 14,
  },
} as const;

export type BusinessConfig = typeof BUSINESS_CONFIG;
