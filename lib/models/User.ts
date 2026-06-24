import { query } from '../database';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_active: boolean;
  is_verified: boolean;
  email_verification_token?: string;
  otp_attempts?: number;
  otp_expires_at?: Date;
  account_locked_until?: Date;
  password_reset_token?: string;
  password_reset_expires?: Date;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  currency: string;
  timezone: string;
  daily_message_enabled: boolean;
  notification_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  // Create a new user
  static async create(userData: CreateUserData): Promise<User> {
    const { first_name, last_name, username, email, password } = userData;
    
    // Hash the password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    const result = await query(
      `INSERT INTO users (first_name, last_name, username, email, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [first_name, last_name, username, email, password_hash]
    );
    
    const user = result.rows[0];
    
    // Create default user preferences
    await query(
      `INSERT INTO user_preferences (user_id, currency, timezone, daily_message_enabled, notification_enabled)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, 'USD', 'UTC', true, true]
    );
    
    return user;
  }
  
  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    
    return result.rows[0] || null;
  }
  
  // Find user by username
  static async findByUsername(username: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );
    
    return result.rows[0] || null;
  }
  
  // Find user by ID
  static async findById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [id]
    );
    
    return result.rows[0] || null;
  }
  
  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
  
  // Update user
  static async update(id: string, updateData: Partial<User>): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(updateData)) {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (fields.length === 0) {
      return await this.findById(id);
    }
    
    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    paramCount++;
    
    values.push(id);
    
    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    return result.rows[0] || null;
  }
  
  // Delete user (soft delete)
  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
    
    return result.rowCount > 0;
  }
  
  // Get user preferences
  static async getPreferences(userId: string): Promise<UserPreferences | null> {
    const result = await query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    
    return result.rows[0] || null;
  }
  
  // Update user preferences
  static async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(preferences)) {
      if (key !== 'id' && key !== 'user_id' && value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (fields.length === 0) {
      return await this.getPreferences(userId);
    }
    
    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    paramCount++;
    
    values.push(userId);
    
    const result = await query(
      `UPDATE user_preferences SET ${fields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
      values
    );
    
    return result.rows[0] || null;
  }
  
  // Check if email exists
  static async emailExists(email: string): Promise<boolean> {
    const result = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    return result.rows.length > 0;
  }
  
  // Check if username exists
  static async usernameExists(username: string): Promise<boolean> {
    const result = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    return result.rows.length > 0;
  }
}
