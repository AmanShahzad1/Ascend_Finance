import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET /api/user/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    // Get user profile
    const userResult = await query(
      'SELECT id, email, username, first_name, last_name, phone, last_login, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        last_login: user.last_login,
        created_at: user.created_at
      }
    });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Get user profile error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch user profile' }, { status: 500 });
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      first_name, 
      last_name, 
      username, 
      email, 
      phone 
    } = body;

    // Validation
    if (!first_name || !last_name || !username || !email) {
      return NextResponse.json({ 
        success: false, 
        message: 'First name, last name, username, and email are required' 
      }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ 
        success: false, 
        message: 'Username must be at least 3 characters long' 
      }, { status: 400 });
    }

    // Check if username is already taken by another user
    const usernameCheck = await query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [username, decoded.userId]
    );

    if (usernameCheck.rows.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Username is already taken' 
      }, { status: 400 });
    }

    // Check if email is already taken by another user
    const emailCheck = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, decoded.userId]
    );

    if (emailCheck.rows.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email is already taken' 
      }, { status: 400 });
    }

    // Update user profile
    const result = await query(`
      UPDATE users SET
        first_name = $1,
        last_name = $2,
        username = $3,
        email = $4,
        phone = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, email, username, first_name, last_name, phone, last_login, updated_at
    `, [first_name, last_name, username, email, phone || null, decoded.userId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const updatedUser = result.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        phone: updatedUser.phone,
        last_login: updatedUser.last_login,
        updated_at: updatedUser.updated_at
      }
    });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Update user profile error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update profile' }, { status: 500 });
  }
}
