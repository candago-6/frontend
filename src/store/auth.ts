import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { User } from "@/types";

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "auth-storage",
      // sessionStorage é isolado por aba. Com localStorage (o padrão), entrar
      // com outra conta numa segunda aba sobrescrevia o token da primeira e
      // derrubava aquela sessão; aqui cada aba mantém a sua.
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

/**
 * `false` até o estado persistido da aba ser lido. O primeiro render no cliente
 * precisa bater com o do servidor (onde não existe sessionStorage), então quem
 * protege rota espera este flag antes de decidir por um redirect — caso
 * contrário todo reload jogaria o usuário logado de volta para o /login.
 */
export function useAuthHydrated() {
  return useSyncExternalStore(
    (onStoreChange) => useAuthStore.persist.onFinishHydration(onStoreChange),
    () => useAuthStore.persist.hasHydrated(),
    () => false
  );
}
