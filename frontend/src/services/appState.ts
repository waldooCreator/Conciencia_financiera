import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@onboarding_complete';
const PROFILE_KEY = '@user_profile';

export interface LocalProfile {
  name: string;
  email?: string;
}

export const appStateService = {
  async isOnboardingComplete(): Promise<boolean> {
    const val = await AsyncStorage.getItem(ONBOARDING_KEY);
    return val === 'true';
  },

  async setOnboardingComplete(): Promise<void> {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  },

  async resetApp(): Promise<void> {
    await AsyncStorage.multiRemove([ONBOARDING_KEY, PROFILE_KEY]);
  },

  async getProfile(): Promise<LocalProfile | null> {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  async setProfile(profile: LocalProfile): Promise<void> {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  },
};
