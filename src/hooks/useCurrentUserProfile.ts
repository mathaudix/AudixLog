import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import type { UserProfile } from '../types';
import { subscribeProfile } from '../services/profileRepository';

const ProfileContext = createContext<UserProfile | null>(null);
export function ProfileProvider({ profile, children }: { profile: UserProfile; children: ReactNode }) {
  return createElement(ProfileContext.Provider, { value: profile }, children);
}
export function useProfile(): UserProfile {
  const profile = useContext(ProfileContext);
  if (!profile) throw new Error('Perfil do usuário indisponível');
  return profile;
}
export function useCurrentUserProfile(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    if (!user) { setProfile(null); setLoading(false); setError(null); return; }
    setLoading(true);
    return subscribeProfile(user.uid, value => { setProfile(value); setLoading(false); setError(null); }, reason => { setError(reason); setLoading(false); });
  }, [user]);
  return { profile, loading, error, authorized: Boolean(profile?.ativo) };
}
