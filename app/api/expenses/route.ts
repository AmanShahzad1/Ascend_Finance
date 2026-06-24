import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET /api/expenses - Get user's expenses
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    let whereClause = 'WHERE t.user_id = $1';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryParams: any[] = [decoded.userId];
    let paramCount = 1;

    if (category) {
      paramCount++;
      whereClause += ` AND ec.name = $${paramCount}`;
      queryParams.push(category);
    }

    if (type) {
      paramCount++;
      whereClause += ` AND t.transaction_type = $${paramCount}`;
      queryParams.push(type);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (t.description ILIKE $${paramCount} OR t.merchant_name ILIKE $${paramCount} OR t.notes ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    const expenses = await query(`
      SELECT 
        t.id,
        t.transaction_type,
        t.amount,
        t.description,
        t.transaction_date,
        t.merchant_name,
        t.payment_method,
        t.location,
        t.notes,
        t.tags,
        t.is_recurring,
        t.recurring_pattern,
        t.created_at,
        ec.name as category_name,
        ec.description as category_description
      FROM transactions t
      JOIN expense_categories ec ON t.category_id = ec.id
      ${whereClause}
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...queryParams, limit, offset]);

    const totalCount = await query(`
      SELECT COUNT(*) as count
      FROM transactions t
      JOIN expense_categories ec ON t.category_id = ec.id
      ${whereClause}
    `, queryParams);

    return NextResponse.json({
      success: true,
      data: {
        expenses: expenses.rows,
        pagination: {
          total: parseInt(totalCount.rows[0].count),
          limit,
          offset,
          hasMore: offset + limit < parseInt(totalCount.rows[0].count)
        }
      }
    });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Get expenses error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch expenses' }, { status: 500 });
  }
}

// POST /api/expenses - Create new expense
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
    const { 
      category,  
      amount, 
      description, 
      transaction_date, 
      merchant_name, 
      payment_method, 
      location, 
      notes, 
      tags 
    } = body;

    // Validation
    if (!category || !amount || !description) {
      return NextResponse.json({ 
        success: false, 
        message: 'Category, amount, and description are required' 
      }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Amount must be greater than 0' 
      }, { status: 400 });
    }

    // Get category ID
    const categoryResult = await query(
      'SELECT id FROM expense_categories WHERE name = $1 AND (user_id = $2 OR user_id IS NULL)',
      [category, decoded.userId]
    );

    if (categoryResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid category' 
      }, { status: 400 });
    }

    const categoryId = categoryResult.rows[0].id;

    // Create expense
    const result = await query(`
      INSERT INTO transactions (
        user_id, category_id, transaction_type, amount, description, 
        transaction_date, merchant_name, payment_method, location, notes, tags
      ) VALUES ($1, $2, 'expense', $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, created_at
    `, [
      decoded.userId, categoryId, amount, description,
      transaction_date || new Date().toISOString().split('T')[0],
      merchant_name || null, payment_method || null, location || null, 
      notes || null, tags ? (Array.isArray(tags) ? tags : tags.split(',').map((tag: string) => tag.trim())) : null
    ]);

    return NextResponse.json({
      success: true,
      message: 'Expense created successfully',
      data: {
        id: result.rows[0].id,
        created_at: result.rows[0].created_at
      }
    });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Create expense error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create expense' }, { status: 500 });
  }
}

// DELETE /api/expenses - Delete an expense
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get('id');

    if (!expenseId) {
      return NextResponse.json({ success: false, message: 'Expense ID is required' }, { status: 400 });
    }

    // Check if the expense belongs to the user
    const existingExpense = await query(
      'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
      [expenseId, decoded.userId]
    );

    if (existingExpense.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Expense not found or access denied' }, { status: 404 });
    }

    // Delete the expense
    await query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
      [expenseId, decoded.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully'
    });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Delete expense error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete expense' }, { status: 500 });
  }
}

// PUT /api/expenses - Update an expense
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
      id,
      category, 
      amount, 
      description, 
      transaction_date, 
      merchant_name, 
      payment_method, 
      location, 
      notes, 
      tags 
    } = body;

    // Validation
    if (!id || !category || !amount || !description) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID, category, amount, and description are required' 
      }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Amount must be greater than 0' 
      }, { status: 400 });
    }

    // Check if the expense belongs to the user
    const existingExpense = await query(
      'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
      [id, decoded.userId]
    );

    if (existingExpense.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Expense not found or access denied' }, { status: 404 });
    }

    // Get category ID
    const categoryResult = await query(
      'SELECT id FROM expense_categories WHERE name = $1 AND (user_id = $2 OR user_id IS NULL)',
      [category, decoded.userId]
    );

    if (categoryResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid category' 
      }, { status: 400 });
    }

    const categoryId = categoryResult.rows[0].id;

    // Update expense
    const result = await query(`
      UPDATE transactions SET
        category_id = $1,
        amount = $2,
        description = $3,
        transaction_date = $4,
        merchant_name = $5,
        payment_method = $6,
        location = $7,
        notes = $8,
        tags = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10 AND user_id = $11
      RETURNING id, updated_at
    `, [
      categoryId, amount, description,
      transaction_date || new Date().toISOString().split('T')[0],
      merchant_name || null, payment_method || null, location || null, 
      notes || null, tags ? (Array.isArray(tags) ? tags : tags.split(',').map((tag: string) => tag.trim())) : null,
      id, decoded.userId
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Expense not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Expense updated successfully',
      data: {
        id: result.rows[0].id,
        updated_at: result.rows[0].updated_at
      }
    });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Update expense error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update expense' }, { status: 500 });
  }
}
