'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserRoleTipo } from '@/types/database';

interface UserContextValue {
  userId: string | null;
  email: string | null;
  nome: string | null;
  role: UserRoleTipo | null;
  loading: boolean;
}

const UserContext = createContext<UserContextValue>({
  userId: null,
  email: null,
  nome: null,
  role: null,
  loading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<UserContextValue>({
    userId: null,
    email: null,
    nome: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setValue({ userId: null, email: null, nome: null, role: null, loading: false });
        return;
      }

      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role, nome')
        .eq('user_id', user.id)
        .single();

      setValue({
        userId: user.id,
        email: user.email ?? null,
        nome: roleRow?.nome ?? null,
        role: (roleRow?.role as UserRoleTipo) ?? null,
        loading: false,
      });
    }

    load();
  }, []);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
