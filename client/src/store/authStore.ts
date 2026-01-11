// FILE: client/src/store/authStore.ts
import { create } from 'zustand';
import api from '../lib/axios';

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'HR';
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Upgrade: login now returns the User object or throws
  login: (credentials: any) => Promise<User>; 
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
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
    // 1. Call API
    const { data } = await api.post('/auth/login', credentials);
    
    // 2. Validate Response
    if (!data.success || !data.user) {
      throw new Error(data.message || 'Login failed: Invalid server response');
    }

    // 3. Update State
    set({ user: data.user, isAuthenticated: true });

    // 4. Return User (Critical for preventing race conditions in UI)
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
  }
}));