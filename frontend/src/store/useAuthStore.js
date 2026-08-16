import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('hms_user')) || null,
  accessToken: localStorage.getItem('hms_access_token') || null,
  refreshToken: localStorage.getItem('hms_refresh_token') || null,
  isLoading: false,
  error: null,

  setCredentials: (accessToken, refreshToken) => {
    localStorage.setItem('hms_access_token', accessToken);
    localStorage.setItem('hms_refresh_token', refreshToken);
    set({ accessToken, refreshToken });
  },

  setUser: (user) => {
    localStorage.setItem('hms_user', JSON.stringify(user));
    set({ user });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { accessToken, refreshToken, user } = response.data;

      localStorage.setItem('hms_access_token', accessToken);
      localStorage.setItem('hms_refresh_token', refreshToken);
      localStorage.setItem('hms_user', JSON.stringify(user));

      set({
        accessToken,
        refreshToken,
        user,
        isLoading: false,
        error: null,
      });
      return user;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      set({ isLoading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/register`, payload);
      const { accessToken, refreshToken, user } = response.data;

      localStorage.setItem('hms_access_token', accessToken);
      localStorage.setItem('hms_refresh_token', refreshToken);
      localStorage.setItem('hms_user', JSON.stringify(user));

      set({
        accessToken,
        refreshToken,
        user,
        isLoading: false,
        error: null,
      });
      return user;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Please check your details.';
      set({ isLoading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  logout: () => {
    localStorage.removeItem('hms_access_token');
    localStorage.removeItem('hms_refresh_token');
    localStorage.removeItem('hms_user');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
    });
  },

  initialize: async () => {
    const accessToken = localStorage.getItem('hms_access_token');
    const refreshToken = localStorage.getItem('hms_refresh_token');
    
    if (accessToken && refreshToken) {
      set({ accessToken, refreshToken, isLoading: true });
      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const { user } = response.data;
        localStorage.setItem('hms_user', JSON.stringify(user));
        set({ user, isLoading: false });
      } catch (err) {
        // Access token expired, attempt silent refresh
        try {
          const refreshRes = await axios.post(`${API_URL}/auth/refresh`, { token: refreshToken });
          const { accessToken: newAccess, refreshToken: newRefresh } = refreshRes.data;
          
          localStorage.setItem('hms_access_token', newAccess);
          localStorage.setItem('hms_refresh_token', newRefresh);
          
          const userRes = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${newAccess}` },
          });
          
          const { user } = userRes.data;
          localStorage.setItem('hms_user', JSON.stringify(user));
          
          set({
            accessToken: newAccess,
            refreshToken: newRefresh,
            user,
            isLoading: false,
          });
        } catch (refreshErr) {
          get().logout();
        }
      }
    } else {
      get().logout();
    }
  },
}));
