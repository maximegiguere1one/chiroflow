import { useEffect, useCallback } from 'react';
import { logger } from '../infrastructure/monitoring/Logger';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeSession();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSession(): void {
    this.track('session_start', {
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      screenResolution: typeof window !== 'undefined'
        ? `${window.screen.width}x${window.screen.height}`
        : undefined,
    });
  }

  setUserId(userId: string): void {
    this.userId = userId;
    logger.info('Analytics user ID set', { userId });
  }

  track(eventName: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userId: this.userId,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
      timestamp: Date.now(),
    };

    this.events.push(event);

    logger.info('Analytics event tracked', {
      event: eventName,
      properties: event.properties,
    });

    if (this.events.length > 1000) {
      this.events = this.events.slice(-500);
    }
  }

  trackPageView(pageName: string, properties?: Record<string, any>): void {
    this.track('page_view', {
      page: pageName,
      ...properties,
    });
  }

  trackClick(elementName: string, properties?: Record<string, any>): void {
    this.track('click', {
      element: elementName,
      ...properties,
    });
  }

  trackFormSubmit(formName: string, properties?: Record<string, any>): void {
    this.track('form_submit', {
      form: formName,
      ...properties,
    });
  }

  trackSearch(query: string, results?: number): void {
    this.track('search', {
      query,
      results,
    });
  }

  getEvents(filter?: {
    name?: string;
    since?: number;
  }): AnalyticsEvent[] {
    let filtered = [...this.events];

    if (filter?.name) {
      filtered = filtered.filter((e) => e.name === filter.name);
    }

    if (filter?.since) {
      filtered = filtered.filter((e) => e.timestamp >= filter.since);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  getEventStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const event of this.events) {
      stats[event.name] = (stats[event.name] || 0) + 1;
    }

    return stats;
  }

  clearEvents(): void {
    this.events = [];
    logger.info('Analytics events cleared');
  }
}

const analyticsService = new AnalyticsService();

export function useAnalytics() {
  const track = useCallback((eventName: string, properties?: Record<string, any>) => {
    analyticsService.track(eventName, properties);
  }, []);

  const trackPageView = useCallback((pageName: string, properties?: Record<string, any>) => {
    analyticsService.trackPageView(pageName, properties);
  }, []);

  const trackClick = useCallback((elementName: string, properties?: Record<string, any>) => {
    analyticsService.trackClick(elementName, properties);
  }, []);

  const trackFormSubmit = useCallback((formName: string, properties?: Record<string, any>) => {
    analyticsService.trackFormSubmit(formName, properties);
  }, []);

  const trackSearch = useCallback((query: string, results?: number) => {
    analyticsService.trackSearch(query, results);
  }, []);

  const setUserId = useCallback((userId: string) => {
    analyticsService.setUserId(userId);
  }, []);

  return {
    track,
    trackPageView,
    trackClick,
    trackFormSubmit,
    trackSearch,
    setUserId,
  };
}

export function usePageTracking(pageName: string) {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView(pageName);
  }, [pageName, trackPageView]);
}

export { analyticsService };
