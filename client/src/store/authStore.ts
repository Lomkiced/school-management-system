// FILE: client/src/store/authStore.ts
// 2026 Standard: Type-safe auth store with centralized types
import { create } from 'zustand';
import api from '../lib/axios';
import type { User, UserRole } from '../types';

// Re-export User type for convenience
export type { User };

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Login and return user object. Throws on failure. */
  login: (credentials: { email: string; password: string }) => Promise<User>;
  /** Logout and clear all auth state */
  logout: () => Promise<void>;
  /** Initialize auth state from server (check if session is valid) */
  initialize: () => Promise<void>;
  /** Update user data in store */
  setUser: (user: User | null) => void;
  /** Check if user has any of the specified roles */
  hasRole: (...roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.success && data.user) {
        set({ user: data.user, isAuthenticated: true });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);

    if (!data.success || !data.user) {
      throw new Error(data.message || 'Login failed: Invalid server response');
    }

    set({ user: data.user, isAuthenticated: true, isLoading: false });
    return data.user;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn("Logout endpoint failed, clearing client state anyway");
    } finally {
      set({ user: null, isAuthenticated: false });
      localStorage.clear();
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: user !== null });
  },

  hasRole: (...roles) => {
    const user = get().user;
    if (!user) return false;
    return roles.includes(user.role);
  }
}));