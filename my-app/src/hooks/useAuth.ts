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

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
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

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getJwtToken();
    
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload) {
        setUser({
          id: payload.sub,
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
        });
      }
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