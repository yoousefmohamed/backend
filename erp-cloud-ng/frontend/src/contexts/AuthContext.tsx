'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { joinCompanyRoom } from '@/lib/socket';

interface User {
  id: string;
  fullName: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
  roleCode?: string;
  branch?: string;
  company?: string;
}

interface AuthContextValue {
  user: User | null;
  companyId: string | null;
  loading: boolean;
  login: (companyId: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('accessToken');
    const storedUser = Cookies.get('user');
    const storedCompanyId = Cookies.get('companyId');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      setCompanyId(storedCompanyId || null);
      if (storedCompanyId) joinCompanyRoom(storedCompanyId);
    }
    setLoading(false);
  }, []);

  async function login(companyIdInput: string, username: string, password: string) {
    const { data } = await api.post('/auth/login', { companyId: companyIdInput, username, password });

    Cookies.set('accessToken', data.accessToken, { expires: 1 });
    Cookies.set('refreshToken', data.refreshToken, { expires: 7 });
    Cookies.set('user', JSON.stringify(data.user), { expires: 7 });
    Cookies.set('companyId', companyIdInput, { expires: 7 });

    setUser(data.user);
    setCompanyId(companyIdInput);
    joinCompanyRoom(companyIdInput);
    router.push('/dashboard');
  }

  function logout() {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('user');
    Cookies.remove('companyId');
    setUser(null);
    setCompanyId(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ user, companyId, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
