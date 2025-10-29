export type AnalyticsEvent =
  | 'cta_click'
  | 'waitlist_submit'
  | 'reconnexion_click'
  | 'appointment_submit'
  | 'contact_submit'
  | 'modal_open'
  | 'modal_close';

export interface AnalyticsData {
  event: AnalyticsEvent;
  label?: string;
  value?: string | number;
  timestamp?: number;
}

declare global {
  interface Window {
    dataLayer?: Array<unknown>;
  }
}

export function trackEvent(event: AnalyticsEvent, label?: string, value?: string | number): void {
  const data: AnalyticsData = {
    event,
    label,
    value,
    timestamp: Date.now(),
  };

  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(data);
  }

  if (import.meta.env.DEV) {
    console.log('[Analytics]', data);
  }
}

export function getAnalyticsAttributes(event: AnalyticsEvent, label?: string) {
  return {
    'data-analytics-event': event,
    'data-analytics-label': label || '',
  };
}
