import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Axios global configuration
  axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('/auth/me');
        setUser(response.data.data);
      } catch (error) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token, user, requiresActivation, requiresPasswordChange } = response.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      toast.success('Login successful!');
      return { user, requiresActivation, requiresPasswordChange };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      toast.success('Registration successful!');
      return user;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axios.get('/auth/logout');
    } catch (error) {
      // Proceed with client-side logout even if the server call fails.
    }

    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const updateProfile = async (userData) => {
    try {
      const response = await axios.put('/auth/updatedetails', userData);
      setUser(response.data.data);
      toast.success('Profile updated successfully');
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Update failed');
      throw error;
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      await axios.put('/auth/updatepassword', {
        currentPassword,
        newPassword
      });
      toast.success('Password updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Password update failed');
      throw error;
    }
  };

  const forgotPassword = async (email) => {
    try {
      await axios.post('/auth/forgotpassword', { email });
      toast.success('Password reset email sent');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send reset email');
      throw error;
    }
  };

  const resetPassword = async (token, password) => {
    try {
      await axios.put(`/auth/resetpassword/${token}`, { password });
      toast.success('Password reset successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Password reset failed');
      throw error;
    }
  };

  const activateAccount = async (newPassword) => {
    try {
      const authToken = token || localStorage.getItem('token');
      await axios.put(
        '/auth/activate',
        { newPassword },
        authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : undefined
      );
      toast.success('Account activated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Activation failed');
      throw error;
    }
  };

  const activateAccountWithToken = async (activationToken, newPassword) => {
    try {
      const response = await axios.put(`/auth/activate/${activationToken}`, { newPassword });
      const { token: jwtToken, user: activatedUser } = response.data;

      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);
      setUser(activatedUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;

      toast.success('Account activated successfully');
      return activatedUser;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Activation failed');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    token,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    forgotPassword,
    resetPassword,
    activateAccount,
    activateAccountWithToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};