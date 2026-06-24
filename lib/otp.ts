import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { query } from './database';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD, // Use App Password for Gmail
  },
});

// Generate 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
export const sendOTPEmail = async (email: string, otp: string, firstName: string): Promise<boolean> => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.error('Email credentials not configured');
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'AscenD Finance - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #065f46, #047857, #000000); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: #fbbf24; font-size: 28px; margin: 0; font-weight: 300;">
              <span style="font-weight: 100;">Ascen</span><span style="font-weight: bold;">D</span> <span style="font-weight: 100;">Finance</span>
            </h1>
            <p style="color: #fbbf24; margin: 10px 0 0 0; font-size: 14px;">Master your money. Liberate your life.</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #065f46; margin-top: 0;">Email Verification</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Hello ${firstName},<br><br>
              Thank you for registering with AscenD Finance! To complete your account setup, please verify your email address using the code below:
            </p>
            
            <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <h3 style="color: #065f46; margin: 0; font-size: 32px; letter-spacing: 5px; font-family: monospace;">${otp}</h3>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">This code expires in 1 minute</p>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              If you didn't request this verification, please ignore this email. Your account will remain inactive until verified.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated message from AscenD Finance. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${email}`);
    return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error sending OTP email:', error);
    console.error('Error details:', {
      message: error?.message || 'Unknown error',
      code: error?.code || 'UNKNOWN',
      command: error?.command || 'N/A',
      response: error?.response || 'N/A'
    });
    return false;
  }
};

// Store OTP in database
export const storeOTP = async (userId: string, otp: string): Promise<void> => {
  if (!userId || !otp) {
    throw new Error('User ID and OTP are required');
  }
  
  const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute from now
  
  await query(
    `UPDATE users 
     SET email_verification_token = $1, 
         otp_expires_at = $2, 
         otp_attempts = 0,
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = $3`,
    [otp, expiresAt, userId]
  );
};

// Verify OTP
export const verifyOTP = async (email: string, otp: string): Promise<{ success: boolean; message: string; userId?: string }> => {
  try {
    // Validate input parameters
    if (!email || !otp) {
      return { success: false, message: 'Email and OTP are required' };
    }

    if (!/^\d{6}$/.test(otp)) {
      return { success: false, message: 'OTP must be a 6-digit number' };
    }

    // Check if account is locked
    const userResult = await query(
      `SELECT id, email_verification_token, otp_expires_at, otp_attempts, account_locked_until 
       FROM users 
       WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }

    const user = userResult.rows[0];

    // Check if account is locked
    if (user.account_locked_until && new Date() < new Date(user.account_locked_until)) {
      const lockTime = new Date(user.account_locked_until);
      return { 
        success: false, 
        message: `Account is temporarily locked. Try again after ${lockTime.toLocaleString()}` 
      };
    }

    // Check if OTP has expired
    if (!user.otp_expires_at || new Date() > new Date(user.otp_expires_at)) {
      return { success: false, message: 'OTP has expired. Please request a new one.' };
    }

    // Check if OTP matches
    if (user.email_verification_token !== otp) {
      const newAttempts = (user.otp_attempts || 0) + 1;
      
      if (newAttempts >= 5) {
        // Lock account for 2 hours
        const lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
        await query(
          `UPDATE users 
           SET otp_attempts = $1, 
               account_locked_until = $2,
               updated_at = CURRENT_TIMESTAMP 
           WHERE id = $3`,
          [newAttempts, lockUntil, user.id]
        );
        return { 
          success: false, 
          message: 'Too many failed attempts. Account locked for 2 hours.' 
        };
      } else {
        await query(
          `UPDATE users 
           SET otp_attempts = $1,
               updated_at = CURRENT_TIMESTAMP 
           WHERE id = $2`,
          [newAttempts, user.id]
        );
        return { 
          success: false, 
          message: `Invalid OTP. ${5 - newAttempts} attempts remaining.` 
        };
      }
    }

    // OTP is valid - verify user and clear OTP data
    await query(
      `UPDATE users 
       SET is_verified = TRUE, 
           email_verification_token = NULL, 
           otp_expires_at = NULL, 
           otp_attempts = 0,
           account_locked_until = NULL,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [user.id]
    );

    return { success: true, message: 'Email verified successfully!', userId: user.id };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return { success: false, message: 'An error occurred during verification' };
  }
};

// Resend OTP
export const resendOTP = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate input parameters
    if (!email) {
      return { success: false, message: 'Email is required' };
    }

    const userResult = await query(
      `SELECT id, first_name, email_verification_token, otp_expires_at, account_locked_until, is_verified 
       FROM users 
       WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }

    const user = userResult.rows[0];

    // Check if account is locked
    if (user.account_locked_until && new Date() < new Date(user.account_locked_until)) {
      const lockTime = new Date(user.account_locked_until);
      return { 
        success: false, 
        message: `Account is temporarily locked. Try again after ${lockTime.toLocaleString()}` 
      };
    }

    // Check if user is already verified
    if (user.is_verified) {
      return { success: false, message: 'Email is already verified' };
    }

    // Generate new OTP
    const newOTP = generateOTP();
    
    // Send email
    const emailSent = await sendOTPEmail(email, newOTP, user.first_name);
    if (!emailSent) {
      return { success: false, message: 'Failed to send verification email' };
    }

    // Store new OTP
    await storeOTP(user.id, newOTP);

    return { success: true, message: 'New verification code sent to your email' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error resending OTP:', error);
    return { success: false, message: 'An error occurred while resending OTP' };
  }
};

// Send password reset OTP email
export const sendPasswordResetOTP = async (email: string, otp: string, firstName: string): Promise<boolean> => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.error('Email credentials not configured');
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'AscenD Finance - Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #065f46, #047857, #000000); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: #fbbf24; font-size: 28px; margin: 0; font-weight: 300;">
              <span style="font-weight: 100;">Ascen</span><span style="font-weight: bold;">D</span> <span style="font-weight: 100;">Finance</span>
            </h1>
            <p style="color: #fbbf24; margin: 10px 0 0 0; font-size: 14px;">Master your money. Liberate your life.</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #065f46; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Hello ${firstName},<br><br>
              You requested to reset your password. Use the code below to reset your password:
            </p>
            
            <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <h3 style="color: #065f46; margin: 0; font-size: 32px; letter-spacing: 5px; font-family: monospace;">${otp}</h3>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">This code expires in 1 minute</p>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated message from AscenD Finance. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset OTP email sent successfully to ${email}`);
    return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error sending password reset OTP email:', error);
    console.error('Error details:', {
      message: error?.message || 'Unknown error',
      code: error?.code || 'UNKNOWN',
      command: error?.command || 'N/A',
      response: error?.response || 'N/A'
    });
    return false;
  }
};

// Store password reset OTP in database
export const storePasswordResetOTP = async (userId: string, otp: string): Promise<void> => {
  if (!userId || !otp) {
    throw new Error('User ID and OTP are required');
  }
  
  const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute from now
  
  await query(
    `UPDATE users 
     SET password_reset_token = $1, 
         password_reset_expires = $2, 
         otp_attempts = 0,
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = $3`,
    [otp, expiresAt, userId]
  );
};

// Verify password reset OTP
export const verifyPasswordResetOTP = async (email: string, otp: string): Promise<{ success: boolean; message: string; userId?: string }> => {
  try {
    // Validate input parameters
    if (!email || !otp) {
      return { success: false, message: 'Email and OTP are required' };
    }

    if (!/^\d{6}$/.test(otp)) {
      return { success: false, message: 'OTP must be a 6-digit number' };
    }

    // Check if account is locked
    const userResult = await query(
      `SELECT id, password_reset_token, password_reset_expires, otp_attempts, account_locked_until 
       FROM users 
       WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }

    const user = userResult.rows[0];

    // Check if account is locked
    if (user.account_locked_until && new Date() < new Date(user.account_locked_until)) {
      const lockTime = new Date(user.account_locked_until);
      return { 
        success: false, 
        message: `Account is temporarily locked. Try again after ${lockTime.toLocaleString()}` 
      };
    }

    // Check if OTP has expired
    if (!user.password_reset_expires || new Date() > new Date(user.password_reset_expires)) {
      return { success: false, message: 'Password reset code has expired. Please request a new one.' };
    }

    // Check if OTP matches
    if (user.password_reset_token !== otp) {
      const newAttempts = (user.otp_attempts || 0) + 1;
      
      if (newAttempts >= 5) {
        // Lock account for 2 hours
        const lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
        await query(
          `UPDATE users 
           SET otp_attempts = $1, 
               account_locked_until = $2,
               updated_at = CURRENT_TIMESTAMP 
           WHERE id = $3`,
          [newAttempts, lockUntil, user.id]
        );
        return { 
          success: false, 
          message: 'Too many failed attempts. Account locked for 2 hours.' 
        };
      } else {
        await query(
          `UPDATE users 
           SET otp_attempts = $1,
               updated_at = CURRENT_TIMESTAMP 
           WHERE id = $2`,
          [newAttempts, user.id]
        );
        return { 
          success: false, 
          message: `Invalid code. ${5 - newAttempts} attempts remaining.` 
        };
      }
    }

    // OTP is valid - return success (don't clear OTP yet, wait for password reset)
    return { success: true, message: 'Code verified successfully!', userId: user.id };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error verifying password reset OTP:', error);
    return { success: false, message: 'An error occurred during verification' };
  }
};

// Resend password reset OTP
export const resendPasswordResetOTP = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate input parameters
    if (!email) {
      return { success: false, message: 'Email is required' };
    }

    const userResult = await query(
      `SELECT id, first_name, password_reset_token, password_reset_expires, account_locked_until, is_verified 
       FROM users 
       WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }

    const user = userResult.rows[0];

    // Check if account is locked
    if (user.account_locked_until && new Date() < new Date(user.account_locked_until)) {
      const lockTime = new Date(user.account_locked_until);
      return { 
        success: false, 
        message: `Account is temporarily locked. Try again after ${lockTime.toLocaleString()}` 
      };
    }

    // Check if user is verified
    if (!user.is_verified) {
      return { success: false, message: 'Please verify your email first' };
    }

    // Generate new OTP
    const newOTP = generateOTP();
    
    // Send email
    const emailSent = await sendPasswordResetOTP(email, newOTP, user.first_name);
    if (!emailSent) {
      return { success: false, message: 'Failed to send password reset email' };
    }

    // Store new OTP
    await storePasswordResetOTP(user.id, newOTP);

    return { success: true, message: 'New password reset code sent to your email' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error resending password reset OTP:', error);
    return { success: false, message: 'An error occurred while resending password reset OTP' };
  }
};

// Reset password after OTP verification (OTP already verified)
export const resetPasswordAfterVerification = async (email: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate input parameters
    if (!email || !newPassword) {
      return { success: false, message: 'Email and new password are required' };
    }

    // Check if user exists and has a valid password reset token
    const userResult = await query(
      `SELECT id, password_reset_token, password_reset_expires 
       FROM users 
       WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }

    const user = userResult.rows[0];

    // Check if there's a valid password reset token (OTP was verified)
    if (!user.password_reset_token) {
      return { success: false, message: 'No valid password reset session. Please request a new reset code.' };
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await query(
      `UPDATE users 
       SET password_hash = $1, 
           password_reset_token = NULL, 
           password_reset_expires = NULL, 
           otp_attempts = 0,
           account_locked_until = NULL,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    return { success: true, message: 'Password reset successfully!' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error resetting password after verification:', error);
    return { success: false, message: 'An error occurred while resetting password' };
  }
};

// Reset password with OTP
export const resetPasswordWithOTP = async (email: string, otp: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate input parameters
    if (!email || !otp || !newPassword) {
      return { success: false, message: 'Email, OTP, and new password are required' };
    }

    if (!/^\d{6}$/.test(otp)) {
      return { success: false, message: 'OTP must be a 6-digit number' };
    }

    // Verify OTP first
    const otpVerification = await verifyPasswordResetOTP(email, otp);
    if (!otpVerification.success) {
      return otpVerification;
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await query(
      `UPDATE users 
       SET password_hash = $1, 
           password_reset_token = NULL, 
           password_reset_expires = NULL, 
           otp_attempts = 0,
           account_locked_until = NULL,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [hashedPassword, otpVerification.userId]
    );

    return { success: true, message: 'Password reset successfully!' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return { success: false, message: 'An error occurred while resetting password' };
  }
};
