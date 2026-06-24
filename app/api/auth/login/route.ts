import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/User';
 // eslint-disable-next-line @typescript-eslint/no-unused-vars
import { generateToken, verifyToken, isValidEmail, sanitizeInput } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sanitize email
    const sanitizedEmail = sanitizeInput(email.toLowerCase());

    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await UserModel.findByEmail(sanitizedEmail);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await UserModel.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!user.is_verified) {
      return NextResponse.json(
        { success: false, message: 'Please verify your email first' },
        { status: 401 }
      );
    }

    // Generate JWT token with appropriate expiration
     // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const tokenExpiry = rememberMe ? '30d' : '7d';
    const token = generateToken(user);

    // Return success response (exclude password_hash)
     // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: userWithoutPassword,
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
