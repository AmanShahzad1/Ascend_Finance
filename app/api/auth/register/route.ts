import { NextRequest, NextResponse } from 'next/server';
import { UserModel, CreateUserData } from '@/lib/models/User';
 // eslint-disable-next-line @typescript-eslint/no-unused-vars
import { generateToken, isValidEmail, isValidPassword, isValidUsername, sanitizeInput } from '@/lib/auth';
import { generateOTP, sendOTPEmail, storeOTP } from '@/lib/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, username, email, password } = body;

    // Validate required fields
    if (!firstName || !lastName || !username || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      firstName: sanitizeInput(firstName),
      lastName: sanitizeInput(lastName),
      username: sanitizeInput(username),
      email: sanitizeInput(email.toLowerCase()),
      password: password, // Don't sanitize password as it might contain special chars
    };

    // Validate email format
    if (!isValidEmail(sanitizedData.email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = isValidPassword(sanitizedData.password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.message },
        { status: 400 }
      );
    }

    // Validate username format
    const usernameValidation = isValidUsername(sanitizedData.username);
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { success: false, message: usernameValidation.message },
        { status: 400 }
      );
    }

    // Check if email already exists
    const emailExists = await UserModel.emailExists(sanitizedData.email);
    if (emailExists) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 409 }
      );
    }

    // Check if username already exists
    const usernameExists = await UserModel.usernameExists(sanitizedData.username);
    if (usernameExists) {
      return NextResponse.json(
        { success: false, message: 'Username already taken' },
        { status: 409 }
      );
    }

    // Create user data
    const userData: CreateUserData = {
      first_name: sanitizedData.firstName,
      last_name: sanitizedData.lastName,
      username: sanitizedData.username,
      email: sanitizedData.email,
      password: sanitizedData.password,
    };

    // Create user
    const user = await UserModel.create(userData);

    // Generate and send OTP
    const otp = generateOTP();
    const emailSent = await sendOTPEmail(email, otp, firstName);
    
    if (!emailSent) {
      return NextResponse.json(
        { success: false, message: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    // Store OTP in database
    await storeOTP(user.id, otp);

    // Return success response (exclude password_hash and don't return token yet)
     // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully. Please check your email for verification code.',
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
