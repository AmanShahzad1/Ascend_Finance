import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail, isValidPassword, sanitizeInput } from '@/lib/auth';
import { resetPasswordWithOTP, resetPasswordAfterVerification } from '@/lib/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, newPassword } = body;

    // Validate required fields
    if (!email || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Email and new password are required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);

    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = isValidPassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.message },
        { status: 400 }
      );
    }

    let result;

    // Check if OTP is provided (old flow) or if it's already verified (new flow)
    if (otp && otp !== 'verified') {
      // Old flow: OTP provided, validate and reset
      const sanitizedOTP = sanitizeInput(otp);
      
      // Validate OTP format
      if (!/^\d{6}$/.test(sanitizedOTP)) {
        return NextResponse.json(
          { success: false, message: 'OTP must be a 6-digit number' },
          { status: 400 }
        );
      }

      result = await resetPasswordWithOTP(sanitizedEmail, sanitizedOTP, newPassword);
    } else {
      // New flow: OTP already verified, just reset password
      result = await resetPasswordAfterVerification(sanitizedEmail, newPassword);
    }

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: result.message,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 400 }
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while resetting your password' },
      { status: 500 }
    );
  }
}
