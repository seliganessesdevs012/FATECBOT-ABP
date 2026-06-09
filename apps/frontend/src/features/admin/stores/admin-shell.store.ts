import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AdminShellState = {
  isSidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;
  setMobileMenuOpen: (value: boolean) => void;
  toggleMobileMenu: () => void;
};

export const useAdminShellStore = create<AdminShellState>()(
  persist(
    set => ({
      isSidebarCollapsed: true,
      mobileMenuOpen: false,
      setSidebarCollapsed: value => set({ isSidebarCollapsed: value }),
      toggleSidebar: () =>
        set(state => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setMobileMenuOpen: value => set({ mobileMenuOpen: value }),
      toggleMobileMenu: () => set(state => ({ mobileMenuOpen: !state.mobileMenuOpen })),
    }),
    {
      name: "fatecbot:admin-shell",
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => localStorage)
          : undefined,
      // A MÁGICA ACONTECE AQUI: 
      // Ignora o mobileMenuOpen e salva apenas o estado da barra lateral!
      partialize: (state) => ({ isSidebarCollapsed: state.isSidebarCollapsed }),
    },
  ),
);