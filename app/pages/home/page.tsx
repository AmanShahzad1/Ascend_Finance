'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiUser, FiMenu, FiPlus, FiChevronLeft, FiChevronRight, FiEye, FiX, FiDollarSign, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import DashboardSidebar from '@/components/DashboardSidebar';
import CategoryCard from '@/components/CategoryCard';
import AddTransactionModal from '@/components/AddTransactionModal';

export default function HomePage() {
  const { user, logout, isAuthenticated, isLoading, getDashboardData, getExpenses } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Transaction history states
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/pages/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load dashboard data and transactions when user is authenticated
  useEffect(() => {
    const loadDashboardData = async () => {
      if (isAuthenticated && !isLoading) {
        setDataLoading(true);
        try {
          const result = await getDashboardData('month');
          if (result.success && result.data) {
            setDashboardData(result.data);
          } else {
            console.error('Failed to load dashboard data:', result.message);
          }
        } catch (error) {
          console.error('Error loading dashboard data:', error);
          toast.error('Error loading dashboard data. Please try again.');
        } finally {
          setDataLoading(false);
        }
      }
    };

    const loadTransactions = async () => {
      if (isAuthenticated && !isLoading) {
        setTransactionsLoading(true);
        try {
          const result = await getExpenses({ limit: 8 });
          if (result.success && result.data) {
            setTransactions(result.data.expenses);
          } else {
            console.error('Failed to load transactions:', result.message);
          }
        } catch (error) {
          console.error('Error loading transactions:', error);
          toast.error('Error loading transactions. Please try again.');
        } finally {
          setTransactionsLoading(false);
        }
      }
    };

    loadDashboardData();
    loadTransactions();
  }, [isAuthenticated, isLoading, getDashboardData, getExpenses, refreshTrigger]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
    router.push('/');
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setShowAddTransaction(true);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleTransactionAdded = async () => {
    // Refresh dashboard data after transaction is added
    try {
      const result = await getDashboardData('month');
      if (result.success && result.data) {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    }
    // Trigger transaction history refresh
    setRefreshTrigger(prev => prev + 1);
  };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleViewDetails = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const handleViewAll = () => {
    router.push('/pages/transactions');
  };

  const loadTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const result = await getExpenses({ limit: 8 });
      if (result.success && result.data) {
        setTransactions(result.data.expenses);
      } else {
        console.error('Failed to load transactions:', result.message);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Error loading transactions. Please try again.');
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Helper functions
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      necessity: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      investment: 'bg-green-100 text-green-800 border-green-200',
      status: 'bg-red-100 text-red-800 border-red-200',
      savings: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 flex">
        <DashboardSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
          user={user}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          currentPath="/pages/home"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-emerald-700 text-lg">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
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
        currentPath="/pages/home"
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
                className="text-emerald-700 hover:text-emerald-600 transition-colors hidden lg:block p-2 rounded-lg hover:bg-emerald-100 ios-touch-optimize"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? <FiChevronRight className="h-5 w-5" /> : <FiChevronLeft className="h-5 w-5" />}
              </button>
              
              <h1 className="text-lg sm:text-xl font-semibold text-emerald-900">
                Dashboard
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

        {/* Dashboard Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 pb-20 sm:pb-24">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-emerald-900 mb-2">
                Master your money. Liberate your life.
              </h2>
              <p className="text-emerald-700 text-base sm:text-lg">
                Track your expenses across the four essential categories
              </p>
            </div>

            {/* Four Category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {dataLoading ? (
                // Loading skeleton
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 animate-pulse">
                    <div className="w-16 h-16 bg-emerald-200 rounded-full mx-auto mb-3"></div>
                    <div className="h-6 bg-emerald-200 rounded mb-2"></div>
                    <div className="h-4 bg-emerald-200 rounded mb-3"></div>
                    <div className="h-8 bg-emerald-200 rounded"></div>
                  </div>
                ))
              ) : (
                <>
                  <CategoryCard
                    category="necessity"
                    title="Necessity"
                    description="Essential expenses"
                    color="yellow"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    amount={dashboardData?.categories?.find((c: any) => c.category === 'necessity')?.expense_amount || 0}
                    onClick={() => handleCategoryClick('necessity')}
                  />
                  <CategoryCard
                    category="investment"
                    title="Investment"
                    description="Value-adding expenses"
                    color="green"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    amount={dashboardData?.categories?.find((c: any) => c.category === 'investment')?.expense_amount || 0}
                    onClick={() => handleCategoryClick('investment')}
                  />
                  <CategoryCard
                    category="status"
                    title="Status"
                    description="Luxury & indulgence"
                    color="red"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    amount={dashboardData?.categories?.find((c: any) => c.category === 'status')?.expense_amount || 0}
                    onClick={() => handleCategoryClick('status')}
                  />
                  <CategoryCard
                    category="savings"
                    title="Savings"
                    description="Money set aside"
                    color="blue"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    amount={dashboardData?.categories?.find((c: any) => c.category === 'savings')?.expense_amount || 0}
                    onClick={() => handleCategoryClick('savings')}
                  />
                </>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="mt-6 sm:mt-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-emerald-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-emerald-900">Recent Transactions</h3>
                  <div className="flex items-center space-x-3">
                    
                    <button
                      onClick={handleViewAll}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium cursor-pointer flex items-center ios-touch-optimize"
                    >
                      <FiEye className="h-4 w-4 mr-1" />
                      View All
                    </button>
                    <button
                      onClick={loadTransactions}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium cursor-pointer flex items-center ios-touch-optimize"
                    >
                      <FiRefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </button>
                  </div>
                </div>

                {transactionsLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-emerald-600">Loading transactions...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="p-8 text-center">
                    <FiDollarSign className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                    <p className="text-emerald-600 mb-2">No transactions found</p>
                    <p className="text-emerald-500 text-sm mb-4">Start tracking your expenses to see them here</p>
                    <button
                      onClick={() => setShowAddTransaction(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer ios-touch-optimize"
                    >
                      Add First Transaction
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div 
                        key={transaction.id} 
                        className="p-4 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                        onClick={() => handleViewDetails(transaction)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-emerald-900 font-medium">{transaction.description}</p>
                            {transaction.merchant_name && (
                              <p className="text-emerald-600 text-sm">@{transaction.merchant_name}</p>
                            )}
                          </div>
                          <p className="text-emerald-900 font-semibold">{formatAmount(transaction.amount)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(transaction.category_name)}`}>
                            {transaction.category_name}
                          </span>
                          <p className="text-emerald-600 text-xs">{formatDate(transaction.transaction_date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Floating Action Button */}
        <button
          onClick={() => setShowAddTransaction(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-emerald-600 hover:bg-emerald-700 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 cursor-pointer ios-touch-optimize"
          title="Add Transaction"
        >
          <FiPlus className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <AddTransactionModal
          isOpen={showAddTransaction}
          onClose={() => {
            setShowAddTransaction(false);
            setSelectedCategory(null);
          }}
          selectedCategory={selectedCategory}
          onTransactionAdded={handleTransactionAdded}
        />
      )}

      {/* Transaction Details Modal */}
      {showTransactionDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-xl border border-emerald-200/30">
            <div className="flex items-center justify-between p-6 border-b border-emerald-200/30 sticky top-0 bg-white/95 backdrop-blur-sm rounded-t-2xl">
              <h3 className="text-lg font-semibold text-emerald-900">Transaction Details</h3>
              <button
                onClick={() => setShowTransactionDetails(false)}
                className="text-emerald-600 hover:text-emerald-700 ios-touch-optimize"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <label className="text-sm font-medium text-emerald-700 flex-shrink-0 w-24">Description</label>
                  <p className="text-emerald-900 text-right flex-1 ml-4">{selectedTransaction.description}</p>
                </div>
                
                {selectedTransaction.merchant_name && (
                  <div className="flex justify-between items-start">
                    <label className="text-sm font-medium text-emerald-700 flex-shrink-0 w-24">Merchant</label>
                    <p className="text-emerald-900 text-right flex-1 ml-4">@{selectedTransaction.merchant_name}</p>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-emerald-700 flex-shrink-0 w-24">Category</label>
                  <div className="flex-1 ml-4 flex justify-end">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(selectedTransaction.category_name)}`}>
                      {selectedTransaction.category_name}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-emerald-700 flex-shrink-0 w-24">Amount</label>
                  <p className="text-emerald-900 font-semibold text-lg text-right flex-1 ml-4">{formatAmount(selectedTransaction.amount)}</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-emerald-700 flex-shrink-0 w-24">Date</label>
                  <p className="text-emerald-900 text-right flex-1 ml-4">{formatDate(selectedTransaction.transaction_date)}</p>
                </div>
                
                {selectedTransaction.payment_method && (
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-emerald-700 flex-shrink-0 w-24">Payment Method</label>
                    <p className="text-emerald-900 capitalize text-right flex-1 ml-4">{selectedTransaction.payment_method.replace('_', ' ')}</p>
                  </div>
                )}
                
                {selectedTransaction.notes && (
                  <div className="flex justify-between items-start">
                    <label className="text-sm font-medium text-emerald-700 flex-shrink-0 w-24">Notes</label>
                    <p className="text-emerald-900 text-right flex-1 ml-4">{selectedTransaction.notes}</p>
                  </div>
                )}
                
                {selectedTransaction.tags && selectedTransaction.tags.length > 0 && (
                  <div className="flex justify-between items-start">
                    <label className="text-sm font-medium text-emerald-700 flex-shrink-0 w-24">Tags</label>
                    <div className="flex flex-wrap gap-1 flex-1 ml-4 justify-end">
                      {selectedTransaction.tags.map((tag: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-emerald-200/30 bg-emerald-50/50 rounded-b-2xl">
              <button 
                onClick={() => setShowTransactionDetails(false)}
                className="px-4 py-2 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer ios-touch-optimize"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
