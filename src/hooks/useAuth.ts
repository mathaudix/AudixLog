import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { resetPassword, signIn, signOut, subscribeAuth } from '../services/auth';
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => subscribeAuth(value => { setUser(value); setLoading(false); }), []);
  return { user, loading, login: signIn, logout: signOut, resetPassword };
}
