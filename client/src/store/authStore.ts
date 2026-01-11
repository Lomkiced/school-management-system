// FILE: client/src/store/authStore.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import api from '../lib/axios'; // Ensure you have this import to set headers

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  initialize: () => void; // <--- ADDED THIS DEFINITION
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        console.log("🔐 Store: Logging in user", user.role);
        // Set the default Authorization header for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        console.log("🔒 Store: Logging out");
        // Remove the header
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('school-auth-storage');
      },

      // === CRITICAL FIX: ADDED INITIALIZE FUNCTION ===
      initialize: () => {
        const state = get();
        if (state.token) {
          console.log("🔄 Store: Restoring Session");
          // Re-attach the token to Axios so requests work after refresh
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      }
    }),
    {
      name: 'school-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);