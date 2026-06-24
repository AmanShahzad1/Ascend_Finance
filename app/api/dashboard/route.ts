import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET /api/dashboard - Get dashboard summary data
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
    const period = searchParams.get('period') || 'month'; // month, week, year

    // Calculate date range based on period
    let dateFilter = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateParams: any[] = [decoded.userId];
    const paramCount = 1;

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    dateFilter = `AND t.transaction_date >= $${paramCount + 1}`;
    dateParams.push(startDate.toISOString().split('T')[0]);

    // Get category spending summary
    const categorySummary = await query(`
      SELECT 
        ec.name as category,
        COALESCE(SUM(t.amount), 0) as expense_amount,
        COUNT(t.id) as expense_count
      FROM expense_categories ec
      LEFT JOIN transactions t ON ec.id = t.category_id AND t.user_id = $1 AND t.transaction_date >= $2
      WHERE ec.user_id IS NULL
      GROUP BY ec.id, ec.name, ec.sort_order
      ORDER BY ec.sort_order
    `, dateParams);

    // Get overall totals
    const totals = await query(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_expenses,
        COUNT(*) as total_transactions
      FROM transactions 
      WHERE user_id = $1 AND transaction_date >= $2
    `, dateParams);

    // Get recent transactions (last 5)
    const recentTransactions = await query(`
      SELECT 
        t.id,
        t.transaction_type,
        t.amount,
        t.description,
        t.transaction_date,
        t.merchant_name,
        ec.name as category_name
      FROM transactions t
      JOIN expense_categories ec ON t.category_id = ec.id
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
      LIMIT 5
    `, [decoded.userId]);

    // Get monthly spending trend (last 6 months)
    const monthlyTrend = await query(`
      SELECT 
        DATE_TRUNC('month', transaction_date) as month,
        COALESCE(SUM(amount), 0) as expenses,
        COUNT(*) as transaction_count
      FROM transactions 
      WHERE user_id = $1 
        AND transaction_date >= $2
      GROUP BY DATE_TRUNC('month', transaction_date)
      ORDER BY month DESC
      LIMIT 6
    `, [decoded.userId, new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0]]);

    const totalData = totals.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        period,
        summary: {
          total_expenses: parseFloat(totalData.total_expenses),
          total_transactions: parseInt(totalData.total_transactions)
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        categories: categorySummary.rows.map((row: any) => ({
          category: row.category,
          expense_amount: parseFloat(row.expense_amount),
          expense_count: parseInt(row.expense_count)
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recent_transactions: recentTransactions.rows.map((row: any) => ({
          id: row.id,
          type: row.transaction_type,
          amount: parseFloat(row.amount),
          description: row.description,
          date: row.transaction_date,
          merchant: row.merchant_name,
          category: row.category_name
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        monthly_trend: monthlyTrend.rows.map((row: any) => ({
          month: row.month,
          expenses: parseFloat(row.expenses),
          transaction_count: parseInt(row.transaction_count)
        }))
      }
    });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Dashboard data error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch dashboard data'
    }, { status: 500 });
  }
}
