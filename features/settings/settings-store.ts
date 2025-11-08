import { useEffect, useState } from "react";

import { storage } from "@/features/storage/async-storage";

const STORAGE_KEY = "facefit:settings";

export type Settings = {
  onboardingComplete: boolean;
  consentGranted: boolean;
  ageBand: string | null;
  autoDeleteDays: number;
};

const DEFAULT_SETTINGS: Settings = {
  onboardingComplete: false,
  consentGranted: false,
  ageBand: null,
  autoDeleteDays: 30,
};

type Listener = (settings: Settings) => void;

class SettingsStore {
  private state: Settings = DEFAULT_SETTINGS;
  private listeners = new Set<Listener>();
  private hydrated = false;

  async hydrate() {
    if (this.hydrated) {
      return;
    }

    const saved = await storage.getJSON<Settings>(STORAGE_KEY);
    this.state = saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;
    this.hydrated = true;
    this.emit();
  }

  getState() {
    return this.state;
  }

  async update(patch: Partial<Settings>) {
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

const store = new SettingsStore();

export function useSettings() {
  const [settings, setSettings] = useState(store.getState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    store.hydrate().then(() => {
      if (!mounted) {
        return;
      }

      setSettings(store.getState());
      setReady(true);
    });

    const unsubscribe = store.subscribe((next) => {
      if (mounted) {
        setSettings(next);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { settings, ready };
}

export const settingsStore = {
  hydrate: () => store.hydrate(),
  update: (patch: Partial<Settings>) => store.update(patch),
  getState: () => store.getState(),
};

export async function setOnboardingState(args: {
  completed: boolean;
  consentGranted: boolean;
  ageBand: string | null;
}) {
  await store.update({
    onboardingComplete: args.completed,
    consentGranted: args.consentGranted,
    ageBand: args.ageBand,
  });
}

export async function setAutoDeleteDays(days: number) {
  await store.update({ autoDeleteDays: days });
}
