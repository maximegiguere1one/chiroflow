# Phase 2 Quick Start Guide

**Phase:** Architecture & Testing (Weeks 2-4)
**Status:** Ready to Begin
**Target:** Clean architecture + 40% test coverage
**Duration:** 3 weeks

---

## 🎯 What We're Building

Phase 2 transforms the codebase from a monolithic structure into a clean, testable architecture with comprehensive test coverage.

**Before Phase 2:**
- Monolithic components (1500+ lines)
- Business logic mixed with UI
- 0% test coverage
- Direct API calls in components
- Context API state management

**After Phase 2:**
- Clean architecture with clear layers
- Separated business logic
- 40% test coverage (200+ tests)
- Service layer for API calls
- Zustand state management

---

## ✅ Prerequisites Completed

- [x] Vitest installed and configured
- [x] Design system tests passing (80 tests)
- [x] Metrics dashboard created
- [x] Implementation roadmap documented
- [x] Build verification successful

**Current Baseline:**
- Test coverage: 0%
- Tests passing: 80/86 (6 minor failures)
- TypeScript errors: ~100 unused variables
- Bundle size: ~1MB (321KB main chunk)
- Components: 210 files

---

## 📅 Week 2: Clean Architecture (Nov 4-8)

### Day 1: Architecture Setup

**Morning: Create folder structure**
```bash
# Create new architecture folders
mkdir -p src/domain/entities
mkdir -p src/domain/repositories
mkdir -p src/domain/services
mkdir -p src/application/use-cases/patient
mkdir -p src/application/use-cases/appointment
mkdir -p src/application/use-cases/billing
mkdir -p src/application/dto
mkdir -p src/presentation/components
mkdir -p src/presentation/stores
mkdir -p src/infrastructure/api
mkdir -p src/infrastructure/cache
```

**Afternoon: Create base entities**
- Create Patient entity
- Create Appointment entity
- Create Contact entity
- Define repository interfaces

**Files to create:**
- `src/domain/entities/Patient.ts`
- `src/domain/entities/Appointment.ts`
- `src/domain/repositories/IPatientRepository.ts`

### Day 2: Use-Case Implementation

**Focus: Patient management use-cases**

1. Create `CreatePatientUseCase`
2. Create `UpdatePatientUseCase`
3. Create `DeletePatientUseCase`
4. Create `GetPatientUseCase`
5. Create `ListPatientsUseCase`

**Each use-case follows this pattern:**
```typescript
export class CreatePatientUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private logger: Logger
  ) {}

  async execute(dto: CreatePatientDTO): Promise<Patient> {
    // Validation
    // Business logic
    // Repository call
    // Logging
    // Return result
  }
}
```

### Day 3: Repository Implementation

**Focus: Data access layer**

1. Implement `SupabasePatientRepository`
2. Implement error handling
3. Add retry logic
4. Create typed responses

**Example:**
```typescript
export class SupabasePatientRepository implements IPatientRepository {
  async create(patient: Patient): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .insert(patient)
      .single();

    if (error) throw new RepositoryError(error);
    return data;
  }
}
```

### Day 4: Service Layer

**Focus: API abstraction**

1. Create API client wrapper
2. Add interceptors
3. Implement error handling
4. Add request/response types

**Files:**
- `src/infrastructure/api/ApiClient.ts`
- `src/infrastructure/api/interceptors.ts`
- `src/infrastructure/api/types.ts`

### Day 5: PatientManager Refactoring

**Focus: Break down 1500+ line component**

**New structure:**
```
src/presentation/components/patients/
├── PatientList.tsx           # List display
├── PatientFilters.tsx        # Filter UI
├── PatientActions.tsx        # Bulk actions
├── PatientDetails.tsx        # Detail view
├── PatientForm.tsx           # Create/Edit form
└── hooks/
    ├── usePatientList.ts     # List logic
    ├── usePatientFilters.ts  # Filter logic
    └── usePatientForm.ts     # Form logic
```

**Steps:**
1. Extract hooks from component
2. Create sub-components
3. Connect to use-cases
4. Remove business logic
5. Verify functionality

**Success criteria:**
- Main file <400 lines
- No business logic in components
- Uses use-cases for operations
- Tests pass

---

## 📅 Week 3: Test Coverage (Nov 11-15)

### Day 1: Hook Tests

**Focus: Test all custom hooks**

**Priority order:**
1. `usePatientData` (high impact)
2. `useSettings` (widely used)
3. `useAsync` (utility)
4. `useCache` (performance)
5. `useKeyboardShortcuts` (UX)

**Example test structure:**
```typescript
describe('usePatientData', () => {
  it('loads patient data on mount', async () => {
    const { result } = renderHook(() => usePatientData('123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.patient).toBeDefined();
  });

  it('handles errors gracefully', async () => {
    // Test error handling
  });

  it('refetches on parameter change', async () => {
    // Test reactivity
  });
});
```

**Goal: 10+ hook test files**

### Day 2-3: Component Tests

**Focus: Test dashboard components**

**Priority components:**
1. PatientList (refactored)
2. AppointmentsPage
3. BillingPage
4. SettingsPage
5. Navigation components

**Test scenarios:**
- Rendering
- User interactions
- Data loading
- Error states
- Edge cases

**Goal: 50+ component tests**

### Day 4: Integration Tests

**Focus: Complete workflows**

**Test suites:**
1. Patient CRUD workflow
2. Appointment booking flow
3. Billing workflow
4. Authentication flow

**Example:**
```typescript
describe('Patient CRUD Workflow', () => {
  it('creates, reads, updates, and deletes patient', async () => {
    // Create
    await createPatient(testData);

    // Read
    const patient = await getPatient(id);
    expect(patient).toBeDefined();

    // Update
    await updatePatient(id, updates);

    // Delete
    await deletePatient(id);
    expect(await getPatient(id)).toBeNull();
  });
});
```

**Goal: 4 integration test suites**

### Day 5: Test Infrastructure

**Focus: Fix failing tests + infrastructure**

**Tasks:**
1. Fix 6 failing design system tests
2. Create test data factories
3. Set up MSW for API mocking
4. Add test fixtures
5. Generate coverage report

**Test data factory example:**
```typescript
export const PatientFactory = {
  build: (overrides?: Partial<Patient>): Patient => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    ...overrides
  })
};
```

**Goal: 40% coverage, 0 failing tests**

---

## 📅 Week 4: State Management (Nov 18-22)

### Day 1: Zustand Setup

**Install dependencies:**
```bash
npm install zustand immer
```

**Create base stores:**
1. Auth store
2. UI store
3. Patient store
4. Appointment store

**Example store:**
```typescript
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface PatientStore {
  patients: Patient[];
  loading: boolean;
  error: string | null;

  setPatients: (patients: Patient[]) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  removePatient: (id: string) => void;
}

export const usePatientStore = create<PatientStore>()(
  immer((set) => ({
    patients: [],
    loading: false,
    error: null,

    setPatients: (patients) => set({ patients }),

    addPatient: (patient) => set((state) => {
      state.patients.push(patient);
    }),

    updatePatient: (id, updates) => set((state) => {
      const index = state.patients.findIndex(p => p.id === id);
      if (index !== -1) {
        Object.assign(state.patients[index], updates);
      }
    }),

    removePatient: (id) => set((state) => {
      state.patients = state.patients.filter(p => p.id !== id);
    })
  }))
);
```

### Day 2: Migrate from Context

**Focus: Replace Context API with Zustand**

**Components to migrate:**
1. OrganizationContext → useOrganizationStore
2. ToastContext → useToastStore
3. Auth state → useAuthStore

**Migration pattern:**
```typescript
// Before (Context)
const { organization } = useOrganization();

// After (Zustand)
const organization = useOrganizationStore(state => state.organization);
```

### Day 3: Real-time Sync

**Focus: Supabase subscriptions**

**Implement:**
1. Real-time patient updates
2. Real-time appointment changes
3. Sync manager
4. Conflict resolution

**Example:**
```typescript
useEffect(() => {
  const channel = supabase
    .channel('patients')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'patients'
    }, (payload) => {
      handlePatientChange(payload);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### Day 4: Optimistic Updates

**Focus: Instant UI feedback**

**Implement patterns:**
1. Optimistic create
2. Optimistic update
3. Optimistic delete
4. Rollback on error

**Example:**
```typescript
const addPatient = async (patient: Patient) => {
  // Optimistic update
  const tempId = generateTempId();
  addPatientOptimistic({ ...patient, id: tempId });

  try {
    // Real API call
    const result = await createPatient(patient);
    replacePatient(tempId, result);
  } catch (error) {
    // Rollback on error
    removePatient(tempId);
    showError('Failed to create patient');
  }
};
```

### Day 5: Cache Strategy

**Focus: Intelligent caching**

**Implement:**
1. Cache policies (TTL, invalidation)
2. Cache persistence
3. Cache warming
4. Cache metrics

**Cache manager:**
```typescript
class CacheManager {
  private cache = new Map();

  set(key: string, value: any, ttl: number = 300000) {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

---

## 🎯 Daily Workflow

### Morning Routine
1. Review yesterday's progress
2. Check tests still passing
3. Update todo list
4. Plan today's tasks

### Development Cycle
1. Write failing test (TDD)
2. Implement feature
3. Make test pass
4. Refactor
5. Commit

### Evening Routine
1. Run full test suite
2. Check coverage report
3. Update metrics dashboard
4. Commit and push
5. Update roadmap

---

## 🧪 Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:run

# Run with UI
npm run test:ui

# Generate coverage
npm run test:coverage

# Run specific test file
npm test -- src/hooks/usePatientData.test.ts

# Run tests matching pattern
npm test -- --grep "Patient"
```

---

## 📊 Success Metrics

### Week 2 Targets
- [ ] Clean architecture folder structure created
- [ ] 5+ use-cases implemented
- [ ] PatientManager refactored to <400 lines
- [ ] Service layer created
- [ ] All components <400 lines

### Week 3 Targets
- [ ] 10+ hook tests written
- [ ] 50+ component tests written
- [ ] 4 integration test suites
- [ ] 40% code coverage achieved
- [ ] 0 failing tests

### Week 4 Targets
- [ ] Zustand stores implemented
- [ ] Context API removed
- [ ] Real-time sync working
- [ ] Optimistic updates added
- [ ] Cache system implemented

---

## 🚨 Common Issues & Solutions

### Issue: Tests failing after refactoring
**Solution:** Update test imports and mocks

### Issue: Type errors in new architecture
**Solution:** Ensure interfaces are properly exported

### Issue: Performance regression
**Solution:** Profile with React DevTools, add memoization

### Issue: Coverage not improving
**Solution:** Test critical paths first, skip trivial code

### Issue: Zustand store not updating
**Solution:** Use immer middleware, check selectors

---

## 📚 Key Resources

### Documentation
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Zustand Docs](https://docs.pmnd.rs/zustand/getting-started/introduction)

### Internal Docs
- `IMPLEMENTATION_ROADMAP.md` - Full 16-week plan
- `METRICS_DASHBOARD.md` - Progress tracking
- `STRATEGIE_AMELIORATION_10X.md` - Complete strategy

### Code Examples
- Design system tests: `src/design-system/components/*.test.tsx`
- Use-case examples: `src/application/use-cases/patient/`
- Repository examples: `src/infrastructure/repositories/`

---

## 🎉 Phase 2 Completion Checklist

At the end of Week 4, verify:

- [ ] All large components refactored (<400 lines each)
- [ ] Clean architecture implemented and documented
- [ ] 40% test coverage achieved
- [ ] All tests passing (0 failures)
- [ ] Zustand state management working
- [ ] Real-time sync operational
- [ ] Optimistic updates implemented
- [ ] Cache system functional
- [ ] Context API fully removed
- [ ] Documentation updated
- [ ] Metrics dashboard shows progress
- [ ] Build succeeds with no errors
- [ ] TypeScript errors reduced by 50%
- [ ] Team trained on new architecture
- [ ] Phase 3 planning complete

---

**Start Date:** November 4, 2025
**Target Completion:** November 22, 2025
**Next Phase:** Performance Optimization (Phase 3)

Good luck! 🚀
