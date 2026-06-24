import jwt from 'jsonwebtoken';
import { User } from './models/User';

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

// Generate JWT token
export const generateToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
  };
  
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  return jwt.sign(payload, secret, { 
    expiresIn 
  } as jwt.SignOptions);
};

// Verify JWT token
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

// Extract token from Authorization header
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const isValidPassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (@$!%*?&)' };
  }
  
  return { valid: true };
};

// Validate username format
export const isValidUsername = (username: string): { valid: boolean; message?: string } => {
  if (username.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters long' };
  }
  
  if (username.length > 20) {
    return { valid: false, message: 'Username must be less than 20 characters long' };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { valid: true };
};

// Sanitize input
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
