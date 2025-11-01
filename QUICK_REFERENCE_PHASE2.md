# Phase 2 Quick Reference Card

**Print or bookmark this page for daily reference!**

---

## 📅 Phase 2 Overview

**Duration:** 3 weeks (Nov 4-22, 2025)
**Goal:** Clean architecture + 40% test coverage
**Current Status:** Week 1 ✅ | Week 2 🔄 | Week 3 ⏳ | Week 4 ⏳

---

## 🎯 Weekly Goals

### Week 2: Clean Architecture
- Create domain/application/infrastructure layers
- Implement 5+ use-cases
- Refactor PatientManager to <400 lines
- Build API service layer

### Week 3: Test Coverage
- Write 10+ hook tests
- Write 50+ component tests
- Create 4 integration test suites
- Achieve 40% coverage

### Week 4: State Management
- Implement Zustand stores
- Remove Context API
- Add real-time sync
- Build cache system

---

## 💻 Daily Commands

```bash
# Start working
npm run dev                  # Start dev server

# Testing (use these constantly!)
npm test                     # Watch mode
npm run test:run             # Run once
npm run test:coverage        # Coverage report

# Quality checks (before commits)
npm run typecheck            # TypeScript check
npm run lint                 # ESLint check
npm run build                # Production build
```

---

## 📁 New Architecture

```
src/
├── domain/
│   ├── entities/           # Business objects
│   └── repositories/       # Data interfaces
│
├── application/
│   ├── use-cases/         # Business operations
│   └── dto/               # Data transfer objects
│
├── infrastructure/
│   ├── api/               # API clients
│   └── repositories/      # Data implementations
│
└── presentation/
    ├── components/        # UI components
    └── stores/            # Zustand stores (Week 4)
```

---

## 🧪 Test Patterns

### Hook Test
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { usePatientData } from './usePatientData';

it('loads patient data', async () => {
  const { result } = renderHook(() =>
    usePatientData('123')
  );

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.patient).toBeDefined();
});
```

### Component Test
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PatientList } from './PatientList';

it('displays patients', () => {
  render(<PatientList patients={mockPatients} />);
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});

it('handles click', async () => {
  const onClick = vi.fn();
  render(<PatientList onPatientClick={onClick} />);

  await fireEvent.click(screen.getByText('John Doe'));
  expect(onClick).toHaveBeenCalled();
});
```

---

## 🏗️ Architecture Patterns

### Use-Case
```typescript
export class CreatePatientUseCase {
  constructor(
    private repo: IPatientRepository,
    private logger: Logger
  ) {}

  async execute(dto: CreatePatientDTO): Promise<Patient> {
    // 1. Validate
    this.validate(dto);

    // 2. Business logic
    const patient = new Patient(dto);

    // 3. Persist
    const result = await this.repo.create(patient);

    // 4. Log
    this.logger.info('Patient created', { id: result.id });

    return result;
  }
}
```

### Repository
```typescript
export class SupabasePatientRepository
  implements IPatientRepository {

  async create(patient: Patient): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .insert(patient)
      .select()
      .single();

    if (error) throw new RepositoryError(error);
    return data;
  }
}
```

### Zustand Store (Week 4)
```typescript
export const usePatientStore = create<PatientStore>()(
  immer((set) => ({
    patients: [],
    loading: false,

    addPatient: (patient) => set((state) => {
      state.patients.push(patient);
    }),

    updatePatient: (id, updates) => set((state) => {
      const index = state.patients.findIndex(p => p.id === id);
      if (index !== -1) {
        Object.assign(state.patients[index], updates);
      }
    })
  }))
);
```

---

## 📊 Success Metrics

### Daily
- [ ] Tests passing
- [ ] Code committed
- [ ] Progress documented

### Weekly
- [ ] Week goals completed
- [ ] Metrics dashboard updated
- [ ] No regressions
- [ ] Documentation current

### Phase 2 Complete
- [ ] 40% test coverage
- [ ] All components <400 lines
- [ ] Clean architecture
- [ ] Zustand implemented
- [ ] 0 failing tests

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Tests failing | Check imports, update mocks |
| Type errors | Export interfaces properly |
| Slow tests | Use MSW for API mocking |
| Coverage not improving | Test critical paths first |
| Zustand not updating | Use immer middleware |

---

## 📚 Key Documents

| Document | When to Use |
|----------|-------------|
| PHASE2_QUICKSTART.md | Daily guidance |
| IMPLEMENTATION_ROADMAP.md | Full plan reference |
| METRICS_DASHBOARD.md | Track progress |
| TRANSFORMATION_JOURNEY.md | Motivation & vision |

---

## ⏰ Time Management

### Monday-Thursday
- 9:00 AM - Plan day
- 9:30 AM - Code (TDD)
- 12:00 PM - Lunch
- 1:00 PM - Code (TDD)
- 5:00 PM - Review & commit

### Friday
- Morning - Complete week's work
- Afternoon - Update metrics, plan next week
- Demo accomplishments
- Celebrate wins!

---

## 🎯 TDD Cycle

```
1. 🔴 Write failing test
   ↓
2. 🟢 Write minimal code to pass
   ↓
3. 🔵 Refactor
   ↓
4. ✅ Commit
   ↓
[Repeat]
```

---

## 🔥 Hot Tips

1. **Test First** - Always write the test before code
2. **Commit Often** - Small, focused commits
3. **Run Tests** - After every change
4. **Check Coverage** - But focus on quality
5. **Ask Questions** - Early and often
6. **Take Breaks** - Fresh mind = better code
7. **Celebrate Wins** - Every milestone matters!

---

## 📞 When Stuck

1. Check PHASE2_QUICKSTART.md troubleshooting
2. Look at existing test examples
3. Review architecture patterns
4. Read relevant documentation
5. Ask with specific context

---

## 🎉 Celebration Points

- ✨ First use-case implemented
- ✨ PatientManager refactored
- ✨ First hook fully tested
- ✨ 20% coverage achieved
- ✨ 40% coverage achieved
- ✨ Zustand working
- ✨ Phase 2 complete!

---

## 🚀 Your Mantra

**"Test First, Refactor Often, Ship with Confidence"**

Every test makes the codebase stronger.
Every refactor makes it cleaner.
Every commit moves us closer to world-class.

---

**Print this card and keep it visible!**

**Next:** Open `PHASE2_QUICKSTART.md` for detailed day-by-day tasks!

**Let's build! 💪**
