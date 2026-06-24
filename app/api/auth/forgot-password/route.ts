import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/User';
import { isValidEmail, sanitizeInput } from '@/lib/auth';
import { generateOTP, sendPasswordResetOTP, storePasswordResetOTP } from '@/lib/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate input
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedEmail = sanitizeInput(email);

    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await UserModel.findByEmail(sanitizedEmail);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No account found with this email address' },
        { status: 404 }
      );
    }

    // Check if user is verified
    if (!user.is_verified) {
      return NextResponse.json(
        { success: false, message: 'Please verify your email first before resetting password' },
        { status: 400 }
      );
    }

    // Check if account is locked
    if (user.account_locked_until && new Date() < new Date(user.account_locked_until)) {
      const lockTime = new Date(user.account_locked_until);
      return NextResponse.json(
        { 
          success: false, 
          message: `Account is temporarily locked. Try again after ${lockTime.toLocaleString()}` 
        },
        { status: 423 }
      );
    }

    // Generate and send password reset OTP
    const otp = generateOTP();
    const emailSent = await sendPasswordResetOTP(sanitizedEmail, otp, user.first_name);
    
    if (!emailSent) {
      return NextResponse.json(
        { success: false, message: 'Failed to send password reset code' },
        { status: 500 }
      );
    }

    // Store password reset OTP in database
    await storePasswordResetOTP(user.id, otp);

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset code sent to your email',
      },
      { status: 200 }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
