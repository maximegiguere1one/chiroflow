# 🐛 Bug Fix Checklist - ChiroFlow
## Prioritized Action Items

---

## 🔥 CRITICAL - FIX IMMEDIATELY (Blocking Launch)

### ❌ BUG-001: Appointment Schema Mismatch
**Priority:** P0 - CRITICAL
**Status:** 🔴 NOT FIXED
**Estimated Time:** 6-8 hours
**Assigned To:** _____________

**Problem:**
```typescript
// ❌ Code expects (WRONG):
appointment.scheduled_date  // Type: DATE
appointment.scheduled_time  // Type: TIME

// ✅ Database has (CORRECT):
appointment.scheduled_at    // Type: TIMESTAMPTZ
```

**Affected Files:** (10+ files)
- [ ] `src/components/dashboard/AppointmentSchedulingModal.tsx` (7 instances)
- [ ] `src/components/dashboard/AppointmentsPage.tsx` (6 instances)
- [ ] `src/components/dashboard/AppointmentsPageEnhanced.tsx` (12 instances)
- [ ] `src/components/dashboard/AppointmentManager.tsx`
- [ ] `src/components/dashboard/Calendar.tsx`
- [ ] `src/components/dashboard/EnhancedCalendar.tsx`
- [ ] `src/pages/AppointmentManagement.tsx`
- [ ] Check all other files that reference appointments

**Fix Strategy:**
1. Create utility functions to handle scheduled_at:
   ```typescript
   // src/lib/dateUtils.ts
   export function getDateFromScheduledAt(scheduled_at: string): string {
     return scheduled_at.split('T')[0];
   }

   export function getTimeFromScheduledAt(scheduled_at: string): string {
     return new Date(scheduled_at).toLocaleTimeString('en-US', {
       hour: '2-digit',
       minute: '2-digit',
       hour12: false
     });
   }

   export function createScheduledAt(date: string, time: string): string {
     return `${date}T${time}:00`;
   }
   ```

2. Refactor each component:
   ```typescript
   // Before:
   const date = appointment.scheduled_date;
   const time = appointment.scheduled_time;

   // After:
   const date = getDateFromScheduledAt(appointment.scheduled_at);
   const time = getTimeFromScheduledAt(appointment.scheduled_at);
   ```

3. Update form submissions:
   ```typescript
   // Before:
   scheduled_date: formData.date,
   scheduled_time: formData.time,

   // After:
   scheduled_at: createScheduledAt(formData.date, formData.time),
   ```

**Testing Checklist:**
- [ ] Create new appointment
- [ ] Edit existing appointment
- [ ] View appointment in calendar
- [ ] View appointment in list
- [ ] Filter appointments by date
- [ ] Verify date displays correctly
- [ ] Verify time displays correctly
- [ ] Check all views (calendar, list, cards)

**Definition of Done:**
- [ ] All TypeScript errors related to scheduled_date/scheduled_time resolved
- [ ] All components use scheduled_at
- [ ] Appointments save correctly to database
- [ ] Appointments display correctly in UI
- [ ] Manual testing passes
- [ ] No console errors

---

## 🔴 HIGH PRIORITY - FIX BEFORE LAUNCH

### ⚠️ BUG-002: Critical TypeScript Type Safety Issues
**Priority:** P1 - HIGH
**Status:** 🟡 PARTIAL
**Estimated Time:** 4-6 hours (critical ones only)
**Assigned To:** _____________

**Critical Type Errors to Fix:**

#### 2a. Property 'reminderSent' does not exist
**File:** `src/infrastructure/repositories/SupabaseAppointmentRepository.ts:197`
```typescript
// Fix: Add reminderSent to type or remove usage
```

#### 2b. Possibly 'undefined' errors
**Files:**
- `src/hooks/useAnalytics.ts:102`
- `src/infrastructure/monitoring/ErrorTracker.ts:101`

```typescript
// Fix: Add null checks
if (filter.since) {
  // use filter.since
}
```

#### 2c. Generic type instantiation issues
**File:** `src/hooks/useCachedQuery.ts`
```typescript
// Fix: Proper type constraints or type assertions
```

**Testing:**
- [ ] TypeScript compilation passes
- [ ] No runtime errors in affected areas
- [ ] All functions work as expected

---

### ⚠️ BUG-003: Large Bundle Size Warning
**Priority:** P1 - HIGH
**Status:** 🟡 IDENTIFIED
**Estimated Time:** 2-3 hours
**Assigned To:** _____________

**Problem:**
Main chunk is 671 KB (>500 KB warning threshold)

**Fix Strategy:**
1. Implement dynamic imports for large components:
```typescript
// Before:
import { MegaPatientFile } from './components/dashboard/MegaPatientFile';

// After:
const MegaPatientFile = lazy(() => import('./components/dashboard/MegaPatientFile'));
```

2. Add route-based code splitting:
```typescript
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PatientPortal = lazy(() => import('./pages/PatientPortal'));
```

3. Configure manual chunks in vite.config.ts:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'ui-vendor': ['framer-motion', 'lucide-react'],
        'supabase': ['@supabase/supabase-js'],
      }
    }
  }
}
```

**Testing:**
- [ ] Build succeeds
- [ ] Main chunk < 500 KB
- [ ] Page loads correctly
- [ ] Lazy loading works
- [ ] No broken imports

---

## 🟡 MEDIUM PRIORITY - FIX WEEK 1

### ⚠️ BUG-004: Unused Variables and Functions
**Priority:** P2 - MEDIUM
**Status:** 🟡 IDENTIFIED
**Estimated Time:** 2 hours
**Assigned To:** _____________

**Files to Clean:**
- [ ] `src/components/common/GlobalSearch.tsx` - Remove `handleQuickAction`
- [ ] `src/components/dashboard/AppointmentsPageEnhanced.tsx` - Remove `handleDateSelect`, `handleAddAppointment`
- [ ] `src/pages/AdminDashboard.tsx` - Remove `stats`, `_DashboardView`, unused shortcuts
- [ ] `src/pages/AdminSignup.tsx` - Remove unused `supabase` import
- [ ] `src/pages/DiagnosticPage.tsx` - Remove unused `data`
- [ ] Other files with TS6133 errors

**Process:**
1. Search for each unused variable
2. Verify it's truly unused
3. Remove it
4. Test affected component

---

### ⚠️ BUG-005: Missing Test Dependencies
**Priority:** P2 - MEDIUM
**Status:** 🟡 IDENTIFIED
**Estimated Time:** 1 hour
**Assigned To:** _____________

**Problem:**
Test files exist but dependencies are missing

**Options:**

**Option A: Install Dependencies**
```bash
npm install -D vitest @testing-library/react @testing-library/user-event
```

**Option B: Remove Test Files** (if not using tests yet)
```bash
rm -rf src/test/
rm -rf src/**/*.test.tsx
```

**Recommendation:** Option A if planning to add tests, Option B otherwise

---

### ⚠️ BUG-006: AppointmentManagement.tsx Type Errors
**Priority:** P2 - MEDIUM
**Status:** 🟡 IDENTIFIED
**Estimated Time:** 30 minutes
**Assigned To:** _____________

**File:** `src/pages/AppointmentManagement.tsx:92-93`

**Problem:**
```typescript
// Line 92-93
serviceTypes.name  // ❌ Property 'name' does not exist on type '{ name: any; price: any; }[]'
serviceTypes.price
```

**Fix:**
```typescript
// Should be iterating, not accessing as array
serviceTypes.map((st) => st.name)
serviceTypes.map((st) => st.price)
```

---

## 🟢 LOW PRIORITY - FIX POST-LAUNCH

### ℹ️ BUG-007: Minor Type Safety Issues
**Priority:** P3 - LOW
**Estimated Time:** 4 hours total

**Examples:**
- Unused test imports in `*.test.tsx` files
- Minor type mismatches in monitoring services
- Unused `key` variables in map functions

**Process:**
- Fix during regular maintenance
- Address when working on related code
- Include in code review checklist

---

## 📋 VALIDATION CHECKLIST

After fixing each bug:

### For ALL Bugs:
- [ ] TypeScript compilation passes (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] No new console errors
- [ ] Related functionality tested manually
- [ ] Code reviewed by peer
- [ ] Changes documented

### For CRITICAL Bugs (BUG-001):
- [ ] Full regression testing
- [ ] All appointment workflows tested
- [ ] Database queries verified
- [ ] Production-like environment testing
- [ ] Performance impact checked
- [ ] Sign-off from QA/PM

---

## 🎯 FIX WORKFLOW

### For Each Bug:

1. **Preparation:**
   - [ ] Read bug description fully
   - [ ] Understand root cause
   - [ ] Review affected files
   - [ ] Create feature branch

2. **Implementation:**
   - [ ] Write fix
   - [ ] Test fix locally
   - [ ] Run TypeScript check
   - [ ] Run build
   - [ ] Manual testing

3. **Verification:**
   - [ ] All checklist items pass
   - [ ] No new errors introduced
   - [ ] Performance acceptable
   - [ ] Documentation updated

4. **Completion:**
   - [ ] Mark as FIXED in this document
   - [ ] Commit changes
   - [ ] Update status in project tracker
   - [ ] Notify team

---

## 📊 PROGRESS TRACKING

### Overall Progress:
- **CRITICAL Bugs:** 0/1 Fixed (0%)
- **HIGH Priority:** 0/3 Fixed (0%)
- **MEDIUM Priority:** 0/4 Fixed (0%)
- **LOW Priority:** 0/1 Fixed (0%)

**Total:** 0/9 Bugs Fixed

### Time Estimate:
- **Minimum (Critical Only):** 6-8 hours
- **Recommended (Critical + High):** 12-17 hours
- **Complete (All Bugs):** 19-24 hours

### Launch Readiness:
- **After Critical:** 90% Ready to Launch
- **After Critical + High:** 95% Ready to Launch
- **After All Bugs:** 98% Ready to Launch

---

## 🚀 LAUNCH DECISION MATRIX

| Bugs Fixed | Ready? | Confidence | Risk Level | Recommendation |
|------------|--------|------------|------------|----------------|
| None | ❌ NO | 40% | HIGH | Don't launch |
| Critical Only | ✅ YES | 90% | LOW | **Launch** |
| Critical + High | ✅ YES | 95% | VERY LOW | Ideal launch |
| All Bugs | ✅ YES | 98% | MINIMAL | Perfect launch |

**Minimum for Launch: Fix BUG-001 (Critical)**

---

## 📞 COMMUNICATION TEMPLATE

### After Fixing BUG-001:

**To Team:**
```
✅ CRITICAL BUG FIXED - Ready for Launch

BUG-001 (Appointment Schema Mismatch) has been resolved.
- All appointments now use scheduled_at correctly
- Manual testing completed successfully
- TypeScript errors resolved
- Ready for production deployment

Next Steps:
- Final QA check
- Deploy to production
- Monitor for issues
```

### If Issues Found:

**To Team:**
```
⚠️ ISSUE FOUND - Need More Time

While fixing BUG-001, discovered [issue description].
New ETA: [time needed]
Will update when resolved.
```

---

## ✅ SIGN-OFF

### Bug Fix Approval:

**BUG-001 (CRITICAL):**
- [ ] Developer: _____________ Date: _______
- [ ] QA: _____________ Date: _______
- [ ] PM: _____________ Date: _______

**Ready for Launch:**
- [ ] Technical Lead: _____________ Date: _______
- [ ] Product Owner: _____________ Date: _______

---

**Document Created:** 2025-10-31
**Last Updated:** 2025-10-31
**Next Review:** After BUG-001 fix
