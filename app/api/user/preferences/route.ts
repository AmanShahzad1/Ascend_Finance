import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET /api/user/preferences - Get user preferences
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

    // Get user preferences
    const preferencesResult = await query(
      'SELECT currency, timezone, daily_message_enabled, notification_enabled FROM user_preferences WHERE user_id = $1',
      [decoded.userId]
    );

    let preferences;
    if (preferencesResult.rows.length === 0) {
      // Create default preferences if none exist
      await query(`
        INSERT INTO user_preferences (user_id, currency, timezone, daily_message_enabled, notification_enabled)
        VALUES ($1, 'USD', 'UTC', true, true)
      `, [decoded.userId]);
      
      preferences = {
        currency: 'USD',
        timezone: 'UTC',
        daily_message_enabled: true,
        notification_enabled: true
      };
    } else {
      preferences = preferencesResult.rows[0];
    }

    return NextResponse.json({
      success: true,
      data: preferences
    });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Get user preferences error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch user preferences' }, { status: 500 });
  }
}

// PUT /api/user/preferences - Update user preferences
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
      currency, 
      timezone, 
      daily_message_enabled, 
      notification_enabled 
    } = body;

    // Validation
    if (!currency || !timezone) {
      return NextResponse.json({ 
        success: false, 
        message: 'Currency and timezone are required' 
      }, { status: 400 });
    }

    // Check if preferences exist
    const existingPreferences = await query(
      'SELECT id FROM user_preferences WHERE user_id = $1',
      [decoded.userId]
    );

    let result;
    if (existingPreferences.rows.length > 0) {
      // Update existing preferences
      result = await query(`
        UPDATE user_preferences SET
          currency = $1,
          timezone = $2,
          daily_message_enabled = $3,
          notification_enabled = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $5
        RETURNING currency, timezone, daily_message_enabled, notification_enabled, updated_at
      `, [currency, timezone, daily_message_enabled, notification_enabled, decoded.userId]);
    } else {
      // Create new preferences
      result = await query(`
        INSERT INTO user_preferences (user_id, currency, timezone, daily_message_enabled, notification_enabled)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING currency, timezone, daily_message_enabled, notification_enabled, created_at as updated_at
      `, [decoded.userId, currency, timezone, daily_message_enabled, notification_enabled]);
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Failed to update preferences' }, { status: 500 });
    }

    const updatedPreferences = result.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        currency: updatedPreferences.currency,
        timezone: updatedPreferences.timezone,
        daily_message_enabled: updatedPreferences.daily_message_enabled,
        notification_enabled: updatedPreferences.notification_enabled,
        updated_at: updatedPreferences.updated_at
      }
    });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Update user preferences error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update preferences' }, { status: 500 });
  }
}
