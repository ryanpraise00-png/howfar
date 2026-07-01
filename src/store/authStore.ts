import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logoutRemote, completeProfile } from '@/src/services/auth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthProfile {
  // Server-assigned fields (set after verifyOtp)
  userId: string | null;
  // Local display fields (persisted via Zustand)
  phone: string;
  countryCode: string;
  displayName: string;
  about: string;
  avatarUri: string | null;
  language: 'en' | 'fr' | 'pidgin';
  isOnboardingComplete: boolean;
}

interface AuthActions {
  setPhone: (phone: string, countryCode: string) => void;
  setUserId: (id: string) => void;
  setProfile: (name: string, about: string, avatarUri: string | null) => void;
  setLanguage: (lang: AuthProfile['language']) => void;
  /** Called after OTP verify — saves userId and marks user as seen before */
  onVerified: (userId: string, name: string, about: string, isNewUser: boolean) => void;
  /** Calls /complete-profile, then marks onboarding done */
  completeOnboarding: (name: string, about: string) => Promise<void>;
  clearAuth: () => Promise<void>;
}

type AuthState = AuthProfile & AuthActions;

const defaults: AuthProfile = {
  userId: null,
  phone: '',
  countryCode: '+234',
  displayName: '',
  about: '',
  avatarUri: null,
  language: 'en',
  isOnboardingComplete: false,
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...defaults,

      setPhone: (phone, countryCode) => set({ phone, countryCode }),

      setUserId: (userId) => set({ userId }),

      setProfile: (displayName, about, avatarUri) =>
        set({ displayName, about, avatarUri }),

      setLanguage: (language) => set({ language }),

      onVerified: (userId, name, about, isNewUser) => {
        set({
          userId,
          displayName: name,
          about,
          // If returning user with a name already set, mark onboarding done
          isOnboardingComplete: !isNewUser && name.length > 0,
        });
      },

      completeOnboarding: async (name, about) => {
        // Persist to backend
        await completeProfile(name, about);
        set({ displayName: name, about, isOnboardingComplete: true });
      },

      clearAuth: async () => {
        await logoutRemote();
        set({ ...defaults });
      },
    }),
    {
      name: 'howfar-auth',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist transient fields
      partialize: (s) => ({
        userId: s.userId,
        phone: s.phone,
        countryCode: s.countryCode,
        displayName: s.displayName,
        about: s.about,
        avatarUri: s.avatarUri,
        language: s.language,
        isOnboardingComplete: s.isOnboardingComplete,
      }),
    }
  )
);
