'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiMenu, FiChevronLeft, FiChevronRight, FiUser, FiDollarSign, FiPieChart, FiBarChart, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import DashboardSidebar from '@/components/DashboardSidebar';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function AnalyticsPage() {
  const { user, logout, isAuthenticated, isLoading, getAnalyticsData } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/pages/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load analytics data when user is authenticated
  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (isAuthenticated && !isLoading) {
        setDataLoading(true);
        try {
          const result = await getAnalyticsData(selectedPeriod);
          if (result.success && result.data) {
            setAnalyticsData(result.data);
          } else {
            console.error('Failed to load analytics data:', result.message);
            toast.error('Failed to load analytics data');
          }
        } catch (error) {
          console.error('Error loading analytics data:', error);
          toast.error('Error loading analytics data. Please try again.');
        } finally {
          setDataLoading(false);
        }
      }
    };

    loadAnalyticsData();
  }, [isAuthenticated, isLoading, selectedPeriod, getAnalyticsData]);

  const handleLogout = () => {
    logout();
    router.push('/pages/login');
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const periodOptions = [
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: 'year', label: 'Last Year' },
    { value: 'all', label: 'All Time' }
  ];

  // Chart colors matching dashboard categories
  const CATEGORY_COLORS = {
    necessity: '#f59e0b', // yellow-500
    investment: '#10b981', // green-500  
    status: '#ef4444', // red-500
    savings: '#3b82f6'  // blue-500
  };

  // Get color for category
  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#6b7280';
  };

  if (!isAuthenticated) {
    return null;
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 flex">
        <DashboardSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
          user={user}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          currentPath="/analytics"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-emerald-700 text-lg">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 flex">
      {/* Sidebar */}
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        user={user}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        currentPath="/analytics"
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'}`}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-emerald-200 px-3 sm:px-4 py-3 sm:py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-emerald-700 hover:text-emerald-600 transition-colors lg:hidden p-2 rounded-lg hover:bg-emerald-100 ios-touch-optimize"
              >
                <FiMenu className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              {/* Desktop collapse button */}
              <button
                onClick={toggleSidebarCollapse}
                className="hidden lg:flex text-emerald-700 hover:text-emerald-600 transition-colors p-2 rounded-lg hover:bg-emerald-100 ios-touch-optimize"
              >
                {sidebarCollapsed ? <FiChevronRight className="h-5 w-5" /> : <FiChevronLeft className="h-5 w-5" />}
              </button>

              <h1 className="text-lg sm:text-xl font-semibold text-emerald-900">
                Analytics
              </h1>
            </div>

            {/* User Profile */}
            <button 
              onClick={() => router.push('/pages/settings')}
              className="flex items-center space-x-2 sm:space-x-3 hover:bg-emerald-50 rounded-lg p-2 transition-colors cursor-pointer ios-touch-optimize"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                <FiUser className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="hidden xs:block">
                <p className="text-emerald-900 font-medium text-xs sm:text-sm truncate max-w-24 sm:max-w-none">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-emerald-600 text-xs truncate max-w-24 sm:max-w-none">@{user?.username}</p>
              </div>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 pb-20 sm:pb-24">
          {/* Period Selector */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedPeriod(option.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ios-touch-optimize ${
                    selectedPeriod === option.value
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-emerald-900 hover:bg-emerald-50 border border-emerald-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {analyticsData ? (
            <div className="space-y-6 sm:space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600">Total Expenses</p>
                      <p className="text-2xl sm:text-3xl font-bold text-emerald-900">
                        ${analyticsData.summary.total_expenses.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <FiDollarSign className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600">Transactions</p>
                      <p className="text-2xl sm:text-3xl font-bold text-emerald-900">
                        {analyticsData.summary.total_transactions}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <FiBarChart className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600">Average Transaction</p>
                      <p className="text-2xl sm:text-3xl font-bold text-emerald-900">
                        ${analyticsData.summary.average_transaction.toFixed(2)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <FiBarChart className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600">Largest Expense</p>
                      <p className="text-2xl sm:text-3xl font-bold text-emerald-900">
                        ${analyticsData.summary.largest_expense.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <FiCalendar className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </div>
              </div>

               {/* Charts Grid */}
               <div className="space-y-6 sm:space-y-8">
                 {/* Top Row - Two Charts Side by Side */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                   {/* Category Breakdown Pie Chart */}
                   <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-emerald-200">
                     <h3 className="text-lg font-semibold text-emerald-900 mb-4 flex items-center">
                       <FiPieChart className="h-5 w-5 mr-2" />
                       Category Breakdown
                     </h3>
                     <div className="h-64 sm:h-72">
                       {analyticsData.category_breakdown && analyticsData.category_breakdown.length > 0 ? (
                         <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                             <Pie
                               data={analyticsData.category_breakdown}
                               cx="50%"
                               cy="50%"
                               labelLine={false}
                               label={({ percentage }) => `${percentage.toFixed(1)}%`}
                               outerRadius={70}
                               fill="#8884d8"
                               dataKey="amount"
                             >
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                               {analyticsData.category_breakdown.map((entry: any, index: number) => (
                                 <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category)} />
                               ))}
                             </Pie>
                             <Tooltip 
                               formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                               contentStyle={{
                                 backgroundColor: 'white',
                                 border: '1px solid #e5e7eb',
                                 borderRadius: '8px',
                                 color: '#111827'
                               }}
                               labelStyle={{
                                 color: '#111827',
                                 fontWeight: '500'
                               }}
                             />
                           </PieChart>
                         </ResponsiveContainer>
                       ) : (
                         <div className="flex items-center justify-center h-full">
                           <div className="text-center">
                             <FiPieChart className="h-12 w-12 text-emerald-300 mx-auto mb-2" />
                             <p className="text-emerald-600 text-sm">No category data available</p>
                           </div>
                         </div>
                       )}
                     </div>
                     
                     {/* Custom Legend */}
                     {analyticsData.category_breakdown && analyticsData.category_breakdown.length > 0 && (
                       <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                         {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                         {analyticsData.category_breakdown.map((entry: any, index: number) => {
                           const categoryName = typeof entry.category === 'string' ? entry.category : String(entry.category || '');
                           return (
                             <div key={index} className="flex items-center space-x-2">
                               <div 
                                 className="w-4 h-4 rounded-full flex-shrink-0"
                                 style={{ backgroundColor: getCategoryColor(categoryName) }}
                               ></div>
                               <div className="flex-1 min-w-0">
                                 <p className="text-sm font-medium text-emerald-900 truncate">
                                   {categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
                                 </p>
                                 <p className="text-xs text-emerald-600">
                                   ${entry.amount.toLocaleString()} ({entry.percentage.toFixed(1)}%)
                                 </p>
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     )}
                   </div>

                   {/* Monthly Trend Bar Chart */}
                   <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-emerald-200">
                     <h3 className="text-lg font-semibold text-emerald-900 mb-4 sm:mb-16 flex items-center">
                       <FiBarChart className="h-5 w-5 mr-2" />
                       Spending Trend
                     </h3>
                     <div className="h-64 sm:h-72">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart 
                           data={analyticsData.monthly_trend && analyticsData.monthly_trend.length > 0 ? analyticsData.monthly_trend : [
                             { month: '2024-01', expenses: 0, transaction_count: 0 },
                             { month: '2024-02', expenses: 0, transaction_count: 0 },
                             { month: '2024-03', expenses: 0, transaction_count: 0 }
                           ]}
                           margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                         >
                           <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                           <XAxis 
                             dataKey="month" 
                             stroke="#6b7280"
                             tick={{ fontSize: 10 }}
                             angle={-45}
                             textAnchor="end"
                             height={60}
                             interval="preserveStartEnd"
                           />
                           <YAxis 
                             stroke="#6b7280"
                             tick={{ fontSize: 10 }}
                             tickFormatter={(value) => `$${value.toLocaleString()}`}
                             width={60}
                           />
                           <Tooltip 
                             formatter={(value: number) => [`$${value.toLocaleString()}`, 'Expenses']}
                             labelFormatter={(label) => `Period: ${label}`}
                             contentStyle={{
                               backgroundColor: 'white',
                               border: '1px solid #e5e7eb',
                               borderRadius: '8px',
                               color: '#111827'
                             }}
                             labelStyle={{
                               color: '#111827',
                               fontWeight: '500'
                             }}
                           />
                           <Bar 
                             dataKey="expenses" 
                             fill="#10b981"
                             radius={[4, 4, 0, 0]}
                           />
                         </BarChart>
                       </ResponsiveContainer>
                     </div>
                     
                     {/* Data status */}
                     {(!analyticsData.monthly_trend || analyticsData.monthly_trend.length === 0) && (
                       <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                         <p className="text-sm text-amber-800">
                           No spending data available for the selected period. Add some transactions to see your spending trend.
                         </p>
                       </div>
                     )}
                   </div>
                 </div>

                 {/* Daily Spending Area Chart - Full Width */}
                 <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-emerald-200">
                   <h3 className="text-lg font-semibold text-emerald-900 mb-4 flex items-center">
                     <FiCalendar className="h-5 w-5 mr-2" />
                     Daily Spending (Last 30 Days)
                   </h3>
                   <div className="h-64 sm:h-72">
                     <ResponsiveContainer width="100%" height="100%">
                       <AreaChart 
                         data={analyticsData.daily_spending}
                         margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                       >
                         <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                         <XAxis 
                           dataKey="date" 
                           stroke="#6b7280" 
                           tick={{ fontSize: 10 }}
                           interval="preserveStartEnd"
                         />
                         <YAxis 
                           stroke="#6b7280" 
                           tick={{ fontSize: 10 }}
                           tickFormatter={(value) => `$${value.toLocaleString()}`}
                         />
                         <Tooltip 
                           formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                           contentStyle={{
                             backgroundColor: 'white',
                             border: '1px solid #e5e7eb',
                             borderRadius: '8px',
                             color: '#111827'
                           }}
                           labelStyle={{
                             color: '#111827',
                             fontWeight: '500'
                           }}
                         />
                         <Area 
                           type="monotone" 
                           dataKey="amount" 
                           stroke="#10b981" 
                           fill="#10b981" 
                           fillOpacity={0.3}
                           strokeWidth={2}
                         />
                       </AreaChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
               </div>

              {/* Additional Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Top Merchants */}
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-emerald-200">
                  <h3 className="text-lg font-semibold text-emerald-900 mb-4">Top Merchants</h3>
                  <div className="space-y-3">
                   {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {analyticsData.top_merchants.slice(0, 5).map((merchant: any, index: number) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-emerald-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-emerald-600">{index + 1}</span>
                          </div>
                          <span className="font-medium text-emerald-900">{merchant.merchant}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-emerald-900">${merchant.amount.toLocaleString()}</p>
                          <p className="text-sm text-emerald-600">{merchant.count} transactions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spending Patterns */}
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-emerald-200">
                  <h3 className="text-lg font-semibold text-emerald-900 mb-4">Spending Patterns</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-emerald-100">
                      <span className="font-medium text-emerald-700">Weekday Average</span>
                      <span className="font-semibold text-emerald-900">${analyticsData.spending_patterns.weekday_average.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-emerald-100">
                      <span className="font-medium text-emerald-700">Weekend Average</span>
                      <span className="font-semibold text-emerald-900">${analyticsData.spending_patterns.weekend_average.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="font-medium text-emerald-700">Monthly Average</span>
                      <span className="font-semibold text-emerald-900">${analyticsData.spending_patterns.monthly_average.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FiBarChart className="h-16 w-16 text-emerald-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-emerald-900 mb-2">No Analytics Data</h3>
              <p className="text-emerald-600">Start adding transactions to see your spending analytics.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
