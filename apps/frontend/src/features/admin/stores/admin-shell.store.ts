import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AdminShellState = {
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;
};

export const useAdminShellStore = create<AdminShellState>()(
  persist(
    set => ({
      isSidebarCollapsed: true,
      setSidebarCollapsed: value => set({ isSidebarCollapsed: value }),
      toggleSidebar: () =>
        set(state => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    }),
    {
      name: "fatecbot:admin-shell",
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => localStorage)
          : undefined,
    },
  ),
);
