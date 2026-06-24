import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET /api/categories - Get expense categories
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

    // Get both system categories (user_id IS NULL) and user's custom categories
    const categories = await query(`
      SELECT 
        id,
        name,
        description,
        sort_order,
        is_active,
        created_at
      FROM expense_categories 
      WHERE user_id IS NULL OR user_id = $1
      ORDER BY sort_order ASC, created_at ASC
    `, [decoded.userId]);

    return NextResponse.json({
      success: true,
      data: categories.rows
    });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Get categories error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/categories - Create custom category
export async function POST(request: NextRequest) {
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
    const { name, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Category name is required' 
      }, { status: 400 });
    }

    // Check if category name already exists for this user
    const existingCategory = await query(
      'SELECT id FROM expense_categories WHERE name = $1 AND user_id = $2',
      [name.trim(), decoded.userId]
    );

    if (existingCategory.rows.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Category name already exists' 
      }, { status: 400 });
    }

    // Get the next sort order
    const maxSortOrder = await query(
      'SELECT COALESCE(MAX(sort_order), 0) as max_order FROM expense_categories WHERE user_id = $1',
      [decoded.userId]
    );

    const nextSortOrder = parseInt(maxSortOrder.rows[0].max_order) + 1;

    // Create custom category
    const result = await query(`
      INSERT INTO expense_categories (user_id, name, description, sort_order, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, description, sort_order, is_active, created_at
    `, [decoded.userId, name.trim(), description?.trim() || null, nextSortOrder, true]);

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      data: result.rows[0]
    });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create category' }, { status: 500 });
  }
}
