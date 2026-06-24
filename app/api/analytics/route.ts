import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import jwt from 'jsonwebtoken';

interface AnalyticsData {
  period: string;
  summary: {
    total_expenses: number;
    total_transactions: number;
    average_transaction: number;
    largest_expense: number;
    smallest_expense: number;
  };
  category_breakdown: Array<{
    category: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  monthly_trend: Array<{
    month: string;
    expenses: number;
    transaction_count: number;
  }>;
  daily_spending: Array<{
    date: string;
    amount: number;
    transaction_count: number;
  }>;
  payment_methods: Array<{
    method: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  top_merchants: Array<{
    merchant: string;
    amount: number;
    count: number;
  }>;
  spending_patterns: {
    weekday_average: number;
    weekend_average: number;
    monthly_average: number;
  };
}

// Database row type interfaces
interface SummaryRow {
  total_expenses: string;
  total_transactions: string;
  average_transaction: string;
  largest_expense: string;
  smallest_expense: string;
}

interface CategoryRow {
  category: string;
  amount: string;
  count: string;
}

interface TrendRow {
  month: string;
  expenses: string;
  transaction_count: string;
}

interface DailyRow {
  date: string;
  amount: string;
  transaction_count: string;
}

interface PaymentRow {
  method: string;
  amount: string;
  count: string;
}

interface MerchantRow {
  merchant: string;
  amount: string;
  count: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface PatternRow {
  day_of_week: number;
  hour: number;
  avg_amount: string;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const userId = decoded.userId;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';

    // Calculate date range based on period
    let dateCondition = '';
    let groupByClause = '';
    
    switch (period) {
      case 'week':
        dateCondition = `AND t.transaction_date >= CURRENT_DATE - INTERVAL '7 days'`;
        groupByClause = `DATE_TRUNC('day', t.transaction_date)`;
        break;
      case 'month':
        dateCondition = `AND t.transaction_date >= CURRENT_DATE - INTERVAL '30 days'`;
        groupByClause = `DATE_TRUNC('day', t.transaction_date)`;
        break;
      case '3months':
        dateCondition = `AND t.transaction_date >= CURRENT_DATE - INTERVAL '3 months'`;
        groupByClause = `DATE_TRUNC('month', t.transaction_date)`;
        break;
      case '6months':
        // For 6months, let's get all data from the last 6 months or all data if no recent data
        dateCondition = `AND t.transaction_date >= CURRENT_DATE - INTERVAL '6 months'`;
        groupByClause = `DATE_TRUNC('month', t.transaction_date)`;
        break;
      case 'year':
        dateCondition = `AND t.transaction_date >= CURRENT_DATE - INTERVAL '1 year'`;
        groupByClause = `DATE_TRUNC('month', t.transaction_date)`;
        break;
      case 'all':
        // Special case to get all data regardless of date
        dateCondition = '';
        groupByClause = `DATE_TRUNC('month', t.transaction_date)`;
        break;
      default:
        dateCondition = `AND t.transaction_date >= CURRENT_DATE - INTERVAL '6 months'`;
        groupByClause = `DATE_TRUNC('month', t.transaction_date)`;
    }

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COALESCE(SUM(t.amount), 0) as total_expenses,
        COUNT(t.id) as total_transactions,
        COALESCE(AVG(t.amount), 0) as average_transaction,
        COALESCE(MAX(t.amount), 0) as largest_expense,
        COALESCE(MIN(t.amount), 0) as smallest_expense
      FROM transactions t
      WHERE t.user_id = $1 AND t.transaction_type = 'expense'
      ${dateCondition}
    `;

    const summaryResult = await query(summaryQuery, [userId]);
    const summary = summaryResult.rows[0] as SummaryRow;

    // Get category breakdown
    const categoryQuery = `
      SELECT 
        ec.name as category,
        COALESCE(SUM(t.amount), 0) as amount,
        COUNT(t.id) as count
      FROM expense_categories ec
      LEFT JOIN transactions t ON ec.id = t.category_id 
        AND t.user_id = $1 
        AND t.transaction_type = 'expense'
        ${dateCondition}
      WHERE ec.user_id IS NULL OR ec.user_id = $1
      GROUP BY ec.id, ec.name, ec.sort_order
      ORDER BY ec.sort_order
    `;

    const categoryResult = await query(categoryQuery, [userId]);
    const totalAmount = parseFloat(summary.total_expenses);
    const categoryBreakdown = categoryResult.rows
      .filter((row: CategoryRow) => parseFloat(row.amount) > 0) // Filter out categories with zero amount
      .map((row: CategoryRow) => ({
        category: row.category,
        amount: parseFloat(row.amount),
        count: parseInt(row.count),
        percentage: totalAmount > 0 ? (parseFloat(row.amount) / totalAmount) * 100 : 0
      }));

    // Get monthly trend - simplified approach
    const trendQuery = `
      SELECT 
        TO_CHAR(${groupByClause}, 'YYYY-MM') as month,
        COALESCE(SUM(t.amount), 0) as expenses,
        COUNT(t.id) as transaction_count
      FROM transactions t
      WHERE t.user_id = $1 
        AND t.transaction_type = 'expense'
        ${dateCondition}
      GROUP BY ${groupByClause}
      ORDER BY ${groupByClause}
    `;

    const trendResult = await query(trendQuery, [userId]);
    const monthlyTrend = trendResult.rows.map((row: TrendRow) => ({
      month: row.month,
      expenses: parseFloat(row.expenses),
      transaction_count: parseInt(row.transaction_count)
    }));


    // Get daily spending (last 30 days)
    const dailyQuery = `
      SELECT 
        TO_CHAR(t.transaction_date, 'YYYY-MM-DD') as date,
        COALESCE(SUM(t.amount), 0) as amount,
        COUNT(t.id) as transaction_count
      FROM transactions t
      WHERE t.user_id = $1 
        AND t.transaction_type = 'expense'
        AND t.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY t.transaction_date
      ORDER BY t.transaction_date
    `;

    const dailyResult = await query(dailyQuery, [userId]);
    const dailySpending = dailyResult.rows.map((row: DailyRow) => ({
      date: row.date,
      amount: parseFloat(row.amount),
      transaction_count: parseInt(row.transaction_count)
    }));

    // Get payment methods breakdown
    const paymentQuery = `
      SELECT 
        COALESCE(t.payment_method, 'unknown') as method,
        COALESCE(SUM(t.amount), 0) as amount,
        COUNT(t.id) as count
      FROM transactions t
      WHERE t.user_id = $1 
        AND t.transaction_type = 'expense'
        ${dateCondition}
      GROUP BY t.payment_method
      ORDER BY amount DESC
    `;

    const paymentResult = await query(paymentQuery, [userId]);
    const paymentMethods = paymentResult.rows.map((row: PaymentRow) => ({
      method: row.method,
      amount: parseFloat(row.amount),
      count: parseInt(row.count),
      percentage: totalAmount > 0 ? (parseFloat(row.amount) / totalAmount) * 100 : 0
    }));

    // Get top merchants
    const merchantQuery = `
      SELECT 
        COALESCE(t.merchant_name, 'Unknown') as merchant,
        COALESCE(SUM(t.amount), 0) as amount,
        COUNT(t.id) as count
      FROM transactions t
      WHERE t.user_id = $1 
        AND t.transaction_type = 'expense'
        ${dateCondition}
        AND t.merchant_name IS NOT NULL
      GROUP BY t.merchant_name
      ORDER BY amount DESC
      LIMIT 10
    `;

    const merchantResult = await query(merchantQuery, [userId]);
    const topMerchants = merchantResult.rows.map((row: MerchantRow) => ({
      merchant: row.merchant,
      amount: parseFloat(row.amount),
      count: parseInt(row.count)
    }));

    // Get spending patterns - corrected calculation
    const weekdayQuery = `
      SELECT 
        COALESCE(SUM(t.amount), 0) as total_amount,
        COUNT(DISTINCT t.transaction_date) as day_count
      FROM transactions t
      WHERE t.user_id = $1 
        AND t.transaction_type = 'expense'
        AND EXTRACT(DOW FROM t.transaction_date) BETWEEN 1 AND 5
        ${dateCondition}
    `;

    const weekendQuery = `
      SELECT 
        COALESCE(SUM(t.amount), 0) as total_amount,
        COUNT(DISTINCT t.transaction_date) as day_count
      FROM transactions t
      WHERE t.user_id = $1 
        AND t.transaction_type = 'expense'
        AND (EXTRACT(DOW FROM t.transaction_date) = 0 OR EXTRACT(DOW FROM t.transaction_date) = 6)
        ${dateCondition}
    `;

    const weekdayResult = await query(weekdayQuery, [userId]);
    const weekendResult = await query(weekendQuery, [userId]);
    
    // Calculate correct weekday vs weekend averages
    const weekdayData = weekdayResult.rows[0];
    const weekendData = weekendResult.rows[0];
    
    const weekdayAverage = parseInt(weekdayData.day_count) > 0 
      ? parseFloat(weekdayData.total_amount) / parseInt(weekdayData.day_count)
      : 0;
    
    const weekendAverage = parseInt(weekendData.day_count) > 0 
      ? parseFloat(weekendData.total_amount) / parseInt(weekendData.day_count)
      : 0;

    // Calculate monthly average instead of peak hour
    const monthlyAverageQuery = `
      SELECT 
        COALESCE(AVG(daily_total), 0) as monthly_average
      FROM (
        SELECT 
          t.transaction_date,
          SUM(t.amount) as daily_total
        FROM transactions t
        WHERE t.user_id = $1 
          AND t.transaction_type = 'expense'
          ${dateCondition}
        GROUP BY t.transaction_date
      ) daily_totals
    `;

    const monthlyAverageResult = await query(monthlyAverageQuery, [userId]);
    const monthlyAverage = parseFloat(monthlyAverageResult.rows[0].monthly_average);

    const analyticsData: AnalyticsData = {
      period,
      summary: {
        total_expenses: parseFloat(summary.total_expenses),
        total_transactions: parseInt(summary.total_transactions),
        average_transaction: parseFloat(summary.average_transaction),
        largest_expense: parseFloat(summary.largest_expense),
        smallest_expense: parseFloat(summary.smallest_expense)
      },
      category_breakdown: categoryBreakdown,
      monthly_trend: monthlyTrend,
      daily_spending: dailySpending,
      payment_methods: paymentMethods,
      top_merchants: topMerchants,
      spending_patterns: {
        weekday_average: weekdayAverage,
        weekend_average: weekendAverage,
        monthly_average: monthlyAverage
      }
    };

    return NextResponse.json({ success: true, data: analyticsData });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
