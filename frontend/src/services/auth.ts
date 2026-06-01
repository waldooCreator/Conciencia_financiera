import { appStateService, LocalProfile } from './appState';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

function profileToUser(profile: LocalProfile | null): User | null {
  if (!profile) return null;
  return {
    id: 1,
    email: profile.email || 'local@finanzas.app',
    first_name: profile.name,
    last_name: '',
    date_joined: new Date().toISOString(),
  };
}

export const authService = {
  /** Local app: always "authenticated" once onboarding is done. */
  async isAuthenticated(): Promise<boolean> {
    return appStateService.isOnboardingComplete();
  },

  async getUser(): Promise<User | null> {
    const profile = await appStateService.getProfile();
    if (profile) return profileToUser(profile);
    const onboarded = await appStateService.isOnboardingComplete();
    if (onboarded) {
      return {
        id: 1,
        email: 'local@finanzas.app',
        first_name: 'Usuario',
        last_name: '',
        date_joined: new Date().toISOString(),
      };
    }
    return null;
  },

  async setProfile(name: string, email?: string): Promise<void> {
    await appStateService.setProfile({ name, email });
  },

  async logout(): Promise<void> {
    await appStateService.resetApp();
  },
};
