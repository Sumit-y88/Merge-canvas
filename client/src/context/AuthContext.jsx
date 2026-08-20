/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useCallback, useEffect } from "react";
import api, { setAuthToken } from "../api/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const saveAuth = useCallback((authData) => {
    setAuthToken(authData.accessToken);
    setToken(authData.accessToken);
    setUser(authData.user);
  }, []);

  const logout = useCallback(() => {
    api.post("/auth/logout").catch(() => {}).finally(() => {
      setToken(null);
      setUser(null);
      setAuthToken(null);
    });
  }, []);

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
  }, []);

  useEffect(() => {
    api.post("/auth/refresh", {}, { _skipRefresh: true })
      .then(({ data }) => saveAuth(data))
      .catch(() => setAuthToken(null))
      .finally(() => setLoading(false));
  }, [saveAuth]);

  return (
    <AuthContext.Provider value={{ user, token, loading, saveAuth, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
