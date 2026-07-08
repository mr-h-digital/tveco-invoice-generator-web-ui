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
  lastTourStepIndex: number;
  initialize: (email: string | null) => void;
  openWelcome: () => void;
  startTour: () => void;
  resumeTour: () => void;
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
  lastTourStepIndex: number;
}

const defaultPersistedState: PersistedOnboardingState = {
  hasSeenWelcome: false,
  hasCompletedTour: false,
  tutorialMode: false,
  lastTourStepIndex: 0,
};

function clampStepIndex(index: number) {
  return Math.min(Math.max(index, 0), Math.max(TOUR_STEPS.length - 1, 0));
}

function storageKey(email: string) {
  return `tveco_onboarding_${email.toLowerCase()}`;
}

function loadPersisted(email: string): PersistedOnboardingState {
  try {
    const raw = localStorage.getItem(storageKey(email));
    if (!raw) return defaultPersistedState;
    const parsed = JSON.parse(raw) as Partial<PersistedOnboardingState>;
    const rawIndex = typeof parsed.lastTourStepIndex === 'number' ? parsed.lastTourStepIndex : 0;
    return {
      hasSeenWelcome: !!parsed.hasSeenWelcome,
      hasCompletedTour: !!parsed.hasCompletedTour,
      tutorialMode: !!parsed.tutorialMode,
      lastTourStepIndex: clampStepIndex(rawIndex),
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
  lastTourStepIndex: 0,

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
        lastTourStepIndex: 0,
      });
      return;
    }

    const persisted = loadPersisted(email);
    const showWelcomePrompt = !persisted.hasSeenWelcome || (!persisted.hasCompletedTour && persisted.lastTourStepIndex > 0);
    set({
      userEmail: email,
      welcomeOpen: showWelcomePrompt,
      tutorialMode: persisted.tutorialMode,
      tourActive: false,
      tourStepIndex: persisted.lastTourStepIndex,
      hasSeenWelcome: persisted.hasSeenWelcome,
      hasCompletedTour: persisted.hasCompletedTour,
      lastTourStepIndex: persisted.lastTourStepIndex,
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
      lastTourStepIndex: 0,
    });

    set({
      welcomeOpen: false,
      hasSeenWelcome: true,
      hasCompletedTour: false,
      tourActive: true,
      tourStepIndex: 0,
      lastTourStepIndex: 0,
    });
  },

  resumeTour: () => {
    const email = get().userEmail;
    if (!email) return;

    const resumeAt = clampStepIndex(get().lastTourStepIndex);

    savePersisted(email, {
      hasSeenWelcome: true,
      hasCompletedTour: false,
      tutorialMode: get().tutorialMode,
      lastTourStepIndex: resumeAt,
    });

    set({
      welcomeOpen: false,
      hasSeenWelcome: true,
      hasCompletedTour: false,
      tourActive: true,
      tourStepIndex: resumeAt,
      lastTourStepIndex: resumeAt,
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
        lastTourStepIndex: 0,
      });

      set({
        tourActive: false,
        tourStepIndex: 0,
        hasSeenWelcome: true,
        hasCompletedTour: true,
        lastTourStepIndex: 0,
      });
      return;
    }

    savePersisted(email, {
      hasSeenWelcome: true,
      hasCompletedTour: false,
      tutorialMode: get().tutorialMode,
      lastTourStepIndex: nextIndex,
    });

    set({
      tourStepIndex: nextIndex,
      lastTourStepIndex: nextIndex,
    });
  },

  prevTourStep: () => {
    const email = get().userEmail;
    const current = get().tourStepIndex;
    const prevIndex = current - 1;
    if (prevIndex < 0) return;

    if (email) {
      savePersisted(email, {
        hasSeenWelcome: true,
        hasCompletedTour: false,
        tutorialMode: get().tutorialMode,
        lastTourStepIndex: prevIndex,
      });
    }

    set({
      tourStepIndex: prevIndex,
      lastTourStepIndex: prevIndex,
    });
  },

  skipTour: () => {
    const email = get().userEmail;
    if (!email) return;

    const persistedStep = get().tourActive ? get().tourStepIndex : get().lastTourStepIndex;
    const resumeAt = clampStepIndex(persistedStep);

    savePersisted(email, {
      hasSeenWelcome: true,
      hasCompletedTour: false,
      tutorialMode: get().tutorialMode,
      lastTourStepIndex: resumeAt,
    });

    set({
      welcomeOpen: false,
      hasSeenWelcome: true,
      tourActive: false,
      tourStepIndex: resumeAt,
      lastTourStepIndex: resumeAt,
    });
  },

  replayTour: () => {
    const email = get().userEmail;
    if (!email) return;

    savePersisted(email, {
      hasSeenWelcome: true,
      hasCompletedTour: false,
      tutorialMode: get().tutorialMode,
      lastTourStepIndex: 0,
    });

    set({
      welcomeOpen: false,
      hasSeenWelcome: true,
      tourActive: true,
      tourStepIndex: 0,
      hasCompletedTour: false,
      lastTourStepIndex: 0,
    });
  },

  setTutorialMode: (enabled) => {
    const email = get().userEmail;
    if (email) {
      savePersisted(email, {
        hasSeenWelcome: get().hasSeenWelcome,
        hasCompletedTour: get().hasCompletedTour,
        tutorialMode: enabled,
        lastTourStepIndex: get().lastTourStepIndex,
      });
    }
    set({ tutorialMode: enabled });
  },
}));
