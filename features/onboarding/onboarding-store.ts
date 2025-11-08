import { useEffect, useState } from "react";

import { storage } from "@/features/storage/async-storage";
import { setOnboardingState as setSettingsOnboarding } from "@/features/settings/settings-store";

const STORAGE_KEY = "facefit:onboarding";

export type OnboardingState = {
  completed: boolean;
  consentGranted: boolean;
  ageBand: string | null;
};

const DEFAULT_STATE: OnboardingState = {
  completed: false,
  consentGranted: false,
  ageBand: null,
};

type Listener = (state: OnboardingState) => void;

class OnboardingStore {
  private state: OnboardingState = DEFAULT_STATE;
  private listeners = new Set<Listener>();
  private hydrated = false;

  async hydrate() {
    if (this.hydrated) {
      return;
    }
    const saved = await storage.getJSON<OnboardingState>(STORAGE_KEY);
    this.state = saved ? { ...DEFAULT_STATE, ...saved } : DEFAULT_STATE;
    this.hydrated = true;
    this.emit();
  }

  getState() {
    return this.state;
  }

  async update(patch: Partial<OnboardingState>) {
    this.state = { ...this.state, ...patch };
    await storage.setJSON(STORAGE_KEY, this.state);
    this.emit();
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

const store = new OnboardingStore();

export function useOnboarding() {
  const [state, setState] = useState(store.getState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    store.hydrate().then(() => {
      if (!mounted) {
        return;
      }
      setState(store.getState());
      setReady(true);
    });

    const unsubscribe = store.subscribe((next) => {
      if (mounted) {
        setState(next);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { onboarding: state, ready };
}

export async function completeOnboarding({
  ageBand,
  consentGranted,
}: {
  ageBand: string;
  consentGranted: boolean;
}) {
  await store.update({
    completed: true,
    consentGranted,
    ageBand,
  });

  await setSettingsOnboarding({
    completed: true,
    consentGranted,
    ageBand,
  });
}

export async function resetOnboarding() {
  await store.update(DEFAULT_STATE);
  await storage.remove(STORAGE_KEY);
  await setSettingsOnboarding({
    completed: false,
    consentGranted: false,
    ageBand: null,
  });
}
