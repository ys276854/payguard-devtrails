import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';
import { T } from '../i18n';

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  // ---------------- AUTH ----------------
  const [user, setUser] = useState(null);

  const [admin, setAdmin] = useState(() => {
    const token = localStorage.getItem('pg_admin_token');
    const username = localStorage.getItem('pg_admin_user');
    return token && username ? { token, username, role: 'admin' } : null;
  });

  const [selectedRole, setSelectedRole] = useState(
    localStorage.getItem('pg_role') || 'worker'
  );

  const [loading, setLoading] = useState(true);

  // ---------------- LANGUAGE ----------------
  const [lang, setLang] = useState(
    localStorage.getItem('pg_lang') || 'en'
  );

  // ✅ Translation object (reactive)
  const t = T[lang] || T.en;

  // ---------------- THEME ----------------
  const [theme, setTheme] = useState(
    localStorage.getItem('pg_theme') || 'dark'
  );

  // ---------------- INIT USER ----------------
  useEffect(() => {
    const token = localStorage.getItem('pg_token');

    if (token) {
      authAPI
        .me()
        .then((r) => setUser(r.data.user))
        .catch(() => localStorage.removeItem('pg_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ---------------- THEME APPLY ----------------
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pg_theme', theme);
  }, [theme]);

  // ---------------- ROLE SAVE ----------------
  useEffect(() => {
    localStorage.setItem('pg_role', selectedRole);
  }, [selectedRole]);

  // ---------------- LANGUAGE SAVE ----------------
  useEffect(() => {
    localStorage.setItem('pg_lang', lang);
  }, [lang]);

  // ---------------- AUTH FUNCTIONS ----------------
  const login = (token, userData) => {
    localStorage.removeItem('pg_admin_token');
    localStorage.removeItem('pg_admin_user');

    setAdmin(null);
    localStorage.setItem('pg_token', token);
    setUser(userData);
    setSelectedRole('worker');
  };

  const logout = () => {
    localStorage.removeItem('pg_token');
    setUser(null);
  };

  const loginAdmin = (token, adminData) => {
    localStorage.removeItem('pg_token');
    setUser(null);

    localStorage.setItem('pg_admin_token', token);
    localStorage.setItem('pg_admin_user', adminData.username);

    setAdmin({
      token,
      username: adminData.username,
      role: 'admin',
    });

    setSelectedRole('admin');
  };

  const logoutAdmin = () => {
    localStorage.removeItem('pg_admin_token');
    localStorage.removeItem('pg_admin_user');
    setAdmin(null);
  };

  // ---------------- LANGUAGE CHANGE ----------------
  const changeLang = (l) => {
    setLang(l);
  };

  // ---------------- THEME TOGGLE ----------------
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // ---------------- PROVIDER ----------------
  return (
    <AppCtx.Provider
      value={{
        user,
        setUser,
        admin,
        selectedRole,
        setSelectedRole,
        loading,
        login,
        logout,
        loginAdmin,
        logoutAdmin,
        lang,
        changeLang,
        theme,
        toggleTheme,
        t, // 🔥 THIS IS YOUR TRANSLATION ACCESS
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

// ---------------- HOOK ----------------
export const useApp = () => useContext(AppCtx);