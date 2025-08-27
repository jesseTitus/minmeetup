import { useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '../types';

interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  getJwtToken: () => string | null;
  createAuthHeaders: () => HeadersInit;
  handleAuthError: (response: Response) => void;
}

const getJwtToken = () => {
  return localStorage.getItem("jwt_token");
};

const createAuthHeaders = (): HeadersInit => {
  const token = getJwtToken();
  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (token && !isTokenExpired(token)) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (token && isTokenExpired(token)) {
    // Token is expired, remove it and redirect to login
    localStorage.removeItem("jwt_token");
    const apiUrl = import.meta.env.VITE_API_URL;
    window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
  }
  
  return headers;
};

const decodeJwtPayload = (token: string) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  
  const now = Date.now() / 1000;
  return payload.exp < now;
};

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getJwtToken();
    
    if (token && !isTokenExpired(token)) {
      const payload = decodeJwtPayload(token);
      if (payload) {
        setUser({
          id: payload.sub,
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
        });
      }
    } else if (token && isTokenExpired(token)) {
      // Remove expired token
      localStorage.removeItem("jwt_token");
      setUser(null);
    }
    
    setIsLoading(false);
  }, []);

  const handleAuthError = useCallback((response: Response) => {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("jwt_token");
      const apiUrl = import.meta.env.VITE_API_URL;
      window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
    }
  }, []); // Empty dependency array because this function doesn't depend on any state

  return {
    user,
    isLoading,
    getJwtToken,
    createAuthHeaders,
    handleAuthError,
  };
}; 