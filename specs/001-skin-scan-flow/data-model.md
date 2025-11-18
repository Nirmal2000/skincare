# Phase 1: Data Model

**Date**: 2025-11-18
**Feature**: Skin Scan Flow
**Purpose**: Define all entities, relationships, state schemas, and storage patterns

---

## Entity Definitions

### 1. AuthSession

**Purpose**: Tracks authenticated user session from Supabase OAuth

**Storage**: Supabase SDK (AsyncStorage) + Zustand store

**Schema**:
```typescript
interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp
  user: {
    id: string;
    email: string;
    user_metadata: {
      avatar_url?: string;
      full_name?: string;
      provider: 'google' | 'apple';
    };
  };
}
```

**Lifecycle**:
- Created: On successful OAuth redirect
- Updated: On token refresh (handled by Supabase SDK)
- Deleted: On sign-out
- Persisted: Yes (Supabase SDK handles via AsyncStorage)

**Validation**:
- `access_token` must be non-empty string
- `expires_at` must be future timestamp
- `user.id` must be UUID format

---

### 2. OnboardingAnswerSet

**Purpose**: Stores user's answers to 5-question onboarding flow

**Storage**: Zustand store with AsyncStorage persistence

**Schema**:
```typescript
interface OnboardingAnswerSet {
  age: number; // From age picker
  skinType: 'Oily' | 'Dry' | 'Combination' | 'Normal' | 'Sensitive';
  concerns: Array<'Acne' | 'Dark spots' | 'Wrinkles' | 'Redness' | 'Dryness' | 'Oiliness'>;
  routine: 'Yes, consistent' | 'Yes, sometimes' | 'No';
  goals: string; // Free-text input
  completed: boolean; // True when all 5 questions answered
  completedAt: string | null; // ISO timestamp when flow finished
  version: number; // Schema version for future migrations
}
```

**Lifecycle**:
- Created: On first app launch (empty state)
- Updated: After each question answered
- Deleted: On "Restart onboarding" from settings
- Persisted: Yes (AsyncStorage via Zustand persist middleware)

**Validation**:
- `age` must be 13-120
- `concerns` must have at least 1 item
- `goals` must be non-empty string
- `completed` set to true only when all fields valid

**State Transitions**:
```
Empty → Partial (questions 1-4) → Complete (question 5 + completed=true)
                                      ↓
                                   Restart → Empty
```

---

### 3. ScanRun

**Purpose**: Represents a single face scan analysis with photo and results

**Storage**: Zustand store with AsyncStorage persistence

**Schema**:
```typescript
interface ScanRun {
  id: string; // UUID v4
  userId: string; // Supabase user ID
  photoUri: string; // Local file URI from camera
  taskId: string | null; // Backend task ID from /start-task
  status: ScanRunStatus;
  result: UpgradedFaceAnalysisResult | null; // From backend
  routineIntake: RoutineIntake | null; // User's routine questionnaire
  routine: RoutinePlan | null; // From backend /recommend
  error: string | null; // Error message if failed
  createdAt: string; // ISO timestamp when photo captured
  updatedAt: string; // ISO timestamp of last update
  completedAt: string | null; // ISO timestamp when analysis finished
}

type ScanRunStatus =
  | 'captured'        // Photo taken, not yet uploaded
  | 'uploading'       // Sending to /start-task
  | 'queued'          // Backend received, awaiting processing
  | 'processing'      // Backend analyzing
  | 'completed'       // Analysis done, result available
  | 'routine_pending' // User filled intake, routine generating
  | 'routine_ready'   // Routine generated
  | 'failed';         // Analysis or upload failed

// Backend response types (from frontend_integration.md)
interface UpgradedFaceAnalysisResult {
  global_profile: GlobalProfile;
  issues: IssuesCollection;
}

interface GlobalProfile {
  skin_type: {
    label: 'dry' | 'oily' | 'combination' | 'normal' | 'unknown';
    confidence: number; // 0-1
  };
  skin_tone: {
    lightness: 'very_light' | 'light' | 'medium' | 'tan' | 'brown' | 'dark';
    undertone: 'yellow' | 'neutral' | 'red' | 'olive' | 'unknown';
  };
  skin_age: {
    estimated_age: number;
    relative_to_real_age: 'younger' | 'similar' | 'older' | 'unknown';
  };
  scores: {
    overall: number; // 0-100
    wrinkles: number;
    dark_circles: number;
    oily_shine: number;
    pores: number;
    blackheads: number;
    acne: number;
    sensitivity_redness: number;
    pigmentation: number;
    hydration: number;
    roughness: number;
  };
  summary_description: string;
}

interface IssuesCollection {
  oily_shine: IssueItem[];
  dryness_dehydration: IssueItem[];
  enlarged_pores_texture: IssueItem[];
  blackheads: IssueItem[];
  acne_active: IssueItem[];
  acne_scars_post_inflammatory: IssueItem[];
  pigmentation_brown_spots: IssueItem[];
  freckles: IssueItem[];
  melasma_like_patches: IssueItem[];
  redness_sensitivity: IssueItem[];
  wrinkles_and_fine_lines: IssueItem[];
  eye_bags: IssueItem[];
  dark_circles: IssueItem[];
  moles_or_nevi: IssueItem[];
}

interface IssueItem {
  region: string; // Face region identifier
  intensity: number; // 0-1
  area: number; // 1-10 scale
  description: string;
}

interface RoutineIntake {
  sensitivity?: 'low' | 'medium' | 'high' | 'unsure';
  pregnancy?: 'yes' | 'no' | 'prefer_not_to_say';
  rx_topical?: 'yes' | 'no' | 'unsure';
  allergies?: string[];
  fitzpatrick?: 'I-II' | 'III-IV' | 'V-VI' | 'unsure';
  current_actives?: string[];
  country?: string | null;
  budget_preference?: 'budget' | 'mid' | 'premium' | 'no_pref';
}

interface RoutinePlan {
  routine: {
    am: RoutineStep[];
    midday?: RoutineStep[];
    pm: RoutineStep[];
  };
  reasons: {
    prioritized_concerns: Array<{
      key: string;
      severity: string;
      why: string;
    }>;
    notes: string;
  };
  warnings: string[];
  lifestyle: {
    sleep: string;
    stress: string;
    sun: string;
    habits: string;
    routine_hygiene: string;
    diet: {
      increase: string[];
      limit: string[];
      supplements: string[];
    };
  };
}

interface RoutineStep {
  type: 'cleanser' | 'active' | 'moisturizer' | 'sunscreen' | 'refresh' | 'other';
  instructions: {
    how: string;
    frequency: string;
    timing: string;
  };
  products: Array<{
    id?: string;
    brand: string;
    name: string;
    tier: 'budget' | 'mid' | 'premium';
    url: string;
    why: string;
  }>;
}
```

**Lifecycle**:
- Created: When user captures photo in scan screen
- Updated: Throughout analysis polling (status changes)
- Deleted: User deletes from history OR on sign-out (optional)
- Persisted: Yes (AsyncStorage via Zustand)

**Validation**:
- `id` must be UUID
- `photoUri` must start with `file://`
- `status` must be valid enum value
- `result` required when status is 'completed' or beyond
- `routine` required when status is 'routine_ready'

**State Transitions**:
```
captured → uploading → queued → processing → completed
                                               ↓
                                         routine_pending → routine_ready
                                               ↓
                                            failed
```

**Indexing**:
- Primary key: `id`
- Sort by: `createdAt` (descending) for history list
- Filter by: `userId` (for multi-user support if added)

---

### 4. UserSettings

**Purpose**: User preferences and app configuration

**Storage**: Zustand store with AsyncStorage persistence

**Schema**:
```typescript
interface UserSettings {
  notificationsEnabled: boolean; // Push notifications (future)
  darkMode: 'auto' | 'light' | 'dark'; // Theme preference
  language: string; // ISO language code (future i18n)
  privacyMode: boolean; // Hide sensitive data in screenshots (future)
  lastSeenVersion: string; // App version for changelog detection
  createdAt: string; // ISO timestamp of account creation
}
```

**Lifecycle**:
- Created: On first app launch with defaults
- Updated: When user changes settings
- Deleted: On account deletion OR sign-out (user preference)
- Persisted: Yes (AsyncStorage via Zustand)

**Validation**:
- `darkMode` must be valid enum
- `language` must match ISO 639-1 code

---

## Relationships

```
AuthSession (1) ──< (N) ScanRun
   │
   │ (1:1)
   └─ OnboardingAnswerSet
   │
   │ (1:1)
   └─ UserSettings

ScanRun references:
  - OnboardingAnswerSet.age → used in backend /start-task real_age param
  - AuthSession.access_token → used in all API calls
```

**Notes**:
- No foreign key enforcement (local-only storage)
- `userId` in ScanRun matches `AuthSession.user.id` for filtering
- OnboardingAnswerSet is global (not per-run) but referenced in scan context

---

## Zustand Store Architecture

### Auth Store
**File**: `features/auth/stores/auth-store.ts`

```typescript
interface AuthStore {
  session: AuthSession | null;
  isLoading: boolean;

  // Actions
  setSession: (session: AuthSession | null) => void;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      session: null,
      isLoading: false,

      setSession: (session) => set({ session }),

      signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null });
        // Clear other stores
        useOnboardingStore.getState().reset();
        useScanStore.getState().clearAll();
      },

      refreshSession: async () => {
        const { data } = await supabase.auth.refreshSession();
        if (data.session) {
          set({ session: data.session });
        }
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ session: state.session }),
    }
  )
);
```

---

### Onboarding Store
**File**: `features/onboarding/stores/onboarding-store.ts`

```typescript
interface OnboardingStore extends OnboardingAnswerSet {
  // Actions
  setAnswer: <K extends keyof OnboardingAnswerSet>(
    key: K,
    value: OnboardingAnswerSet[K]
  ) => void;
  markComplete: () => void;
  reset: () => void;
}

const defaultState: OnboardingAnswerSet = {
  age: 25,
  skinType: 'Normal',
  concerns: [],
  routine: 'No',
  goals: '',
  completed: false,
  completedAt: null,
  version: 1,
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      ...defaultState,

      setAnswer: (key, value) => set({ [key]: value }),

      markComplete: () => set({
        completed: true,
        completedAt: new Date().toISOString()
      }),

      reset: () => set(defaultState),
    }),
    {
      name: 'onboarding-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

---

### Scan Store
**File**: `features/scans/stores/scan-store.ts`

```typescript
interface ScanStore {
  runs: ScanRun[];
  currentRunId: string | null;

  // Selectors
  getCurrentRun: () => ScanRun | undefined;
  getRunById: (id: string) => ScanRun | undefined;
  getRecentRuns: (limit: number) => ScanRun[];

  // Actions
  createRun: (photoUri: string) => string; // Returns run ID
  updateRun: (id: string, updates: Partial<ScanRun>) => void;
  deleteRun: (id: string) => void;
  clearAll: () => void;

  // Async actions
  uploadRun: (id: string) => Promise<void>;
  pollRunStatus: (id: string) => Promise<void>;
  submitRoutineIntake: (id: string, intake: RoutineIntake) => Promise<void>;
}

export const useScanStore = create<ScanStore>()(
  persist(
    (set, get) => ({
      runs: [],
      currentRunId: null,

      getCurrentRun: () => {
        const { runs, currentRunId } = get();
        return runs.find(r => r.id === currentRunId);
      },

      getRunById: (id) => {
        return get().runs.find(r => r.id === id);
      },

      getRecentRuns: (limit) => {
        return get().runs
          .sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, limit);
      },

      createRun: (photoUri) => {
        const session = useAuthStore.getState().session;
        if (!session) throw new Error('No active session');

        const run: ScanRun = {
          id: `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          photoUri,
          taskId: null,
          status: 'captured',
          result: null,
          routineIntake: null,
          routine: null,
          error: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null,
        };

        set(state => ({
          runs: [run, ...state.runs],
          currentRunId: run.id,
        }));

        return run.id;
      },

      updateRun: (id, updates) => {
        set(state => ({
          runs: state.runs.map(run =>
            run.id === id
              ? { ...run, ...updates, updatedAt: new Date().toISOString() }
              : run
          ),
        }));
      },

      deleteRun: (id) => {
        set(state => ({
          runs: state.runs.filter(r => r.id !== id),
          currentRunId: state.currentRunId === id ? null : state.currentRunId,
        }));
      },

      clearAll: () => set({ runs: [], currentRunId: null }),

      // Async actions (implementation in Phase 2)
      uploadRun: async (id) => {
        // See research.md Section 4 for implementation
      },

      pollRunStatus: async (id) => {
        // Polls /tasks/{taskId} until completed
      },

      submitRoutineIntake: async (id, intake) => {
        // Calls /recommend endpoint
      },
    }),
    {
      name: 'scan-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

---

### Settings Store
**File**: `features/settings/stores/settings-store.ts`

```typescript
interface SettingsStore extends UserSettings {
  // Actions
  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => void;
  reset: () => void;
}

const defaultSettings: UserSettings = {
  notificationsEnabled: false,
  darkMode: 'auto',
  language: 'en',
  privacyMode: false,
  lastSeenVersion: '1.0.0',
  createdAt: new Date().toISOString(),
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      updateSetting: (key, value) => set({ [key]: value }),

      reset: () => set(defaultSettings),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

---

## Data Flow Diagrams

### Scan Flow
```
[Camera Screen]
      │
      │ User captures photo
      ↓
  createRun(photoUri) → ScanRun { status: 'captured' }
      │
      │ Navigate to Result Screen
      ↓
  uploadRun(runId)
      │
      ├─ updateRun({ status: 'uploading' })
      ├─ POST /start-task → { task_id }
      ├─ updateRun({ taskId, status: 'queued' })
      │
      ↓
  pollRunStatus(runId) [every 1.5s]
      │
      ├─ GET /tasks/{taskId} → { status, result }
      ├─ updateRun({ status: backend_status })
      │
      └─ When status = 'completed'
          ├─ updateRun({ result, status: 'completed', completedAt })
          └─ Show result UI
              │
              │ User fills routine intake form
              ↓
          submitRoutineIntake(runId, intake)
              │
              ├─ updateRun({ routineIntake, status: 'routine_pending' })
              ├─ POST /recommend → { task_id }
              │
              ↓
          pollRunStatus(runId) [continue polling]
              │
              └─ When routine_json !== null
                  ├─ updateRun({ routine, status: 'routine_ready' })
                  └─ Show routine UI
```

### Auth Flow
```
[Sign-in Screen]
      │
      │ User taps "Sign in with Google"
      ↓
  signInWithGoogle()
      │
      ├─ supabase.auth.signInWithOAuth({ provider: 'google' })
      ├─ expo-web-browser opens OAuth flow
      │
      ↓
  [OAuth Provider]
      │
      │ User authenticates
      ↓
  Redirect: facefit://auth?access_token=...&refresh_token=...
      │
      ↓
  [app/_layout.tsx useEffect]
      │
      ├─ handleSupabaseRedirect(url)
      ├─ supabase.auth.setSession({ access_token, refresh_token })
      │
      ↓
  useAuthStore.setSession(session)
      │
      │ Check onboarding completion
      ↓
  router.replace(
    onboardingComplete ? '/(tabs)' : '/(onboarding)/welcome'
  )
```

### Onboarding Flow
```
[Welcome Screen - Question 1]
      │
      │ User selects age
      ↓
  useOnboardingStore.setAnswer('age', 25)
      │
      │ Swipe to next question
      ↓
[Question 2] → setAnswer('skinType', 'Oily')
      │
[Question 3] → setAnswer('concerns', ['Acne'])
      │
[Question 4] → setAnswer('routine', 'No')
      │
[Question 5] → setAnswer('goals', 'Clear skin')
      │
      │ User taps "Get Started"
      ↓
  useOnboardingStore.markComplete()
      │
      ├─ Set { completed: true, completedAt }
      │
      ↓
  router.replace('/(tabs)')
```

---

## Storage Estimates

**Per Entity**:
- AuthSession: ~1 KB (token + user metadata)
- OnboardingAnswerSet: ~500 bytes
- ScanRun (without result): ~1 KB
- ScanRun (with result): ~5-10 KB (depends on issues array size)
- ScanRun (with routine): +10-20 KB (product arrays)
- UserSettings: ~200 bytes

**Typical User Storage** (after 10 scans):
- Auth: 1 KB
- Onboarding: 0.5 KB
- 10 ScanRuns with results + routines: 10 × 25 KB = 250 KB
- Settings: 0.2 KB
- **Total**: ~252 KB

**AsyncStorage Limits**:
- iOS: 6 MB default (can be increased)
- Android: 6 MB default
- **Headroom**: 252 KB / 6 MB = 4.2% usage for 10 scans

**Cleanup Strategy**:
- Keep last 50 runs maximum (auto-delete oldest when creating 51st)
- User can manually delete from history
- Full cleanup on sign-out (optional, ask user)

---

## Schema Versioning

**Version Field**: `OnboardingAnswerSet.version`, `ScanRun.version` (future)

**Migration Strategy** (if needed in future):
```typescript
// Example migration from v1 to v2
function migrateOnboardingV1toV2(data: any): OnboardingAnswerSet {
  if (data.version === 1) {
    return {
      ...data,
      // Add new field with default
      newField: 'default_value',
      version: 2,
    };
  }
  return data;
}
```

Apply migrations on store hydration via Zustand `onRehydrateStorage` callback.

---

## Summary

**Total Entities**: 4 (AuthSession, OnboardingAnswerSet, ScanRun, UserSettings)

**Storage**: All local via AsyncStorage, no remote database (auth is Supabase-managed)

**State Management**: Zustand with persist middleware for all entities

**Key Relationships**:
- AuthSession → ScanRuns (via userId filter)
- OnboardingAnswerSet → ScanRuns (age passed to API)
- No cascading deletes (manual cleanup)

**Phase 1 Complete** ✅
Ready to proceed to API contract generation.
