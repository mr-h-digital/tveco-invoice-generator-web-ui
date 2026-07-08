import { create } from 'zustand';
import { TOUR_STEPS } from '../constants/onboardingTour';

interface OnboardingState {
  userEmail: string | null;
  welcomeOpen: boolean;
  tutorialMode: boolean;
  tourActive: boolean;
  tourStepIndex: number;
  hasSeenWelcome: boolean;
  hasCompletedTour: boolean;
  initialize: (email: string | null) => void;
  openWelcome: () => void;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  skipTour: () => void;
  replayTour: () => void;
  setTutorialMode: (enabled: boolean) => void;
}

interface PersistedOnboardingState {
  hasSeenWelcome: boolean;
  hasCompletedTour: boolean;
  tutorialMode: boolean;
}

const defaultPersistedState: PersistedOnboardingState = {
  hasSeenWelcome: false,
  hasCompletedTour: false,
  tutorialMode: false,
};

function storageKey(email: string) {
  return `tveco_onboarding_${email.toLowerCase()}`;
}

function loadPersisted(email: string): PersistedOnboardingState {
  try {
    const raw = localStorage.getItem(storageKey(email));
    if (!raw) return defaultPersistedState;
    const parsed = JSON.parse(raw) as Partial<PersistedOnboardingState>;
    return {
      hasSeenWelcome: !!parsed.hasSeenWelcome,
      hasCompletedTour: !!parsed.hasCompletedTour,
      tutorialMode: !!parsed.tutorialMode,
    };
  } catch {
    return defaultPersistedState;
  }
}

function savePersisted(email: string, state: PersistedOnboardingState) {
  localStorage.setItem(storageKey(email), JSON.stringify(state));
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  userEmail: null,
  welcomeOpen: false,
  tutorialMode: false,
  tourActive: false,
  tourStepIndex: 0,
  hasSeenWelcome: false,
  hasCompletedTour: false,

  initialize: (email) => {
    if (!email) {
      set({
        userEmail: null,
        welcomeOpen: false,
        tutorialMode: false,
        tourActive: false,
        tourStepIndex: 0,
        hasSeenWelcome: false,
        hasCompletedTour: false,
      });
      return;
    }

    const persisted = loadPersisted(email);
    set({
      userEmail: email,
      welcomeOpen: !persisted.hasSeenWelcome,
      tutorialMode: persisted.tutorialMode,
      tourActive: false,
      tourStepIndex: 0,
      hasSeenWelcome: persisted.hasSeenWelcome,
      hasCompletedTour: persisted.hasCompletedTour,
    });
  },

  openWelcome: () => {
    set({ welcomeOpen: true });
  },

  startTour: () => {
    const email = get().userEmail;
    if (!email) return;

    savePersisted(email, {
      hasSeenWelcome: true,
      hasCompletedTour: false,
      tutorialMode: get().tutorialMode,
    });

    set({
      welcomeOpen: false,
      hasSeenWelcome: true,
      hasCompletedTour: false,
      tourActive: true,
      tourStepIndex: 0,
    });
  },

  nextTourStep: () => {
    const email = get().userEmail;
    if (!email) return;

    const nextIndex = get().tourStepIndex + 1;
    if (nextIndex >= TOUR_STEPS.length) {
      savePersisted(email, {
        hasSeenWelcome: true,
        hasCompletedTour: true,
        tutorialMode: get().tutorialMode,
      });

      set({
        tourActive: false,
        tourStepIndex: 0,
        hasSeenWelcome: true,
        hasCompletedTour: true,
      });
      return;
    }

    set({ tourStepIndex: nextIndex });
  },

  prevTourStep: () => {
    const current = get().tourStepIndex;
    if (current <= 0) return;
    set({ tourStepIndex: current - 1 });
  },

  skipTour: () => {
    const email = get().userEmail;
    if (!email) return;

    savePersisted(email, {
      hasSeenWelcome: true,
      hasCompletedTour: false,
      tutorialMode: get().tutorialMode,
    });

    set({
      welcomeOpen: false,
      hasSeenWelcome: true,
      tourActive: false,
      tourStepIndex: 0,
    });
  },

  replayTour: () => {
    const email = get().userEmail;
    if (!email) return;

    savePersisted(email, {
      hasSeenWelcome: true,
      hasCompletedTour: get().hasCompletedTour,
      tutorialMode: get().tutorialMode,
    });

    set({
      welcomeOpen: false,
      hasSeenWelcome: true,
      tourActive: true,
      tourStepIndex: 0,
    });
  },

  setTutorialMode: (enabled) => {
    const email = get().userEmail;
    if (email) {
      savePersisted(email, {
        hasSeenWelcome: get().hasSeenWelcome,
        hasCompletedTour: get().hasCompletedTour,
        tutorialMode: enabled,
      });
    }
    set({ tutorialMode: enabled });
  },
}));
