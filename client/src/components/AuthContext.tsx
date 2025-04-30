import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { login as apiLogin } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if token exists and fetch user data
    const initAuth = async () => {
      if (token) {
        try {
          // TODO: Add an endpoint to verify token and get current user
          // For now, we'll just set isLoading to false
          setIsLoading(false);
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          logout();
        }
      } else {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [token]);

  const login = async (identifier: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiLogin({ identifier, password });
      setToken(response.token);
      localStorage.setItem('token', response.token);
      
      // For now, we'll manually parse the JWT to get basic user info
      // In a production app, you'd want a proper endpoint to get user details
      const payload = JSON.parse(atob(response.token.split('.')[1]));
      setUser({
        id: payload.id,
        username: payload.username,
        role: payload.role as UserRole,
        created_at: payload.created_at || new Date().toISOString()
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    role: user?.role || null
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 