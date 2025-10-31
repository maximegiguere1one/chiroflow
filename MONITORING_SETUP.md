# 📊 Monitoring & Error Tracking Setup - ChiroFlow
## Production Monitoring Guide

---

## 🎯 Purpose

This document outlines the monitoring strategy to ensure ChiroFlow runs smoothly in production. Implement these checks to catch issues early and maintain system health.

---

## 🔍 Key Metrics to Monitor

### 1. Application Health

#### Error Rate
```javascript
// Track in browser console or error tracking service
window.addEventListener('error', (event) => {
  console.error('Runtime Error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    timestamp: new Date().toISOString()
  });

  // Send to your error tracking service
  // Example: Sentry, LogRocket, etc.
});
```

#### API Response Times
Monitor these Supabase queries:
- `appointments_api` reads (Target: <500ms)
- `contacts` reads (Target: <300ms)
- Appointment inserts (Target: <1s)
- Patient updates (Target: <800ms)

#### Success Rates
Track success/failure for:
- Appointment creation: Target >95%
- Patient creation: Target >98%
- Email sends: Target >95%
- Payment processing: Target >99%

---

### 2. Database Monitoring

#### Query Performance
```sql
-- Check slow queries in Supabase Dashboard
-- Look for queries taking >1 second
```

#### Connection Pool
- Monitor active connections
- Alert if >80% of pool used
- Check for connection leaks

#### Row Level Security (RLS)
- Verify policies are working
- Check for unauthorized access attempts
- Monitor policy performance impact

---

### 3. User Experience Metrics

#### Page Load Times
- Initial page load: Target <3s
- Dashboard load: Target <2s
- Patient list load: Target <1.5s
- Calendar view: Target <2s

#### User Actions
Monitor frequency of:
- Appointments created per day
- Patients added per day
- Failed login attempts
- Search queries

#### Error Messages Shown to Users
Track all toast.error() calls:
- "Erreur lors du chargement des patients"
- "Erreur lors de la création"
- "Utilisateur non authentifié"
- etc.

---

## 🚨 Critical Alerts to Set Up

### Immediate (P0) Alerts

1. **Authentication Failure Spike**
   - Trigger: >10 failed logins in 5 minutes
   - Action: Check Supabase auth status

2. **Database Connection Error**
   - Trigger: Any database unreachable error
   - Action: Check Supabase status page

3. **Appointment Creation Failure >50%**
   - Trigger: >50% of appointment creates failing
   - Action: Check scheduled_at format and database

4. **Edge Function Failures**
   - Trigger: Any edge function returning 500
   - Action: Check function logs in Supabase

### High Priority (P1) Alerts

5. **Email Delivery Failure >10%**
   - Trigger: >10% of emails failing
   - Action: Check Resend/email service status

6. **Slow Query Performance**
   - Trigger: Any query >3 seconds
   - Action: Check database indexes

7. **Memory Usage High**
   - Trigger: Browser memory >500MB
   - Action: Check for memory leaks

### Medium Priority (P2) Alerts

8. **High Error Rate**
   - Trigger: >5% of requests erroring
   - Action: Review error logs

9. **Unusual User Patterns**
   - Trigger: Zero activity for >2 hours during business hours
   - Action: Check if app is accessible

---

## 📝 Logging Strategy

### What to Log

#### Success Events
```javascript
// Appointment created
{
  level: 'INFO',
  event: 'APPOINTMENT_CREATED',
  data: {
    appointmentId: 'xxx',
    patientId: 'xxx',
    scheduledAt: '2025-10-31T09:00:00',
    duration: 30
  },
  timestamp: '2025-10-31T08:45:00Z'
}
```

#### Error Events
```javascript
// Database error
{
  level: 'ERROR',
  event: 'DATABASE_ERROR',
  error: {
    message: 'Failed to insert appointment',
    code: 'PGRST116',
    details: '...'
  },
  context: {
    userId: 'xxx',
    action: 'CREATE_APPOINTMENT'
  },
  timestamp: '2025-10-31T08:45:00Z'
}
```

#### Performance Events
```javascript
// Slow query detected
{
  level: 'WARN',
  event: 'SLOW_QUERY',
  data: {
    table: 'appointments_api',
    duration: 2500,
    threshold: 1000
  },
  timestamp: '2025-10-31T08:45:00Z'
}
```

### Where to Log

**Browser Console (Development)**
- All errors
- All warnings
- Success messages (debug mode)

**Error Tracking Service (Production)**
Recommended services:
1. **Sentry** (Free tier: 5k events/month)
   ```javascript
   import * as Sentry from "@sentry/react";

   Sentry.init({
     dsn: "YOUR_DSN",
     environment: "production",
     tracesSampleRate: 0.1
   });
   ```

2. **LogRocket** (Session replay)
3. **Datadog** (Full observability)

**Supabase Logs**
- All database errors
- Edge function execution logs
- Authentication events

---

## 🔧 Monitoring Implementation

### Step 1: Browser Error Tracking

Create `src/lib/errorTracking.ts`:

```typescript
export class ErrorTracker {
  private static instance: ErrorTracker;

  private constructor() {
    this.setupGlobalErrorHandler();
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  private setupGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'RUNTIME_ERROR',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'UNHANDLED_PROMISE',
        message: event.reason?.message || 'Unknown error',
        reason: event.reason
      });
    });
  }

  logError(error: any) {
    console.error('[ErrorTracker]', error);

    // Send to Supabase
    supabase.from('error_logs').insert({
      error_type: error.type,
      message: error.message,
      stack: error.stack,
      user_agent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }).then(({ error: dbError }) => {
      if (dbError) console.error('Failed to log error:', dbError);
    });
  }

  logPerformance(metric: string, duration: number) {
    if (duration > 1000) {
      console.warn(`[Performance] ${metric} took ${duration}ms`);

      supabase.from('performance_logs').insert({
        metric_name: metric,
        duration_ms: duration,
        timestamp: new Date().toISOString()
      });
    }
  }
}
```

### Step 2: Initialize in App

In `src/main.tsx`:

```typescript
import { ErrorTracker } from './lib/errorTracking';

// Initialize error tracking
ErrorTracker.getInstance();

// Rest of your app initialization
```

### Step 3: Add Performance Tracking

Wrap slow operations:

```typescript
async function loadPatients() {
  const startTime = performance.now();

  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*');

    const duration = performance.now() - startTime;
    ErrorTracker.getInstance().logPerformance('LOAD_PATIENTS', duration);

    if (error) throw error;
    return data;
  } catch (error) {
    ErrorTracker.getInstance().logError({
      type: 'DATA_LOAD_ERROR',
      message: 'Failed to load patients',
      error
    });
    throw error;
  }
}
```

---

## 📊 Dashboard Metrics

### Daily Metrics to Review

#### System Health
- [ ] Total errors (Target: <10/day)
- [ ] Authentication failures (Target: <5/day)
- [ ] Database errors (Target: 0/day)
- [ ] Email failures (Target: <2/day)

#### Usage Metrics
- [ ] New appointments created
- [ ] New patients added
- [ ] Active users
- [ ] Peak usage times

#### Performance Metrics
- [ ] Average page load time
- [ ] Slowest queries
- [ ] Memory usage trend
- [ ] Bundle size changes

### Weekly Metrics to Review

#### Trends
- [ ] Error rate trend (increasing/decreasing)
- [ ] User growth trend
- [ ] Feature usage patterns
- [ ] Performance degradation

#### Quality
- [ ] User-reported issues
- [ ] Support tickets
- [ ] Critical bugs
- [ ] Technical debt

---

## 🚀 Post-Launch Monitoring Checklist

### Day 1 (Launch Day)
- [ ] Check every hour for errors
- [ ] Monitor Supabase dashboard
- [ ] Watch error tracking service
- [ ] Test critical user flows manually
- [ ] Be available for urgent fixes

### Week 1
- [ ] Daily error review (morning & evening)
- [ ] Monitor user feedback channels
- [ ] Check performance metrics
- [ ] Verify email deliverability
- [ ] Review database performance

### Week 2-4
- [ ] Every 2-3 days review errors
- [ ] Weekly performance review
- [ ] Analyze usage patterns
- [ ] Optimize slow queries
- [ ] Plan improvements

### Month 2+
- [ ] Weekly metrics review
- [ ] Monthly performance audit
- [ ] Quarterly feature analysis
- [ ] Continuous optimization

---

## 📞 Incident Response Plan

### When an Alert Fires

#### 1. Assess Severity
- **P0 (Critical):** Drop everything, fix immediately
- **P1 (High):** Fix within 4 hours
- **P2 (Medium):** Fix within 1 day
- **P3 (Low):** Fix in next sprint

#### 2. Investigate
- Check error logs
- Review recent deployments
- Check Supabase status
- Test user flows manually

#### 3. Fix
- Identify root cause
- Apply fix
- Test thoroughly
- Deploy to production

#### 4. Verify
- Confirm alert clears
- Monitor for 30 minutes
- Check related metrics
- Notify stakeholders

#### 5. Document
- Update incident log
- Document root cause
- Add prevention measures
- Share learnings with team

---

## 🔗 Useful Resources

### Supabase Monitoring
- Dashboard: https://app.supabase.com/project/YOUR_PROJECT/database
- Logs: https://app.supabase.com/project/YOUR_PROJECT/logs
- API Usage: https://app.supabase.com/project/YOUR_PROJECT/settings/api

### Third-Party Services (Optional)
- **Sentry:** https://sentry.io (Error tracking)
- **LogRocket:** https://logrocket.com (Session replay)
- **Uptime Robot:** https://uptimerobot.com (Uptime monitoring)
- **Datadog:** https://www.datadoghq.com (Full observability)

---

## ✅ Monitoring Checklist

Before considering monitoring "complete":

- [ ] Error tracking implemented
- [ ] Performance logging added
- [ ] Critical alerts configured
- [ ] Dashboard access set up
- [ ] Incident response plan reviewed
- [ ] Team trained on monitoring
- [ ] Escalation paths defined
- [ ] Documentation complete

---

**Document Created:** 2025-10-31
**Status:** READY FOR IMPLEMENTATION
**Next Review:** Post-launch Week 1
