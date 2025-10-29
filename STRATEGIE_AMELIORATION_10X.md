# 🚀 Stratégie d'Amélioration 10x - ChiroFlow AI

## 📊 Résumé Exécutif

Ce document présente une stratégie complète pour transformer ChiroFlow en un logiciel **10 fois meilleur** dans tous les aspects critiques : code, fiabilité, performance, design et praticité.

**État actuel analysé:**
- 95+ fichiers TypeScript/React
- Architecture monolithique avec composants lourds
- Aucun test automatisé
- Performance non optimisée
- UX fonctionnelle mais perfectible

**Objectif:** Transformer ChiroFlow en un produit de classe mondiale, prêt à scaler, ultra-fiable, performant et avec une UX exceptionnelle.

---

## 📈 Métriques de Succès (Objectifs 10x)

| Domaine | Métrique | Actuel | Objectif 10x | Méthode de Mesure |
|---------|----------|--------|--------------|-------------------|
| **Code** | Couverture tests | 0% | 80%+ | Jest coverage |
| **Code** | Complexité cyclomatique | ~15-20 | <5 | SonarQube |
| **Code** | Dette technique | Élevée | Minimale | Code Climate |
| **Fiabilité** | Uptime | ~95% | 99.9% | Monitoring |
| **Fiabilité** | Erreurs production | Inconnues | <0.1% | Sentry |
| **Fiabilité** | MTTR | ~2h | <15min | Logs |
| **Performance** | Time to Interactive | ~4s | <400ms | Lighthouse |
| **Performance** | Bundle size | 638KB | <200KB | Webpack analyzer |
| **Performance** | API response | ~500ms | <50ms | APM |
| **Design** | SUS Score | ~65 | 85+ | User testing |
| **Design** | Lighthouse Access. | ~75 | 95+ | Lighthouse |
| **Praticité** | Task completion | ~70% | 95%+ | Analytics |
| **Praticité** | User satisfaction | ~3.5/5 | 4.8/5 | NPS |

---

# 1️⃣ AMÉLIORATION DU CODE

## 🔍 Analyse de l'Existant

### Points Faibles Identifiés

1. **Architecture Monolithique**
   - Composants trop lourds (PatientManager: 1500+ lignes)
   - Couplage fort entre modules
   - Pas de séparation claire des responsabilités

2. **Absence de Tests**
   - 0% de couverture de tests
   - Aucun test unitaire, intégration ou E2E
   - Régressions fréquentes possibles

3. **Dette Technique**
   - Code dupliqué (ex: gestion d'erreurs répétée)
   - Types TypeScript incomplets (`any` utilisé)
   - Warnings TypeScript non résolus (50+)

4. **Mauvaises Pratiques**
   - Logique métier dans les composants UI
   - Appels API non standardisés
   - Pas de gestion centralisée des états

### Opportunités d'Amélioration

✅ Refactoring vers architecture modulaire
✅ Implémentation TDD (Test-Driven Development)
✅ Adoption de patterns modernes (hooks personnalisés, context API)
✅ Typage strict et complet
✅ Linting et formatage automatique

## 🎯 Plan d'Action CODE

### Phase 1: Fondations (Semaines 1-2)

#### 1.1 Configuration Qualité Code

```bash
# Installation outils qualité
npm install -D @testing-library/react @testing-library/jest-dom vitest
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier
npm install -D husky lint-staged
```

**Fichier: `.eslintrc.json`**
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "complexity": ["error", 10],
    "max-lines-per-function": ["warn", 50],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

**Fichier: `vitest.config.ts`**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    }
  }
});
```

#### 1.2 Architecture Modulaire

**Structure proposée:**
```
src/
├── core/                    # Logique métier pure
│   ├── domain/             # Entités et règles métier
│   │   ├── models/         # Types et interfaces
│   │   ├── services/       # Services métier
│   │   └── validators/     # Validation métier
│   ├── use-cases/          # Cas d'utilisation
│   │   ├── patients/
│   │   ├── appointments/
│   │   └── billing/
│   └── ports/              # Interfaces (ports & adapters)
│       ├── repositories/
│       └── services/
├── infrastructure/         # Implémentations techniques
│   ├── api/               # Client API Supabase
│   ├── cache/             # Gestion cache
│   ├── storage/           # localStorage, sessionStorage
│   └── monitoring/        # Analytics, logging
├── presentation/          # UI Layer
│   ├── components/        # Composants réutilisables
│   │   ├── atoms/        # Boutons, inputs
│   │   ├── molecules/    # Cartes, formulaires
│   │   ├── organisms/    # Sections complètes
│   │   └── templates/    # Layouts
│   ├── pages/            # Pages/Routes
│   ├── hooks/            # Custom hooks
│   └── context/          # Context providers
└── shared/               # Utilitaires partagés
    ├── utils/
    ├── constants/
    └── types/
```

#### 1.3 Refactoring Exemple: PatientManager

**Avant (1500 lignes):**
```typescript
// PatientManager.tsx - TOUT dans un fichier
export function PatientManager() {
  // État local massif
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  // ... 50+ autres états

  // Logique métier mélangée
  const handleSave = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('patients').insert(...);
    // ... validation, transformation, etc.
  };

  // Rendu massif
  return <div>{/* 1000+ lignes de JSX */}</div>;
}
```

**Après (modulaire):**

**1. Modèle de domaine:** `src/core/domain/models/Patient.ts`
```typescript
export interface Patient {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly phone: string;
  readonly dateOfBirth: Date;
  readonly status: PatientStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type PatientStatus = 'active' | 'inactive' | 'archived';

export class PatientEntity implements Patient {
  constructor(private readonly data: Patient) {}

  get id(): string { return this.data.id; }
  get email(): string { return this.data.email; }
  // ... autres getters

  isActive(): boolean {
    return this.data.status === 'active';
  }

  canBeArchived(): boolean {
    // Règles métier
    return this.data.status !== 'archived';
  }
}
```

**2. Repository:** `src/core/ports/repositories/PatientRepository.ts`
```typescript
export interface IPatientRepository {
  findAll(): Promise<Patient[]>;
  findById(id: string): Promise<Patient | null>;
  save(patient: Omit<Patient, 'id'>): Promise<Patient>;
  update(id: string, patient: Partial<Patient>): Promise<Patient>;
  delete(id: string): Promise<void>;
}
```

**3. Implémentation:** `src/infrastructure/api/SupabasePatientRepository.ts`
```typescript
export class SupabasePatientRepository implements IPatientRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(): Promise<Patient[]> {
    const { data, error } = await this.supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new RepositoryError(error.message);
    return data.map(this.toEntity);
  }

  private toEntity(raw: any): Patient {
    return {
      id: raw.id,
      email: raw.email,
      fullName: raw.full_name,
      // ... mapping
    };
  }
}
```

**4. Use Case:** `src/core/use-cases/patients/CreatePatient.ts`
```typescript
export class CreatePatientUseCase {
  constructor(
    private repository: IPatientRepository,
    private validator: PatientValidator,
    private emailService: IEmailService
  ) {}

  async execute(input: CreatePatientInput): Promise<Result<Patient>> {
    // 1. Validation
    const validation = this.validator.validate(input);
    if (!validation.isValid) {
      return Result.fail(validation.errors);
    }

    // 2. Création
    try {
      const patient = await this.repository.save({
        email: input.email,
        fullName: input.fullName,
        // ...
      });

      // 3. Email de bienvenue (side effect)
      await this.emailService.sendWelcome(patient.email);

      return Result.ok(patient);
    } catch (error) {
      return Result.fail(error.message);
    }
  }
}
```

**5. Hook personnalisé:** `src/presentation/hooks/usePatients.ts`
```typescript
export function usePatients() {
  const repository = usePatientRepository(); // DI via context
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await repository.findAll();
      setPatients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [repository]);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  return { patients, loading, error, reload: loadPatients };
}
```

**6. Composant UI (léger):** `src/presentation/pages/PatientsPage.tsx`
```typescript
export function PatientsPage() {
  const { patients, loading, error } = usePatients();
  const createPatient = useCreatePatient();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <PageLayout>
      <PageHeader title="Patients" />
      <PatientList patients={patients} />
      <CreatePatientModal onSubmit={createPatient} />
    </PageLayout>
  );
}
```

### Phase 2: Tests (Semaines 3-4)

#### 2.1 Tests Unitaires

**Exemple: PatientEntity**
```typescript
// Patient.test.ts
import { describe, it, expect } from 'vitest';
import { PatientEntity } from './Patient';

describe('PatientEntity', () => {
  const validPatient = {
    id: '123',
    email: 'test@test.com',
    fullName: 'John Doe',
    status: 'active' as const,
    // ...
  };

  describe('isActive', () => {
    it('should return true when status is active', () => {
      const patient = new PatientEntity(validPatient);
      expect(patient.isActive()).toBe(true);
    });

    it('should return false when status is inactive', () => {
      const patient = new PatientEntity({
        ...validPatient,
        status: 'inactive'
      });
      expect(patient.isActive()).toBe(false);
    });
  });

  describe('canBeArchived', () => {
    it('should allow archiving active patients', () => {
      const patient = new PatientEntity(validPatient);
      expect(patient.canBeArchived()).toBe(true);
    });

    it('should not allow re-archiving', () => {
      const patient = new PatientEntity({
        ...validPatient,
        status: 'archived'
      });
      expect(patient.canBeArchived()).toBe(false);
    });
  });
});
```

#### 2.2 Tests d'Intégration

```typescript
// CreatePatient.integration.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreatePatientUseCase } from './CreatePatient';

describe('CreatePatientUseCase Integration', () => {
  let useCase: CreatePatientUseCase;
  let mockRepository: IPatientRepository;
  let mockEmailService: IEmailService;

  beforeEach(() => {
    mockRepository = {
      save: vi.fn().mockResolvedValue({ id: '123', /* ... */ })
    };
    mockEmailService = {
      sendWelcome: vi.fn().mockResolvedValue(undefined)
    };

    useCase = new CreatePatientUseCase(
      mockRepository,
      new PatientValidator(),
      mockEmailService
    );
  });

  it('should create patient and send welcome email', async () => {
    const input = {
      email: 'new@test.com',
      fullName: 'New Patient',
      // ...
    };

    const result = await useCase.execute(input);

    expect(result.isSuccess).toBe(true);
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ email: input.email })
    );
    expect(mockEmailService.sendWelcome).toHaveBeenCalledWith(input.email);
  });

  it('should fail for invalid email', async () => {
    const input = {
      email: 'invalid-email',
      fullName: 'Test',
    };

    const result = await useCase.execute(input);

    expect(result.isSuccess).toBe(false);
    expect(result.error).toContain('Invalid email');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
```

#### 2.3 Tests E2E avec Playwright

```typescript
// e2e/patients.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Patient Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/patients');
    // Login if needed
  });

  test('should create a new patient', async ({ page }) => {
    await page.click('button:has-text("Nouveau patient")');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="fullName"]', 'John Doe');
    await page.fill('input[name="phone"]', '514-123-4567');

    await page.click('button:has-text("Enregistrer")');

    await expect(page.locator('text=Patient créé avec succès')).toBeVisible();
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.click('button:has-text("Nouveau patient")');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="fullName"]', 'John Doe');

    await page.click('button:has-text("Enregistrer")');

    await expect(page.locator('text=Email invalide')).toBeVisible();
  });
});
```

### Phase 3: Optimisation Code (Semaines 5-6)

#### 3.1 Élimination de la Dette Technique

**Actions:**
1. Résoudre TOUS les warnings TypeScript
2. Éliminer l'utilisation de `any`
3. Supprimer le code mort (unused imports, variables)
4. Réduire la duplication (DRY principle)

**Outil:** ESLint + Prettier + TypeScript strict mode

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### 3.2 Patterns Modernes

**1. Custom Hooks pour Logique Réutilisable**
```typescript
// useForm.ts - Hook générique pour formulaires
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validator: (values: T) => ValidationResult
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleBlur = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const validation = validator(values);
    setErrors(validation.errors);
  }, [values, validator]);

  const handleSubmit = useCallback((onSubmit: (values: T) => void) => {
    return (e: React.FormEvent) => {
      e.preventDefault();
      const validation = validator(values);

      if (validation.isValid) {
        onSubmit(values);
      } else {
        setErrors(validation.errors);
      }
    };
  }, [values, validator]);

  return { values, errors, touched, handleChange, handleBlur, handleSubmit };
}
```

**2. Context API pour État Global**
```typescript
// AppContext.tsx
interface AppState {
  user: User | null;
  settings: Settings;
  theme: 'light' | 'dark';
}

interface AppActions {
  setUser: (user: User | null) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  toggleTheme: () => void;
}

const AppContext = createContext<AppState & AppActions | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null,
    settings: defaultSettings,
    theme: 'light'
  });

  const actions: AppActions = {
    setUser: (user) => setState(prev => ({ ...prev, user })),
    updateSettings: (settings) => setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings }
    })),
    toggleTheme: () => setState(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }))
  };

  return (
    <AppContext.Provider value={{ ...state, ...actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
```

## 📊 Métriques CODE - Objectifs

| Métrique | Actuel | Cible | Outil |
|----------|--------|-------|-------|
| Couverture tests | 0% | 80%+ | Vitest |
| Complexité cyclomatique | 15-20 | <10 | ESLint |
| Lignes par fonction | 100+ | <50 | ESLint |
| Duplication code | ~15% | <3% | SonarQube |
| Warnings TS | 50+ | 0 | tsc --noEmit |
| Utilisation `any` | 30+ | 0 | ESLint |
| Taille fichiers | 1500+ | <300 | ESLint |

---

# 2️⃣ AMÉLIORATION DE LA FIABILITÉ

## 🔍 Analyse de l'Existant

### Points Faibles Identifiés

1. **Gestion d'Erreurs Incomplète**
   - Try-catch sporadiques
   - Pas de logging centralisé
   - Erreurs silencieuses

2. **Aucun Monitoring**
   - Pas de tracking des erreurs production
   - Pas d'alertes
   - Pas de métriques de santé

3. **Validation Fragile**
   - Validation côté client uniquement
   - Pas de typage runtime (Zod, Yup)
   - Données corrompues possibles

4. **Sécurité Basique**
   - Pas de rate limiting
   - Pas de CSRF protection
   - Tokens exposés dans code

## 🎯 Plan d'Action FIABILITÉ

### Phase 1: Error Handling & Logging (Semaine 1)

#### 1.1 Système de Logging Centralisé

```typescript
// src/infrastructure/monitoring/Logger.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  stack?: string;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private remoteLogger?: IRemoteLogger;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  configure(config: { remoteLogger?: IRemoteLogger }) {
    this.remoteLogger = config.remoteLogger;
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, {
      ...context,
      error: error?.message,
      stack: error?.stack
    });
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, {
      ...context,
      error: error?.message,
      stack: error?.stack
    });
    // Envoyer immédiatement
    this.flush();
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    };

    this.logs.push(entry);

    // Console en dev
    if (import.meta.env.DEV) {
      const method = level >= LogLevel.ERROR ? 'error' :
                    level >= LogLevel.WARN ? 'warn' : 'log';
      console[method](`[${LogLevel[level]}]`, message, context);
    }

    // Envoi remote si erreur ou logs > 50
    if (level >= LogLevel.ERROR || this.logs.length >= 50) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.logs.length === 0 || !this.remoteLogger) return;

    const logsToSend = [...this.logs];
    this.logs = [];

    try {
      await this.remoteLogger.send(logsToSend);
    } catch (error) {
      console.error('Failed to send logs', error);
      // Remettre dans la queue
      this.logs.unshift(...logsToSend);
    }
  }

  private getCurrentUserId(): string | undefined {
    // Récupérer depuis auth context
    return undefined;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }
}

export const logger = Logger.getInstance();
```

#### 1.2 Error Boundary Global

```typescript
// src/presentation/components/GlobalErrorBoundary.tsx
export class GlobalErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error) {
    logger.fatal('React Error Boundary caught error', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error boundary details', error, {
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => {
            this.setState({ hasError: false, error: undefined });
            window.location.href = '/';
          }}
        />
      );
    }

    return this.props.children;
  }
}
```

#### 1.3 Gestion d'Erreurs API

```typescript
// src/infrastructure/api/ApiClient.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  constructor(
    private baseUrl: string,
    private defaultHeaders: Record<string, string>
  ) {}

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const requestId = crypto.randomUUID();

    logger.debug(`API Request: ${options.method || 'GET'} ${endpoint}`, {
      requestId,
      body: options.body
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
          'X-Request-ID': requestId
        }
      });

      if (!response.ok) {
        const error = await this.handleErrorResponse(response, requestId);
        throw error;
      }

      const data = await response.json();

      logger.debug(`API Response: ${endpoint}`, {
        requestId,
        status: response.status
      });

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error(`API Error: ${endpoint}`, error, {
          requestId,
          code: error.code,
          status: error.status
        });
        throw error;
      }

      // Network error
      logger.error(`Network Error: ${endpoint}`, error as Error, {
        requestId
      });

      throw new ApiError(
        'Network error - please check your connection',
        'NETWORK_ERROR',
        0,
        { originalError: error }
      );
    }
  }

  private async handleErrorResponse(
    response: Response,
    requestId: string
  ): Promise<ApiError> {
    let body: any;
    try {
      body = await response.json();
    } catch {
      body = { message: response.statusText };
    }

    return new ApiError(
      body.message || 'An error occurred',
      body.code || `HTTP_${response.status}`,
      response.status,
      { requestId, body }
    );
  }
}
```

### Phase 2: Monitoring & Alerting (Semaine 2)

#### 2.1 Intégration Sentry

```typescript
// src/infrastructure/monitoring/Sentry.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initSentry() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new BrowserTracing(),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true
        })
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE,
      beforeSend(event, hint) {
        // Filtrer erreurs non pertinentes
        if (event.exception) {
          const error = hint.originalException;
          if (error instanceof Error && error.message.includes('ResizeObserver')) {
            return null; // Ignorer cette erreur connue
          }
        }
        return event;
      }
    });
  }
}

// Wrapper pour logger
export class SentryLogger implements IRemoteLogger {
  async send(logs: LogEntry[]): Promise<void> {
    logs.forEach(log => {
      if (log.level >= LogLevel.ERROR) {
        Sentry.captureException(new Error(log.message), {
          level: log.level === LogLevel.FATAL ? 'fatal' : 'error',
          contexts: {
            log: log.context
          },
          user: {
            id: log.userId
          }
        });
      } else if (log.level === LogLevel.WARN) {
        Sentry.captureMessage(log.message, 'warning');
      }
    });
  }
}
```

#### 2.2 Health Checks

```typescript
// src/infrastructure/monitoring/HealthCheck.ts
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    name: string;
    status: 'pass' | 'fail';
    responseTime: number;
    message?: string;
  }[];
  timestamp: Date;
}

export class HealthMonitor {
  private checks: Map<string, () => Promise<boolean>> = new Map();

  registerCheck(name: string, check: () => Promise<boolean>): void {
    this.checks.set(name, check);
  }

  async runChecks(): Promise<HealthCheckResult> {
    const checks = await Promise.all(
      Array.from(this.checks.entries()).map(async ([name, check]) => {
        const start = performance.now();
        try {
          const result = await check();
          const responseTime = performance.now() - start;

          return {
            name,
            status: result ? 'pass' : 'fail',
            responseTime
          };
        } catch (error) {
          const responseTime = performance.now() - start;
          return {
            name,
            status: 'fail' as const,
            responseTime,
            message: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const failedChecks = checks.filter(c => c.status === 'fail');
    const status = failedChecks.length === 0 ? 'healthy' :
                   failedChecks.length < checks.length / 2 ? 'degraded' :
                   'unhealthy';

    return {
      status,
      checks,
      timestamp: new Date()
    };
  }
}

// Utilisation
const healthMonitor = new HealthMonitor();

healthMonitor.registerCheck('database', async () => {
  const { error } = await supabase.from('patients').select('id').limit(1);
  return !error;
});

healthMonitor.registerCheck('api', async () => {
  const response = await fetch('/api/health');
  return response.ok;
});

// Exécuter toutes les 5 minutes
setInterval(async () => {
  const result = await healthMonitor.runChecks();
  logger.info('Health check completed', { result });

  if (result.status === 'unhealthy') {
    logger.error('System unhealthy!', undefined, { result });
  }
}, 5 * 60 * 1000);
```

### Phase 3: Validation Robuste (Semaine 3)

#### 3.1 Validation avec Zod

```typescript
// src/core/domain/validators/PatientSchema.ts
import { z } from 'zod';

export const PatientSchema = z.object({
  email: z.string()
    .email('Email invalide')
    .max(255, 'Email trop long'),

  fullName: z.string()
    .min(2, 'Nom trop court')
    .max(100, 'Nom trop long')
    .regex(/^[a-zA-ZÀ-ÿ\s-]+$/, 'Caractères invalides dans le nom'),

  phone: z.string()
    .regex(/^\+?1?\s*\(?[0-9]{3}\)?[\s.-]?[0-9]{3}[\s.-]?[0-9]{4}$/,
           'Numéro de téléphone invalide'),

  dateOfBirth: z.date()
    .max(new Date(), 'Date de naissance dans le futur')
    .refine(
      (date) => {
        const age = new Date().getFullYear() - date.getFullYear();
        return age >= 0 && age <= 120;
      },
      'Âge invalide'
    ),

  address: z.object({
    street: z.string().min(5, 'Adresse trop courte'),
    city: z.string().min(2, 'Ville invalide'),
    postalCode: z.string()
      .regex(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Code postal invalide (format: A1A 1A1)')
  }).optional()
});

export type PatientInput = z.infer<typeof PatientSchema>;

// Validation helper
export function validatePatient(data: unknown): Result<PatientInput> {
  try {
    const validated = PatientSchema.parse(data);
    return Result.ok(validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Result.fail(error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
    }
    return Result.fail(['Validation failed']);
  }
}
```

#### 3.2 Validation Côté Serveur (Edge Function)

```typescript
// supabase/functions/create-patient/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const PatientSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?1?\s*\(?[0-9]{3}\)?[\s.-]?[0-9]{3}[\s.-]?[0-9]{4}$/),
  // ... autres champs
});

serve(async (req) => {
  try {
    // CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Parse & validate
    const body = await req.json();
    const validation = PatientSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.errors
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Business logic
    const patient = validation.data;

    // Save to DB (avec RLS automatique)
    // ...

    return new Response(
      JSON.stringify({ success: true, patient }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    // Log error
    console.error('Error creating patient:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
```

### Phase 4: Sécurité Renforcée (Semaine 4)

#### 4.1 Rate Limiting

```typescript
// src/infrastructure/security/RateLimiter.ts
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Nettoyer les anciennes requêtes
    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return true;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

// Usage dans un hook
export function useRateLimitedAction(
  action: () => Promise<void>,
  maxRequests: number = 5,
  windowMs: number = 60000
) {
  const rateLimiter = useRef(new RateLimiter(maxRequests, windowMs));
  const userId = useApp().user?.id || 'anonymous';

  return useCallback(async () => {
    if (!rateLimiter.current.isAllowed(userId)) {
      const remaining = rateLimiter.current.getRemainingRequests(userId);
      throw new Error(
        `Trop de requêtes. Réessayez dans ${Math.ceil(windowMs / 1000)} secondes.`
      );
    }

    await action();
  }, [action, userId, windowMs]);
}
```

#### 4.2 Sanitization des Inputs

```typescript
// src/shared/utils/sanitize.ts
import DOMPurify from 'dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href']
  });
}

export function sanitizeInput(input: string): string {
  // Supprimer les caractères dangereux
  return input
    .replace(/[<>]/g, '') // Pas de HTML
    .replace(/javascript:/gi, '') // Pas de JS
    .trim();
}

export function sanitizePhone(phone: string): string {
  // Garder seulement chiffres et +
  return phone.replace(/[^0-9+]/g, '');
}

// Hook pour inputs sécurisés
export function useSanitizedInput(initialValue: string = '') {
  const [value, setValue] = useState(sanitizeInput(initialValue));

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(sanitizeInput(e.target.value));
  }, []);

  return [value, handleChange] as const;
}
```

## 📊 Métriques FIABILITÉ - Objectifs

| Métrique | Actuel | Cible | Outil |
|----------|--------|-------|-------|
| Uptime | ~95% | 99.9% | Pingdom |
| MTTR | ~2h | <15min | Sentry alerts |
| Erreurs production | ? | <0.1% | Sentry |
| Tests E2E passing | 0% | 100% | Playwright |
| Security score | B | A+ | Snyk |
| Error recovery | 40% | 95% | Monitoring |

---

# 3️⃣ AMÉLIORATION DE LA PERFORMANCE

## 🔍 Analyse de l'Existant

### Points Faibles Identifiés

1. **Bundle Trop Gros**
   - 638KB (minifié)
   - Pas de code splitting
   - Toutes les dépendances chargées upfront

2. **Pas d'Optimisation Rendu**
   - Re-renders inutiles
   - Pas de memoization
   - Listes non virtualisées

3. **Requêtes API Inefficaces**
   - Pas de cache
   - Requêtes redondantes
   - Pas de pagination

4. **Images Non Optimisées**
   - Formats lourds
   - Pas de lazy loading
   - Pas de responsive images

## 🎯 Plan d'Action PERFORMANCE

### Phase 1: Optimisation Bundle (Semaine 1)

#### 1.1 Code Splitting & Lazy Loading

```typescript
// src/App.tsx - Route-based code splitting
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PatientPortal = lazy(() => import('./pages/PatientPortal'));
const OnlineBooking = lazy(() => import('./pages/OnlineBooking'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/patient-portal" element={<PatientPortal />} />
        <Route path="/booking" element={<OnlineBooking />} />
      </Routes>
    </Suspense>
  );
}
```

#### 1.2 Tree Shaking & Bundle Analysis

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'supabase-vendor': ['@supabase/supabase-js'],

          // Feature chunks
          'dashboard': [
            './src/pages/AdminDashboard',
            './src/components/dashboard/PatientManager',
            './src/components/dashboard/Calendar'
          ],
          'portal': [
            './src/pages/PatientPortal',
            './src/components/patient-portal/PatientProfile'
          ]
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer console.log en prod
        drop_debugger: true
      }
    }
  }
});
```

**Résultat attendu:** 638KB → **<200KB** (68% réduction)

#### 1.3 Import Dynamique des Dépendances Lourdes

```typescript
// Avant: Charge toujours jsPDF
import jsPDF from 'jspdf';

export function generatePDF() {
  const doc = new jsPDF();
  // ...
}

// Après: Charge seulement quand nécessaire
export async function generatePDF() {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  // ...
}
```

### Phase 2: Optimisation Rendu (Semaine 2)

#### 2.1 Memoization Stratégique

```typescript
// Avant: Re-render à chaque update parent
export function PatientCard({ patient }: { patient: Patient }) {
  return (
    <div className="card">
      <h3>{patient.fullName}</h3>
      {/* ... */}
    </div>
  );
}

// Après: Memo uniquement si patient change
export const PatientCard = memo(function PatientCard({
  patient
}: {
  patient: Patient
}) {
  return (
    <div className="card">
      <h3>{patient.fullName}</h3>
      {/* ... */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.patient.id === nextProps.patient.id &&
         prevProps.patient.updatedAt === nextProps.patient.updatedAt;
});
```

#### 2.2 Virtualisation des Listes

```typescript
// src/components/VirtualizedPatientList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualizedPatientList({ patients }: { patients: Patient[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: patients.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Hauteur estimée d'une ligne
    overscan: 5 // Précharger 5 items avant/après
  });

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const patient = patients[virtualRow.index];

          return (
            <div
              key={patient.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <PatientCard patient={patient} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Résultat:** Rendre 10,000 patients sans lag (au lieu de 100 max)

#### 2.3 Optimisation Callbacks

```typescript
// Avant: Nouvelle fonction à chaque render
export function PatientList({ patients }: { patients: Patient[] }) {
  return (
    <div>
      {patients.map(patient => (
        <PatientCard
          key={patient.id}
          patient={patient}
          onClick={() => handleClick(patient.id)}
        />
      ))}
    </div>
  );
}

// Après: useCallback + curry
export function PatientList({ patients }: { patients: Patient[] }) {
  const handleClick = useCallback((id: string) => {
    // Logic
  }, []);

  return (
    <div>
      {patients.map(patient => (
        <PatientCard
          key={patient.id}
          patient={patient}
          onClickId={handleClick} // Passe la fonction stable
        />
      ))}
    </div>
  );
}

// Dans PatientCard
export const PatientCard = memo(function PatientCard({
  patient,
  onClickId
}: {
  patient: Patient;
  onClickId: (id: string) => void;
}) {
  const handleClick = useCallback(() => {
    onClickId(patient.id);
  }, [patient.id, onClickId]);

  return (
    <div onClick={handleClick}>
      {/* ... */}
    </div>
  );
});
```

### Phase 3: Optimisation API & Cache (Semaine 3)

#### 3.1 Système de Cache Multi-Niveau

```typescript
// src/infrastructure/cache/CacheManager.ts
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class CacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();

  constructor(private defaultTTL: number = 5 * 60 * 1000) {} // 5 min

  async get<T>(key: string): Promise<T | null> {
    // 1. Memory cache (le plus rapide)
    const memEntry = this.memoryCache.get(key);
    if (memEntry && memEntry.expiresAt > Date.now()) {
      return memEntry.data;
    }

    // 2. IndexedDB (persistant)
    const idbEntry = await this.getFromIndexedDB<T>(key);
    if (idbEntry && idbEntry.expiresAt > Date.now()) {
      // Remettre en memory cache
      this.memoryCache.set(key, idbEntry);
      return idbEntry.data;
    }

    return null;
  }

  async set<T>(
    key: string,
    data: T,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };

    // Memory cache
    this.memoryCache.set(key, entry);

    // IndexedDB (async, pas bloquant)
    this.setInIndexedDB(key, entry).catch(err => {
      logger.warn('Failed to cache in IndexedDB', { key, error: err });
    });
  }

  invalidate(key: string): void {
    this.memoryCache.delete(key);
    this.deleteFromIndexedDB(key);
  }

  invalidatePattern(pattern: RegExp): void {
    for (const key of this.memoryCache.keys()) {
      if (pattern.test(key)) {
        this.invalidate(key);
      }
    }
  }

  private async getFromIndexedDB<T>(key: string): Promise<CacheEntry<T> | null> {
    // Implémentation IndexedDB
    return null; // Simplifié
  }

  private async setInIndexedDB<T>(
    key: string,
    entry: CacheEntry<T>
  ): Promise<void> {
    // Implémentation IndexedDB
  }

  private async deleteFromIndexedDB(key: string): Promise<void> {
    // Implémentation IndexedDB
  }
}

export const cacheManager = new CacheManager();
```

#### 3.2 Hook avec Cache Intégré

```typescript
// src/hooks/useCachedQuery.ts
export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);

      // Try cache first
      if (!force) {
        const cached = await cacheManager.get<T>(key);
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data
      const freshData = await fetcher();
      setData(freshData);

      // Cache it
      await cacheManager.set(key, freshData, options.ttl);
    } catch (err) {
      setError(err as Error);
      logger.error(`Query failed: ${key}`, err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options.ttl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Revalidate on focus
  useEffect(() => {
    if (!options.revalidateOnFocus) return;

    const handleFocus = () => fetchData(true);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData, options.revalidateOnFocus]);

  // Revalidate on reconnect
  useEffect(() => {
    if (!options.revalidateOnReconnect) return;

    const handleOnline = () => fetchData(true);
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchData, options.revalidateOnReconnect]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    invalidate: () => cacheManager.invalidate(key)
  };
}

// Usage
function PatientList() {
  const { data: patients, loading, refetch } = useCachedQuery(
    'patients-list',
    () => patientRepository.findAll(),
    {
      ttl: 5 * 60 * 1000, // 5 min
      revalidateOnFocus: true
    }
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <button onClick={refetch}>Rafraîchir</button>
      <PatientTable patients={patients} />
    </div>
  );
}
```

#### 3.3 Pagination & Infinite Scroll

```typescript
// src/hooks/useInfiniteQuery.ts
export function useInfiniteQuery<T>(
  baseKey: string,
  fetcher: (page: number, pageSize: number) => Promise<T[]>,
  pageSize: number = 20
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const key = `${baseKey}-page-${page}`;

      // Try cache
      let pageData = await cacheManager.get<T[]>(key);

      if (!pageData) {
        // Fetch
        pageData = await fetcher(page, pageSize);
        await cacheManager.set(key, pageData);
      }

      setData(prev => [...prev, ...pageData]);
      setHasMore(pageData.length === pageSize);
      setPage(p => p + 1);
    } catch (error) {
      logger.error('Failed to load more', error as Error);
    } finally {
      setLoading(false);
    }
  }, [baseKey, fetcher, page, pageSize, loading, hasMore]);

  useEffect(() => {
    loadMore();
  }, []); // Load first page

  return { data, loading, hasMore, loadMore };
}

// Usage avec Intersection Observer
function InfinitePatientList() {
  const { data, loading, hasMore, loadMore } = useInfiniteQuery(
    'patients',
    (page, size) => patientRepository.findPaginated(page, size)
  );

  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  return (
    <div>
      {data.map(patient => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
      <div ref={loaderRef} className="h-20 flex items-center justify-center">
        {loading && <LoadingSpinner />}
        {!hasMore && <p>Aucun autre patient</p>}
      </div>
    </div>
  );
}
```

### Phase 4: Optimisation Images & Assets (Semaine 4)

#### 4.1 Images Responsive & Lazy Loading

```typescript
// src/components/OptimizedImage.tsx
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) {
      // Preload
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    }
  }, [src, priority]);

  useEffect(() => {
    if (!imgRef.current || priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const img = imgRef.current;
          if (img && img.dataset.src) {
            img.src = img.dataset.src;
            observer.disconnect();
          }
        }
      },
      { rootMargin: '50px' }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  return (
    <div
      className="relative overflow-hidden bg-gray-100"
      style={{
        width,
        height,
        aspectRatio: `${width} / ${height}`
      }}
    >
      {/* Placeholder blur */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 to-gray-200" />
      )}

      <img
        ref={imgRef}
        src={priority ? src : undefined}
        data-src={priority ? undefined : src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
```

#### 4.2 Web Workers pour Tâches Lourdes

```typescript
// src/workers/invoice.worker.ts
self.addEventListener('message', async (e) => {
  const { type, payload } = e.data;

  if (type === 'GENERATE_PDF') {
    try {
      // Import dynamique dans le worker
      const { jsPDF } = await import('https://cdn.skypack.dev/jspdf@2.5.1');

      const doc = new jsPDF();
      // ... génération PDF lourde

      const pdfBlob = doc.output('blob');

      self.postMessage({
        type: 'PDF_GENERATED',
        payload: pdfBlob
      });
    } catch (error) {
      self.postMessage({
        type: 'PDF_ERROR',
        payload: error.message
      });
    }
  }
});

// src/hooks/useWorker.ts
export function useInvoiceWorker() {
  const workerRef = useRef<Worker>();
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/invoice.worker.ts', import.meta.url),
      { type: 'module' }
    );

    return () => workerRef.current?.terminate();
  }, []);

  const generatePDF = useCallback((invoiceData: Invoice): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      setGenerating(true);

      const handleMessage = (e: MessageEvent) => {
        if (e.data.type === 'PDF_GENERATED') {
          resolve(e.data.payload);
          setGenerating(false);
        } else if (e.data.type === 'PDF_ERROR') {
          reject(new Error(e.data.payload));
          setGenerating(false);
        }

        workerRef.current?.removeEventListener('message', handleMessage);
      };

      workerRef.current.addEventListener('message', handleMessage);
      workerRef.current.postMessage({
        type: 'GENERATE_PDF',
        payload: invoiceData
      });
    });
  }, []);

  return { generatePDF, generating };
}
```

## 📊 Métriques PERFORMANCE - Objectifs

| Métrique | Actuel | Cible | Outil |
|----------|--------|-------|-------|
| Time to Interactive | ~4s | <400ms | Lighthouse |
| First Contentful Paint | ~2s | <1s | Lighthouse |
| Bundle size (gzip) | 179KB | <60KB | Webpack |
| API response time | ~500ms | <50ms | Network tab |
| Memory usage | ~150MB | <50MB | Chrome DevTools |
| Lighthouse Score | ~65 | 95+ | Lighthouse |
| Liste de 1000 items | Lag | Fluide | React Profiler |

---

# 4️⃣ AMÉLIORATION DU DESIGN

## 🔍 Analyse de l'Existant

### Points Forts Actuels
✅ Design cohérent avec palette gold/neutral
✅ Utilisation de Tailwind CSS
✅ Animations Framer Motion
✅ Composants réutilisables

### Points Faibles Identifiés

1. **Hiérarchie Visuelle Faible**
   - Manque de contraste entre niveaux
   - Tailles de police inconsistantes
   - Espacement non systématique

2. **Accessibilité Limitée**
   - Contraste couleurs insuffisant (ratios < 4.5:1)
   - Pas de focus visible consistant
   - Manque de ARIA labels

3. **Responsive Perfectible**
   - Breakpoints incohérents
   - Touch targets < 44px
   - Navigation mobile encombrée

4. **Design System Incomplet**
   - Pas de design tokens centralisés
   - Composants primitifs manquants
   - Documentation absente

## 🎯 Plan d'Action DESIGN

### Phase 1: Design System (Semaines 1-2)

#### 1.1 Design Tokens

```typescript
// src/design-system/tokens.ts
export const tokens = {
  // Colors - Palette étendue avec niveaux
  colors: {
    // Primary (Gold)
    primary: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B', // Base
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },

    // Neutral (Grays)
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },

    // Semantic colors
    success: {
      50: '#ECFDF5',
      500: '#10B981',
      700: '#047857',
    },
    error: {
      50: '#FEF2F2',
      500: '#EF4444',
      700: '#B91C1C',
    },
    warning: {
      50: '#FFFBEB',
      500: '#F59E0B',
      700: '#B45309',
    },
    info: {
      50: '#EFF6FF',
      500: '#3B82F6',
      700: '#1D4ED8',
    },
  },

  // Typography - Scale harmonique
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],      // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
    '5xl': ['3rem', { lineHeight: '1' }],          // 48px
  },

  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Spacing - Scale 4px
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },

  // Borders
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  borderWidth: {
    0: '0',
    DEFAULT: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
  },

  // Shadows - Élévation
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    gold: '0 4px 14px 0 rgb(217 119 6 / 0.39)', // Shadow gold spécial
  },

  // Transitions
  transitionDuration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },

  transitionTimingFunction: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;

// Type-safe token access
export type Tokens = typeof tokens;
export type ColorToken = keyof typeof tokens.colors;
```

#### 1.2 Composants Primitifs (Atomic Design)

**Button Component:**
```typescript
// src/design-system/components/Button.tsx
import { tokens } from '../tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    fullWidth = false,
    children,
    disabled,
    className,
    ...props
  }, ref) {
    const baseStyles = `
      inline-flex items-center justify-center
      font-medium
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variantStyles = {
      primary: `
        bg-gradient-to-r from-primary-500 to-primary-600
        text-white
        hover:from-primary-600 hover:to-primary-700
        focus:ring-primary-500
        shadow-md hover:shadow-lg
      `,
      secondary: `
        bg-neutral-100
        text-neutral-900
        hover:bg-neutral-200
        focus:ring-neutral-500
      `,
      ghost: `
        bg-transparent
        text-neutral-700
        hover:bg-neutral-100
        focus:ring-neutral-500
      `,
      danger: `
        bg-error-500
        text-white
        hover:bg-error-600
        focus:ring-error-500
        shadow-md hover:shadow-lg
      `,
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
      md: 'px-4 py-2 text-base rounded-lg gap-2',
      lg: 'px-6 py-3 text-lg rounded-xl gap-2.5',
    };

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${widthStyles}
          ${className || ''}
        `}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && icon && icon}
        {children}
      </button>
    );
  }
);
```

**Input Component:**
```typescript
// src/design-system/components/Input.tsx
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    fullWidth = true,
    className,
    ...props
  }, ref) {
    const inputId = useId();
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 mb-1.5"
          >
            {label}
            {props.required && (
              <span className="text-error-500 ml-1" aria-label="required">*</span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className={`
              w-full px-4 py-2.5
              ${leftIcon ? 'pl-11' : ''}
              ${rightIcon ? 'pr-11' : ''}
              bg-white
              border rounded-lg
              ${error
                ? 'border-error-500 focus:ring-error-500'
                : 'border-neutral-300 focus:ring-primary-500'
              }
              focus:outline-none focus:ring-2 focus:border-transparent
              transition-all duration-200
              disabled:bg-neutral-100 disabled:cursor-not-allowed
              ${className || ''}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            className="mt-1.5 text-sm text-error-600"
            role="alert"
          >
            {error}
          </p>
        )}

        {hint && !error && (
          <p
            id={hintId}
            className="mt-1.5 text-sm text-neutral-500"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);
```

### Phase 2: Accessibilité (Semaine 3)

#### 2.1 Focus Management

```typescript
// src/design-system/utils/focus.ts
export function useFocusTrap(active: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus premier élément
    firstElement.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab);

    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  }, [active]);

  return containerRef;
}

// Usage dans Modal
export function Modal({ isOpen, onClose, children }: ModalProps) {
  const containerRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    // Sauvegarder le focus actuel
    const previousFocus = document.activeElement as HTMLElement;

    // Empêcher scroll body
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      previousFocus?.focus(); // Restaurer focus
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-modal"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      <div
        ref={containerRef}
        className="fixed inset-0 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
```

#### 2.2 Screen Reader Support

```typescript
// src/design-system/components/VisuallyHidden.tsx
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

// Usage
<button>
  <TrashIcon />
  <VisuallyHidden>Supprimer le patient</VisuallyHidden>
</button>

// src/design-system/hooks/useAnnouncement.ts
export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState('');

  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement(''); // Reset pour forcer re-announcement
    setTimeout(() => setAnnouncement(message), 100);
  }, []);

  return {
    announce,
    AnnouncementRegion: () => (
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    )
  };
}

// Usage
function PatientList() {
  const { announce, AnnouncementRegion } = useAnnouncement();

  const handleDelete = async (id: string) => {
    await deletePatient(id);
    announce('Patient supprimé avec succès');
  };

  return (
    <>
      <AnnouncementRegion />
      {/* ... liste */}
    </>
  );
}
```

### Phase 3: Responsive & Mobile (Semaine 4)

#### 3.1 Breakpoints Cohérents

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'xs': '475px',   // Petits mobiles
      'sm': '640px',   // Mobiles
      'md': '768px',   // Tablettes portrait
      'lg': '1024px',  // Tablettes paysage / petits desktops
      'xl': '1280px',  // Desktops
      '2xl': '1536px', // Grands écrans
    },
  },
};

// src/design-system/hooks/useBreakpoint.ts
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<string>('xl');

  useEffect(() => {
    const getBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 475) return 'xs';
      if (width < 640) return 'sm';
      if (width < 768) return 'md';
      if (width < 1024) return 'lg';
      if (width < 1280) return 'xl';
      return '2xl';
    };

    const handleResize = () => {
      setBreakpoint(getBreakpoint());
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
  };
}
```

#### 3.2 Touch Targets & Gestures

```typescript
// src/design-system/components/TouchTarget.tsx
export function TouchTarget({ children, onTap, className }: {
  children: React.ReactNode;
  onTap?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      className={`min-w-[44px] min-h-[44px] flex items-center justify-center ${className}`}
      whileTap={{ scale: 0.95 }}
      onTap={onTap}
    >
      {children}
    </motion.div>
  );
}

// src/design-system/hooks/useSwipe.ts
export function useSwipe(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold: number = 50
) {
  const startX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX.current;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (diff < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}
```

## 📊 Métriques DESIGN - Objectifs

| Métrique | Actuel | Cible | Outil |
|----------|--------|-------|-------|
| Lighthouse Accessibility | ~75 | 95+ | Lighthouse |
| Color contrast ratio | ~3:1 | 4.5:1+ | axe DevTools |
| Touch targets | ~35px | 44px+ | Manual |
| Responsive breakpoints | Inconsistent | Systématique | DevTools |
| Focus indicators | Partial | 100% | Keyboard nav |
| ARIA coverage | ~40% | 95%+ | axe DevTools |
| Design consistency | ~60% | 95%+ | Visual review |

---

# 5️⃣ AMÉLIORATION DE LA PRATICITÉ

## 🔍 Analyse de l'Existant

### Points Forts Actuels
✅ Raccourcis clavier dans dashboard
✅ Actions rapides disponibles
✅ Recherche de patients

### Points Faibles Identifiés

1. **Manque de Feedback**
   - Actions silencieuses
   - Pas de confirmations visuelles
   - États de chargement inconsistants

2. **Workflows Complexes**
   - Trop d'étapes pour actions simples
   - Formulaires longs
   - Navigation confuse

3. **Fonctionnalités Manquantes**
   - Undo/Redo
   - Drag & drop
   - Recherche globale avancée
   - Exports batch

4. **Onboarding Absent**
   - Pas de guide pour nouveaux utilisateurs
   - Fonctionnalités cachées
   - Pas de tooltips contextuels

## 🎯 Plan d'Action PRATICITÉ

### Phase 1: Feedback Utilisateur (Semaine 1)

#### 1.1 Toast Notifications Améliorées

```typescript
// src/design-system/components/Toast.tsx
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ToastContainer() {
  const { toasts, removeToast } = useToasts();

  return (
    <div className="fixed bottom-4 right-4 z-tooltip space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`
              flex items-start gap-3 p-4 rounded-xl shadow-xl
              bg-white border-l-4 min-w-[320px] max-w-md
              ${toast.type === 'success' && 'border-success-500'}
              ${toast.type === 'error' && 'border-error-500'}
              ${toast.type === 'warning' && 'border-warning-500'}
              ${toast.type === 'info' && 'border-info-500'}
            `}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-success-500" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-error-500" />}
              {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-warning-500" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-info-500" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-neutral-900">
                {toast.title}
              </p>
              {toast.message && (
                <p className="mt-1 text-sm text-neutral-600">
                  {toast.message}
                </p>
              )}
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action!.onClick();
                    removeToast(toast.id);
                  }}
                  className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  {toast.action.label}
                </button>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Context
export function useToasts() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToasts must be used within ToastProvider');

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    context.addToast({ ...toast, id });

    // Auto-dismiss
    const duration = toast.duration || 5000;
    setTimeout(() => {
      context.removeToast(id);
    }, duration);

    return id;
  }, [context]);

  return {
    toasts: context.toasts,
    showSuccess: (title: string, message?: string) =>
      showToast({ type: 'success', title, message }),
    showError: (title: string, message?: string) =>
      showToast({ type: 'error', title, message }),
    showWarning: (title: string, message?: string) =>
      showToast({ type: 'warning', title, message }),
    showInfo: (title: string, message?: string) =>
      showToast({ type: 'info', title, message }),
    removeToast: context.removeToast,
  };
}

// Usage
function PatientList() {
  const { showSuccess, showError } = useToasts();

  const handleDelete = async (id: string) => {
    try {
      await deletePatient(id);
      showSuccess(
        'Patient supprimé',
        'Le patient a été supprimé avec succès.'
      );
    } catch (error) {
      showError(
        'Erreur',
        'Impossible de supprimer le patient. Réessayez.'
      );
    }
  };

  return (/* ... */);
}
```

#### 1.2 Loading States Consistants

```typescript
// src/design-system/components/Skeleton.tsx
export function Skeleton({
  width,
  height = '1rem',
  className
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 bg-[length:200%_100%] ${className}`}
      style={{ width, height }}
    />
  );
}

export function PatientCardSkeleton() {
  return (
    <div className="p-4 border border-neutral-200 rounded-lg space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton width="48px" height="48px" className="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height="1rem" />
          <Skeleton width="40%" height="0.875rem" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton width="100%" height="0.75rem" />
        <Skeleton width="80%" height="0.75rem" />
      </div>
    </div>
  );
}

// Usage
function PatientList() {
  const { data: patients, loading } = usePatients();

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <PatientCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (/* ... */);
}
```

### Phase 2: Workflows Optimisés (Semaine 2)

#### 2.1 Multi-Step Forms avec Progress

```typescript
// src/design-system/components/Stepper.tsx
export interface Step {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export function Stepper({
  steps,
  currentStep
}: {
  steps: Step[];
  currentStep: number;
}) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <li
              key={step.id}
              className={`
                flex items-center
                ${index !== steps.length - 1 && 'flex-1'}
              `}
            >
              {/* Step circle */}
              <div
                className={`
                  relative flex items-center justify-center
                  w-10 h-10 rounded-full border-2
                  ${isComplete && 'bg-success-500 border-success-500'}
                  ${isCurrent && 'border-primary-500 bg-white'}
                  ${isUpcoming && 'border-neutral-300 bg-white'}
                `}
              >
                {isComplete ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : (
                  <span className={`
                    text-sm font-semibold
                    ${isCurrent && 'text-primary-600'}
                    ${isUpcoming && 'text-neutral-400'}
                  `}>
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Label */}
              <div className="ml-3">
                <p className={`
                  text-sm font-medium
                  ${isCurrent && 'text-neutral-900'}
                  ${!isCurrent && 'text-neutral-500'}
                `}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-neutral-400">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Connector */}
              {index !== steps.length - 1 && (
                <div className={`
                  flex-1 h-0.5 mx-4
                  ${isComplete ? 'bg-success-500' : 'bg-neutral-300'}
                `} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Multi-step form hook
export function useMultiStepForm<T>(
  steps: Step[],
  initialData: T,
  onComplete: (data: T) => Promise<void>
) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<T>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateData = useCallback((partial: Partial<T>) => {
    setData(prev => ({ ...prev, ...partial }));
  }, []);

  const next = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps.length]);

  const prev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const submit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onComplete(data);
    } finally {
      setIsSubmitting(false);
    }
  }, [data, onComplete]);

  return {
    currentStep,
    data,
    updateData,
    next,
    prev,
    submit,
    isSubmitting,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    progress: ((currentStep + 1) / steps.length) * 100,
  };
}

// Usage
function CreatePatientWizard() {
  const steps: Step[] = [
    { id: 'info', label: 'Informations', description: 'Nom, email, téléphone' },
    { id: 'address', label: 'Adresse', description: 'Adresse complète' },
    { id: 'medical', label: 'Historique', description: 'Historique médical' },
    { id: 'confirm', label: 'Confirmation', description: 'Vérification finale' },
  ];

  const form = useMultiStepForm(
    steps,
    {
      fullName: '',
      email: '',
      phone: '',
      address: {},
      medicalHistory: '',
    },
    async (data) => {
      await createPatient(data);
      showSuccess('Patient créé avec succès!');
      onClose();
    }
  );

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Stepper steps={steps} currentStep={form.currentStep} />

      {/* Form content */}
      <div className="min-h-[300px]">
        {form.currentStep === 0 && <StepInfo form={form} />}
        {form.currentStep === 1 && <StepAddress form={form} />}
        {form.currentStep === 2 && <StepMedical form={form} />}
        {form.currentStep === 3 && <StepConfirm form={form} />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={form.prev}
          disabled={form.isFirstStep}
        >
          Précédent
        </Button>

        {form.isLastStep ? (
          <Button
            onClick={form.submit}
            loading={form.isSubmitting}
          >
            Créer le patient
          </Button>
        ) : (
          <Button onClick={form.next}>
            Suivant
          </Button>
        )}
      </div>
    </div>
  );
}
```

#### 2.2 Undo/Redo System

```typescript
// src/infrastructure/undo/UndoManager.ts
export interface UndoableAction<T = any> {
  type: string;
  execute: () => Promise<T>;
  undo: () => Promise<void>;
  redo?: () => Promise<void>;
  description: string;
}

export class UndoManager {
  private undoStack: UndoableAction[] = [];
  private redoStack: UndoableAction[] = [];
  private maxStackSize = 50;

  async execute(action: UndoableAction): Promise<void> {
    await action.execute();

    this.undoStack.push(action);
    this.redoStack = []; // Clear redo stack

    // Limit stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }

    logger.info(`Action executed: ${action.description}`, {
      type: action.type,
      undoStackSize: this.undoStack.length
    });
  }

  async undo(): Promise<void> {
    const action = this.undoStack.pop();
    if (!action) return;

    await action.undo();
    this.redoStack.push(action);

    logger.info(`Action undone: ${action.description}`, {
      type: action.type
    });
  }

  async redo(): Promise<void> {
    const action = this.redoStack.pop();
    if (!action) return;

    const redoFn = action.redo || action.execute;
    await redoFn();
    this.undoStack.push(action);

    logger.info(`Action redone: ${action.description}`, {
      type: action.type
    });
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  getLastAction(): UndoableAction | undefined {
    return this.undoStack[this.undoStack.length - 1];
  }
}

export const undoManager = new UndoManager();

// Hook
export function useUndo() {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const { showSuccess } = useToasts();

  useEffect(() => {
    const interval = setInterval(() => {
      setCanUndo(undoManager.canUndo());
      setCanRedo(undoManager.canRedo());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const undo = useCallback(async () => {
    const action = undoManager.getLastAction();
    if (!action) return;

    await undoManager.undo();
    showSuccess(
      'Action annulée',
      action.description,
      {
        action: {
          label: 'Refaire',
          onClick: async () => {
            await undoManager.redo();
          }
        }
      }
    );
  }, [showSuccess]);

  const redo = useCallback(async () => {
    await undoManager.redo();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return { undo, redo, canUndo, canRedo };
}

// Usage - Delete patient avec undo
async function deletePatientWithUndo(patientId: string) {
  let deletedPatient: Patient | null = null;

  await undoManager.execute({
    type: 'DELETE_PATIENT',
    description: 'Suppression du patient',
    execute: async () => {
      deletedPatient = await patientRepository.findById(patientId);
      await patientRepository.delete(patientId);
    },
    undo: async () => {
      if (deletedPatient) {
        await patientRepository.save(deletedPatient);
      }
    }
  });
}
```

### Phase 3: Onboarding & Guidance (Semaine 3)

#### 3.1 Product Tour

```typescript
// src/design-system/components/ProductTour.tsx
import Joyride, { CallBackProps, Step, STATUS } from 'react-joyride';

const tourSteps: Step[] = [
  {
    target: '[data-tour="quick-actions"]',
    content: 'Accédez rapidement aux actions fréquentes depuis ce panneau.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="search"]',
    content: 'Recherchez rapidement un patient en tapant son nom ou email.',
  },
  {
    target: '[data-tour="calendar"]',
    content: 'Le calendrier intelligent propose automatiquement les meilleurs créneaux.',
  },
  {
    target: '[data-tour="shortcuts"]',
    content: 'Utilisez les raccourcis clavier pour gagner du temps. Appuyez sur ? pour voir la liste.',
  },
];

export function ProductTour() {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Vérifier si premier visit
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setTimeout(() => setRun(true), 1000);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      localStorage.setItem('hasSeenTour', 'true');
    }

    setStepIndex(index);
  };

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: tokens.colors.primary[600],
          zIndex: 10000,
        },
      }}
      locale={{
        back: 'Précédent',
        close: 'Fermer',
        last: 'Terminer',
        next: 'Suivant',
        skip: 'Passer',
      }}
    />
  );
}
```

#### 3.2 Contextual Help & Tooltips

```typescript
// src/design-system/components/Tooltip.tsx
export function Tooltip({
  children,
  content,
  placement = 'top'
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  // Position calculation
  const getTooltipStyle = (): React.CSSProperties => {
    if (!triggerRef.current || !tooltipRef.current) return {};

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    const positions = {
      top: {
        left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
        top: triggerRect.top - tooltipRect.height - 8,
      },
      bottom: {
        left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
        top: triggerRect.bottom + 8,
      },
      left: {
        left: triggerRect.left - tooltipRect.width - 8,
        top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
      },
      right: {
        left: triggerRect.right + 8,
        top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
      },
    };

    return positions[placement];
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>

      {isVisible && (
        <Portal>
          <div
            ref={tooltipRef}
            role="tooltip"
            className="fixed z-tooltip px-3 py-2 text-sm text-white bg-neutral-900 rounded-lg shadow-lg pointer-events-none"
            style={getTooltipStyle()}
          >
            {content}
          </div>
        </Portal>
      )}
    </>
  );
}

// Usage
<Tooltip content="Créer un nouveau patient">
  <Button icon={<Plus />} />
</Tooltip>
```

### Phase 4: Fonctionnalités Avancées (Semaine 4)

#### 4.1 Drag & Drop

```typescript
// src/design-system/hooks/useDragAndDrop.ts
import { useDndMonitor, DndContext } from '@dnd-kit/core';

export function useDragAndDrop<T>({
  items,
  onReorder,
}: {
  items: T[];
  onReorder: (items: T[]) => void;
}) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item: any) => item.id === active.id);
    const newIndex = items.findIndex((item: any) => item.id === over.id);

    const newItems = arrayMove(items, oldIndex, newIndex);
    onReorder(newItems);
  };

  return { handleDragEnd };
}

// Usage - Calendar drag appointments
function Calendar() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const { handleDragEnd } = useDragAndDrop({
    items: appointments,
    onReorder: async (newAppointments) => {
      setAppointments(newAppointments);
      // Save new order
      await saveAppointmentOrder(newAppointments);
    },
  });

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {appointments.map((apt) => (
        <DraggableAppointment key={apt.id} appointment={apt} />
      ))}
    </DndContext>
  );
}
```

#### 4.2 Recherche Globale (Command Palette)

```typescript
// src/components/CommandPalette.tsx
import { Command } from 'cmdk';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Ctrl+K to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input
        placeholder="Rechercher..."
        value={search}
        onValueChange={setSearch}
      />

      <Command.List>
        <Command.Empty>Aucun résultat trouvé.</Command.Empty>

        <Command.Group heading="Patients">
          <Command.Item onSelect={() => navigate('/patients/create')}>
            <Plus className="mr-2" />
            Créer un patient
          </Command.Item>
          <Command.Item onSelect={() => navigate('/patients')}>
            <Users className="mr-2" />
            Liste des patients
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Rendez-vous">
          <Command.Item onSelect={() => navigate('/appointments/create')}>
            <Calendar className="mr-2" />
            Nouveau rendez-vous
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Paramètres">
          <Command.Item onSelect={() => navigate('/settings')}>
            <Settings className="mr-2" />
            Paramètres
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
```

## 📊 Métriques PRATICITÉ - Objectifs

| Métrique | Actuel | Cible | Outil |
|----------|--------|-------|-------|
| Task Success Rate | ~70% | 95%+ | User testing |
| Time on Task | Élevé | -50% | Analytics |
| Error Rate | ~10% | <2% | Error tracking |
| User Satisfaction (NPS) | 35 | 70+ | Surveys |
| Feature Discovery | ~40% | 80%+ | Analytics |
| Return Rate | ~60% | 85%+ | Analytics |
| Support Tickets | ~50/mois | <10/mois | Support system |

---

# 📅 FEUILLE DE ROUTE GLOBALE

## Timeline 16 Semaines (4 Mois)

### Mois 1: Fondations
**Semaines 1-2:** Code - Architecture & Tests
**Semaines 3-4:** Fiabilité - Logging & Monitoring

### Mois 2: Performance & Sécurité
**Semaines 5-6:** Performance - Optimisation Bundle & Rendu
**Semaines 7-8:** Fiabilité - Validation & Sécurité

### Mois 3: Design & UX
**Semaines 9-10:** Design - Design System & Composants
**Semaines 11-12:** Design - Accessibilité & Responsive

### Mois 4: Praticité & Polish
**Semaines 13-14:** Praticité - Workflows & Feedback
**Semaines 15-16:** Praticité - Onboarding & Features Avancées

---

## 🎯 Checklist de Validation 10x

### Code ✅
- [ ] Couverture tests ≥ 80%
- [ ] Complexité cyclomatique < 10
- [ ] 0 warning TypeScript
- [ ] Architecture modulaire implémentée
- [ ] 0 utilisation de `any`
- [ ] Code review systématique

### Fiabilité ✅
- [ ] Uptime ≥ 99.9%
- [ ] MTTR < 15 minutes
- [ ] Taux d'erreur < 0.1%
- [ ] Monitoring temps réel actif
- [ ] Sentry configuré et monitored
- [ ] Tests E2E passent à 100%

### Performance ✅
- [ ] TTI < 400ms
- [ ] Bundle < 200KB
- [ ] Lighthouse score ≥ 95
- [ ] API response < 50ms
- [ ] Memory usage < 50MB
- [ ] 10,000+ items rendering fluide

### Design ✅
- [ ] Lighthouse Accessibility ≥ 95
- [ ] Contrast ratios ≥ 4.5:1
- [ ] Touch targets ≥ 44px
- [ ] Focus indicators 100%
- [ ] ARIA coverage ≥ 95%
- [ ] Design System complet documenté

### Praticité ✅
- [ ] Task Success Rate ≥ 95%
- [ ] NPS ≥ 70
- [ ] Error Rate < 2%
- [ ] Feature Discovery ≥ 80%
- [ ] Support tickets < 10/mois
- [ ] Onboarding flow implémenté

---

## 💰 ROI Attendu

### Gains Mesurables

| Aspect | Avant | Après | Gain |
|--------|-------|-------|------|
| **Temps dev (bugs)** | 40h/mois | 8h/mois | -80% |
| **Downtime** | 36h/an | 8.7h/an | -76% |
| **Support tickets** | 50/mois | 10/mois | -80% |
| **Onboarding time** | 4 semaines | 1 semaine | -75% |
| **User productivity** | Baseline | +150% | +150% |
| **Revenue potential** | Baseline | +200%+ | +200% |

### Bénéfices Qualitatifs

✅ **Maintenabilité:** Code 10x plus maintenable
✅ **Scalabilité:** Peut supporter 100x plus d'utilisateurs
✅ **Confiance:** Système fiable et prévisible
✅ **Réputation:** Product de classe mondiale
✅ **Équipe:** Développeurs plus productifs et satisfaits
✅ **Utilisateurs:** Expérience exceptionnelle

---

## 🚀 Prochaines Étapes Immédiates

### Cette Semaine
1. Approuver la stratégie et la feuille de route
2. Prioriser les domaines critiques (suggéré: Code + Fiabilité d'abord)
3. Configurer les outils de mesure (Jest, Sentry, Lighthouse CI)
4. Créer le backlog détaillé pour Mois 1

### Ce Mois
1. Implémenter l'architecture modulaire
2. Atteindre 50% couverture tests
3. Configurer monitoring complet
4. Premiers gains de performance (bundle splitting)

### Ce Trimestre
1. Compléter refactoring code
2. Atteindre 99% uptime
3. Bundle < 300KB (étape intermédiaire)
4. Design System V1 déployé

---

**Ce plan transformera ChiroFlow en un produit de classe mondiale, 10x meilleur dans tous les aspects critiques.**

La clé du succès: **exécution disciplinée, mesure constante, itération rapide.**

🎯 **Objectif final:** Un logiciel dont vous serez extrêmement fier, que vos utilisateurs adorent, et qui scale sans limites.
