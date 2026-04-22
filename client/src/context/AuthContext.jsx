import { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nc_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  // FIX: saveUser is now exposed in context value so GoogleLoginButton
  // (and any other component) can call it directly instead of writing
  // to localStorage manually — which bypassed setUser() and required a refresh.
  const saveUser = useCallback((userData, token) => {
    localStorage.setItem('nc_token', token);
    localStorage.setItem('nc_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const register = async (data) => {
    setLoading(true);
    try {
      const res = await authAPI.register(data);
      saveUser(res.data.user, res.data.token);
      toast.success(`Welcome, ${res.data.user.name}! 🎉`);
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
      return { success: false };
    } finally { setLoading(false); }
  };

  const login = async (data) => {
    setLoading(true);
    try {
      const res = await authAPI.login(data);
      saveUser(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name}! 👋`);
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
      return { success: false };
    } finally { setLoading(false); }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('nc_token');
    localStorage.removeItem('nc_user');
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const updateProfile = async (data) => {
    try {
      const res = await authAPI.updateProfile(data);
      const updated = { ...user, ...res.data.user };
      localStorage.setItem('nc_user', JSON.stringify(updated));
      setUser(updated);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      register,
      login,
      logout,
      updateProfile,
      saveUser,           // ← exposed so Google login can use it
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
