import { NextRequest, NextResponse } from 'next/server';
import { verifyPasswordResetOTP } from '@/lib/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    // Validate required fields
    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, message: 'OTP must be a 6-digit number' },
        { status: 400 }
      );
    }

    // Verify password reset OTP
    const result = await verifyPasswordResetOTP(email, otp);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        userId: result.userId
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Password reset OTP verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
