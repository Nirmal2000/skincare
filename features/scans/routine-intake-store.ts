import { useEffect, useState } from "react";

import { storage } from "@/features/storage/async-storage";

const STORAGE_KEY = "facefit:routine-intake";

export type RoutineIntakeAnswers = {
  sensitivity: "low" | "medium" | "high" | "unsure";
  pregnancy: "yes" | "no" | "prefer_not_to_say";
  rxTopical: "yes" | "no" | "unsure";
  allergies: string[];
  fitzpatrick: "I-II" | "III-IV" | "V-VI" | "unsure";
  currentActives: string[];
};

type RoutineIntakeState = {
  answers: RoutineIntakeAnswers;
  completed: boolean;
};

const DEFAULT_ANSWERS: RoutineIntakeAnswers = {
  sensitivity: "medium",
  pregnancy: "prefer_not_to_say",
  rxTopical: "unsure",
  allergies: ["none"],
  fitzpatrick: "unsure",
  currentActives: ["none"],
};

const DEFAULT_STATE: RoutineIntakeState = {
  answers: DEFAULT_ANSWERS,
  completed: false,
};

type Listener = (state: RoutineIntakeState) => void;

class RoutineIntakeStore {
  private state: RoutineIntakeState = DEFAULT_STATE;
  private listeners = new Set<Listener>();
  private hydrated = false;

  async hydrate() {
    if (this.hydrated) return;
    const saved = await storage.getJSON<RoutineIntakeState>(STORAGE_KEY);
    this.state = saved
      ? { ...DEFAULT_STATE, ...saved, answers: { ...DEFAULT_ANSWERS, ...saved.answers } }
      : DEFAULT_STATE;
    this.hydrated = true;
    this.emit();
  }

  getState() {
    return this.state;
  }

  async update(patch: Partial<RoutineIntakeState>) {
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

const store = new RoutineIntakeStore();

export function useRoutineIntake() {
  const [state, setState] = useState(store.getState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    store.hydrate().then(() => {
      if (!mounted) return;
      setState(store.getState());
      setReady(true);
    });
    const unsubscribe = store.subscribe((next) => {
      if (mounted) setState(next);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { intake: state.answers, completed: state.completed, ready };
}

export async function saveRoutineIntake(answers: RoutineIntakeAnswers) {
  await store.update({ answers, completed: true });
}

export function getRoutineIntake() {
  return store.getState();
}
