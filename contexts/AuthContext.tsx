'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/models/User';

interface Transaction {
  id: string;
  transaction_type: 'expense';
  amount: number;
  description: string;
  transaction_date: string;
  merchant_name?: string;
  payment_method?: string;
  location?: string;
  notes?: string;
  tags?: string[];
  category_name: string;
  created_at: string;
}

interface DashboardData {
  period: string;
  summary: {
    total_expenses: number;
    total_transactions: number;
  };
  categories: Array<{
    category: string;
    expense_amount: number;
    expense_count: number;
  }>;
  recent_transactions: Array<{
    id: string;
    type: 'expense';
    amount: number;
    description: string;
    date: string;
    merchant?: string;
    category: string;
  }>;
  monthly_trend: Array<{
    month: string;
    expenses: number;
    transaction_count: number;
  }>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string; user?: User; token?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; message?: string; user?: User }>;
  verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; message: string; userId?: string }>;
  resendOTP: (email: string) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  verifyPasswordResetOTP: (email: string, otp: string) => Promise<{ success: boolean; message: string; userId?: string }>;
  resendPasswordResetOTP: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  // Transaction management
  getDashboardData: (period?: string) => Promise<{ success: boolean; data?: DashboardData; message?: string }>;
  addExpense: (expenseData: Omit<Transaction, 'id' | 'created_at' | 'category_name'> & { category: string }) => Promise<{ success: boolean; message?: string; data?: any }>;
  updateExpense: (expenseData: Omit<Transaction, 'created_at' | 'category_name'> & { category: string }) => Promise<{ success: boolean; message?: string; data?: any }>;
  deleteExpense: (expenseId: string) => Promise<{ success: boolean; message?: string }>;
  getExpenses: (params?: { limit?: number; offset?: number; category?: string; type?: string; search?: string }) => Promise<{ success: boolean; data?: { expenses: Transaction[]; pagination: any }; message?: string }>;
  getCategories: () => Promise<{ success: boolean; data?: any[]; message?: string }>;
  // Analytics
  getAnalyticsData: (period?: string) => Promise<{ success: boolean; data?: any; message?: string }>;
  // User profile and preferences
  getUserProfile: () => Promise<{ success: boolean; data?: any; message?: string }>;
  updateUserProfile: (profileData: any) => Promise<{ success: boolean; data?: any; message?: string }>;
  getUserPreferences: () => Promise<{ success: boolean; data?: any; message?: string }>;
  updateUserPreferences: (preferencesData: any) => Promise<{ success: boolean; data?: any; message?: string }>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('ascend_finance_token');
        const storedUser = localStorage.getItem('ascend_finance_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify token with backend
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setUser(data.user);
            } else {
              // Token is invalid, clear storage
              localStorage.removeItem('ascend_finance_token');
              localStorage.removeItem('ascend_finance_user');
              setToken(null);
              setUser(null);
            }
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('ascend_finance_token');
            localStorage.removeItem('ascend_finance_user');
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear storage on error
        localStorage.removeItem('ascend_finance_token');
        localStorage.removeItem('ascend_finance_user');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<{ success: boolean; message?: string; user?: User; token?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        
        // Store in localStorage
        localStorage.setItem('ascend_finance_token', data.token);
        localStorage.setItem('ascend_finance_user', JSON.stringify(data.user));
        
        return data;
      } else {
        // Return the error data instead of throwing
        return data;
      }
    } catch (error) {
      console.error('Login error:', error);
      // Only throw for network/parsing errors, not for API errors
      if (error instanceof TypeError) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        // Registration successful - user will be redirected to OTP verification
        // No need to set user/token yet as email verification is required
        return data;
      } else {
        // Return the error data instead of throwing
        return data;
      }
    } catch (error) {
      console.error('Registration error:', error);
      // Only throw for network/parsing errors, not for API errors
      if (error instanceof TypeError) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP function
  const verifyOTP = async (email: string, otp: string): Promise<{ success: boolean; message: string; userId?: string }> => {
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('OTP verification error:', error);
      return { success: false, message: 'An error occurred during verification' };
    }
  };

  // Resend OTP function
  const resendOTP = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Resend OTP error:', error);
      return { success: false, message: 'An error occurred while resending OTP' };
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, message: 'An error occurred while processing your request' };
    }
  };

  // Verify password reset OTP function
  const verifyPasswordResetOTP = async (email: string, otp: string): Promise<{ success: boolean; message: string; userId?: string }> => {
    try {
      const response = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Password reset OTP verification error:', error);
      return { success: false, message: 'An error occurred during verification' };
    }
  };

  // Resend password reset OTP function
  const resendPasswordResetOTP = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth/resend-reset-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Resend password reset OTP error:', error);
      return { success: false, message: 'An error occurred while resending OTP' };
    }
  };

  // Reset password function
  const resetPassword = async (email: string, otp: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, message: 'An error occurred while resetting your password' };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ascend_finance_token');
    localStorage.removeItem('ascend_finance_user');
  };

  // Transaction management functions
  const getDashboardData = async (period: string = 'month'): Promise<{ success: boolean; data?: DashboardData; message?: string }> => {
    try {
      const response = await fetch(`/api/dashboard?period=${period}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get dashboard data error:', error);
      return { success: false, message: 'An error occurred while fetching dashboard data' };
    }
  };

  const addExpense = async (expenseData: Omit<Transaction, 'id' | 'created_at' | 'category_name'> & { category: string }): Promise<{ success: boolean; message?: string; data?: any }> => {
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Add expense error:', error);
      return { success: false, message: 'An error occurred while adding expense' };
    }
  };

  const updateExpense = async (expenseData: Omit<Transaction, 'created_at' | 'category_name'> & { category: string }): Promise<{ success: boolean; message?: string; data?: any }> => {
    try {
      const response = await fetch('/api/expenses', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update expense error:', error);
      return { success: false, message: 'An error occurred while updating expense' };
    }
  };

  const deleteExpense = async (expenseId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`/api/expenses?id=${expenseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Delete expense error:', error);
      return { success: false, message: 'An error occurred while deleting expense' };
    }
  };

  const getExpenses = async (params: { limit?: number; offset?: number; category?: string; type?: string; search?: string } = {}): Promise<{ success: boolean; data?: { expenses: Transaction[]; pagination: any }; message?: string }> => {
    try {
      const searchParams = new URLSearchParams();
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.offset) searchParams.set('offset', params.offset.toString());
      if (params.category) searchParams.set('category', params.category);
      if (params.type) searchParams.set('type', params.type);
      if (params.search) searchParams.set('search', params.search);

      const response = await fetch(`/api/expenses?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get expenses error:', error);
      return { success: false, message: 'An error occurred while fetching expenses' };
    }
  };

  const getCategories = async (): Promise<{ success: boolean; data?: any[]; message?: string }> => {
    try {
      const response = await fetch('/api/categories', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get categories error:', error);
      return { success: false, message: 'An error occurred while fetching categories' };
    }
  };

  const getAnalyticsData = async (period: string = '6months'): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const response = await fetch(`/api/analytics?period=${period}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get analytics error:', error);
      return { success: false, message: 'An error occurred while fetching analytics data' };
    }
  };

  const getUserProfile = async (): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get user profile error:', error);
      return { success: false, message: 'An error occurred while fetching user profile' };
    }
  };

  const updateUserProfile = async (profileData: any): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update user profile error:', error);
      return { success: false, message: 'An error occurred while updating user profile' };
    }
  };

  const getUserPreferences = async (): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get user preferences error:', error);
      return { success: false, message: 'An error occurred while fetching user preferences' };
    }
  };

  const updateUserPreferences = async (preferencesData: any): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferencesData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update user preferences error:', error);
      return { success: false, message: 'An error occurred while updating user preferences' };
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    verifyOTP,
    resendOTP,
    forgotPassword,
    verifyPasswordResetOTP,
    resendPasswordResetOTP,
    resetPassword,
    logout,
    isAuthenticated,
    getDashboardData,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpenses,
    getCategories,
    getAnalyticsData,
    getUserProfile,
    updateUserProfile,
    getUserPreferences,
    updateUserPreferences,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
