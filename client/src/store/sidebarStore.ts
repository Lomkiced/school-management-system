// FILE: client/src/store/sidebarStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isExpanded: boolean;
  toggle: () => void;
  setExpanded: (value: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isExpanded: true, // Default to Open on Desktop
      toggle: () => set((state) => ({ isExpanded: !state.isExpanded })),
      setExpanded: (value) => set({ isExpanded: value }),
    }),
    {
      name: 'sidebar-storage', // Save preference to LocalStorage
    }
  )
);