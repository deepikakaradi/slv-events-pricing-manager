import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('slv_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('slv_user')) || null);
  const [page, setPage] = useState('landing');
  const [theme, setTheme] = useState(localStorage.getItem('slv_theme') || 'dark');
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [events, setEvents] = useState([]);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);

  // Base API url (assume proxy or same host local port)
  const API_URL = 'http://localhost:5000/api/v1';

  // Manage theme classes
  useEffect(() => {
    const root = window.document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('slv_theme', theme);
  }, [theme]);

  // Load configuration items when token changes
  useEffect(() => {
    if (token) {
      fetchEvents();
      fetchServices();
      fetchPackages();
      fetchNotifications();
      
      // Auto-poll notifications every 15 seconds
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    } else {
      setEvents([]);
      setServices([]);
      setPackages([]);
      setNotifications([]);
      setUnreadNotifications(0);
    }
  }, [token]);

  // Base fetch handler with JWT
  const apiFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      return data;
    } catch (err) {
      console.error(`API Fetch Error [${endpoint}]:`, err.message);
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('slv_token', data.token);
      localStorage.setItem('slv_user', JSON.stringify(data.user));
      setPage('dashboard');
      return true;
    } catch (err) {
      throw err;
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role })
      });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('slv_token', data.token);
      localStorage.setItem('slv_user', JSON.stringify(data.user));
      setPage('dashboard');
      return true;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('slv_token');
    localStorage.removeItem('slv_user');
    setPage('landing');
  };

  const fetchEvents = async () => {
    try {
      const data = await apiFetch('/events');
      setEvents(data);
    } catch (err) {}
  };

  const fetchServices = async () => {
    try {
      const data = await apiFetch('/services');
      setServices(data);
    } catch (err) {}
  };

  const fetchPackages = async () => {
    try {
      const data = await apiFetch('/packages');
      setPackages(data);
    } catch (err) {}
  };

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch('/notifications');
      setNotifications(data);
      setUnreadNotifications(data.filter(n => n.is_read === 0).length);
    } catch (err) {}
  };

  const markNotificationRead = async (id) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
      fetchNotifications();
    } catch (err) {}
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <AppContext.Provider value={{
      token,
      user,
      page,
      theme,
      events,
      services,
      packages,
      notifications,
      unreadNotifications,
      setPage,
      login,
      register,
      logout,
      apiFetch,
      fetchEvents,
      fetchServices,
      fetchPackages,
      fetchNotifications,
      markNotificationRead,
      toggleTheme,
      API_URL
    }}>
      {children}
    </AppContext.Provider>
  );
};
