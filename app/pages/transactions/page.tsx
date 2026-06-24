'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiUser, FiMenu, FiPlus, FiChevronLeft, FiChevronRight, FiSearch, FiEdit, FiTrash2, FiEye, FiDollarSign, FiX, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import DashboardSidebar from '@/components/DashboardSidebar';
import AddTransactionModal from '@/components/AddTransactionModal';

interface Transaction {
  id: string;
  transaction_type: 'expense';
  amount: number;
  description: string;
  transaction_date: string;
  merchant_name?: string;
  payment_method?: string;
  location?: string;
  notes?: string;
  tags?: string[];
  category_name: string;
  created_at: string;
}

export default function TransactionsPage() {
  const { user, logout, isAuthenticated, isLoading, getExpenses, updateExpense, deleteExpense, getCategories } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [showEditTransaction, setShowEditTransaction] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [categories, setCategories] = useState<any[]>([]);
  const [editFormData, setEditFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: '',
    merchant_name: '',
    payment_method: '',
    location: '',
    notes: '',
    tags: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editErrors, setEditErrors] = useState<{[key: string]: string}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Success/Error dialog states for edit transaction
  const [showEditSuccessDialog, setShowEditSuccessDialog] = useState(false);
  const [showEditErrorDialog, setShowEditErrorDialog] = useState(false);
  const [editErrorMessage, setEditErrorMessage] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/pages/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Reset to page 1 when filters change
      if (categoryFilter !== '' || searchTerm !== '') {
        setCurrentPage(1);
      }
      loadTransactions();
      loadCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, refreshTrigger, isAuthenticated, isLoading, categoryFilter, searchTerm]);

  const loadCategories = async () => {
    try {
      const result = await getCategories();
      if (result.success && result.data) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTransactions = async () => {
    if (!isAuthenticated || isLoading) {
      console.log('Skipping loadTransactions - not authenticated or still loading');
      return;
    }

    try {
      setLoading(true);
      console.log('Loading transactions with params:', {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        category: categoryFilter || undefined
      });
      
      const result = await getExpenses({ 
        limit: itemsPerPage, 
        offset: (currentPage - 1) * itemsPerPage,
        category: categoryFilter || undefined,
        search: searchTerm || undefined
      });
      
      console.log('Transactions result:', result);
      
      if (result.success && result.data) {
        setTransactions(result.data.expenses);
        setTotalPages(Math.ceil(result.data.pagination.total / itemsPerPage));
        console.log('Transactions loaded:', result.data.expenses.length);
      } else {
        console.error('Failed to load transactions:', result.message);
        toast.error('Failed to load transactions');
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/pages/login');
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleTransactionAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setShowAddTransaction(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to page 1 when searching
    setCurrentPage(1);
    loadTransactions();
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category === categoryFilter ? '' : category);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setCurrentPage(1);
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditFormData({
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category_name,
      date: formatDateForInput(transaction.transaction_date),
      merchant_name: transaction.merchant_name || '',
      payment_method: transaction.payment_method || '',
      location: transaction.location || '',
      notes: transaction.notes || '',
      tags: transaction.tags ? transaction.tags.join(', ') : ''
    });
    setEditErrors({}); // Clear any previous errors
    setShowEditTransaction(true);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    // Show warning alert before deletion
    const confirmed = window.confirm(
      `⚠️ WARNING: You are about to permanently delete this transaction.\n\n` +
      `Transaction: ${transactionToDelete.description}\n` +
      `Amount: ${formatAmount(transactionToDelete.amount)}\n` +
      `Date: ${formatDate(transactionToDelete.transaction_date)}\n\n` +
      `This action CANNOT be undone. Are you absolutely sure you want to continue?`
    );

    if (!confirmed) {
      return; // User cancelled the deletion
    }

    try {
      const result = await deleteExpense(transactionToDelete.id);
      if (result.success) {
        toast.success('Transaction deleted successfully');
        setTransactionToDelete(null);
        setRefreshTrigger(prev => prev + 1);
      } else {
        toast.error(result.message || 'Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  const validateEditForm = () => {
    const errors: {[key: string]: string} = {};

    // Amount validation
    if (!editFormData.amount || editFormData.amount.trim() === '') {
      errors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(editFormData.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.amount = 'Amount must be a positive number';
      } else if (amount > 999999.99) {
        errors.amount = 'Amount cannot exceed $999,999.99';
      }
    }

    // Description validation
    if (!editFormData.description || editFormData.description.trim() === '') {
      errors.description = 'Description is required';
    } else if (editFormData.description.trim().length < 3) {
      errors.description = 'Description must be at least 3 characters long';
    } else if (editFormData.description.trim().length > 100) {
      errors.description = 'Description cannot exceed 100 characters';
    }

    // Category validation
    if (!editFormData.category || editFormData.category.trim() === '') {
      errors.category = 'Category is required';
    }

    // Date validation
    if (!editFormData.date || editFormData.date.trim() === '') {
      errors.date = 'Date is required';
    } else {
      const selectedDate = new Date(editFormData.date);
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      
      if (selectedDate > today) {
        errors.date = 'Date cannot be in the future';
      } else if (selectedDate < oneYearAgo) {
        errors.date = 'Date cannot be more than 1 year ago';
      }
    }

    // Merchant name validation (optional)
    if (editFormData.merchant_name && editFormData.merchant_name.trim().length > 50) {
      errors.merchant_name = 'Merchant name cannot exceed 50 characters';
    }

    // Notes validation (optional)
    if (editFormData.notes && editFormData.notes.trim().length > 200) {
      errors.notes = 'Notes cannot exceed 200 characters';
    }

    // Tags validation (optional)
    if (editFormData.tags && editFormData.tags.trim() !== '') {
      const tags = editFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      if (tags.length > 5) {
        errors.tags = 'Maximum 5 tags allowed';
      } else {
        for (const tag of tags) {
          if (tag.length > 20) {
            errors.tags = 'Each tag cannot exceed 20 characters';
            break;
          }
        }
      }
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData({ ...editFormData, [field]: value });
    // Clear error for this field when user starts typing
    if (editErrors[field]) {
      setEditErrors({ ...editErrors, [field]: '' });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction || isEditSubmitting) return;

    // Validate form before submitting
    if (!validateEditForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setEditLoading(true);
    setIsEditSubmitting(true);
    try {
      const result = await updateExpense({
        id: selectedTransaction.id,
        transaction_type: 'expense' as const,
        amount: parseFloat(editFormData.amount),
        description: editFormData.description,
        category: editFormData.category,
        transaction_date: editFormData.date,
        merchant_name: editFormData.merchant_name || undefined,
        payment_method: editFormData.payment_method || undefined,
        location: editFormData.location || undefined,
        notes: editFormData.notes || undefined,
        tags: editFormData.tags ? editFormData.tags.split(',').map(tag => tag.trim()) : undefined
      });

      if (result.success) {
        setShowEditSuccessDialog(true);
        toast.success('Transaction updated successfully');
      } else {
        setEditErrorMessage(result.message || 'Failed to update transaction. Please try again.');
        setShowEditErrorDialog(true);
        toast.error(result.message || 'Failed to update transaction');
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      setEditErrorMessage('Failed to update transaction. Please try again.');
      setShowEditErrorDialog(true);
      toast.error('Failed to update transaction');
    } finally {
      setEditLoading(false);
      setIsEditSubmitting(false);
    }
  };

  const handleEditSuccessConfirm = () => {
    setShowEditSuccessDialog(false);
    setShowEditTransaction(false);
    setSelectedTransaction(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditErrorRetry = () => {
    setShowEditErrorDialog(false);
    setEditErrorMessage('');
  };

  const handleEditErrorClose = () => {
    setShowEditErrorDialog(false);
    setShowEditTransaction(false);
    setSelectedTransaction(null);
    setEditErrorMessage('');
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleTransactionUpdated = () => {
    setShowEditTransaction(false);
    setSelectedTransaction(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    // Use local timezone to avoid date shifting
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      necessity: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      investment: 'text-green-600 bg-green-50 border-green-200',
      status: 'text-red-600 bg-red-50 border-red-200',
      savings: 'text-blue-600 bg-blue-50 border-blue-200',
    };
    return colors[category] || 'text-gray-600 bg-gray-50 border-gray-200';
  };


  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 flex overflow-hidden">
        <DashboardSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
          user={user}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          currentPath="/pages/transactions"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-emerald-700 text-lg">Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 flex overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        user={user}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        currentPath="/pages/transactions"
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 overflow-hidden ${sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'}`}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-emerald-200 px-3 sm:px-4 py-3 sm:py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-emerald-700 hover:text-emerald-600 transition-colors lg:hidden p-2 rounded-lg hover:bg-emerald-100 ios-touch-optimize"
              >
                <FiMenu className="h-5 w-5" />
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
                Transactions
              </h1>
            </div>
            
            {/* User Profile */}
            <button 
              onClick={() => router.push('/pages/settings')}
              className="flex items-center space-x-2 hover:bg-emerald-50 rounded-lg p-1.5 sm:p-2 transition-colors cursor-pointer ios-touch-optimize"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                <FiUser className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-emerald-900 font-medium text-xs sm:text-sm truncate max-w-20 sm:max-w-none">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-emerald-600 text-xs truncate max-w-20 sm:max-w-none">@{user?.username}</p>
              </div>
            </button>
          </div>
        </header>

        {/* Transactions Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-emerald-900 mb-2">
                All Transactions
              </h2>
              <p className="text-emerald-700 text-base sm:text-lg">
                View and manage all your expense transactions
              </p>
            </div>

            {/* Filters and Search */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-emerald-200 shadow-sm mb-6">
              <div className="flex flex-col gap-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="w-full">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 placeholder-emerald-500 text-sm sm:text-base ios-input-fix"
                    />
                  </div>
                </form>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  {['necessity', 'investment', 'status', 'savings'].map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryFilter(category)}
                      className={`px-3 py-1.5 sm:py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ios-touch-optimize ${
                        categoryFilter === category
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                  
                  {/* Clear Filters Button */}
                  {(searchTerm || categoryFilter) && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1.5 sm:py-1 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200 hover:bg-red-100 transition-colors cursor-pointer ios-touch-optimize"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
              {loading ? (
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
                <>
                  {/* Mobile scroll indicator - positioned above table */}
                  <div className="sm:hidden bg-emerald-50 border-b border-emerald-200 px-4 py-2">
                    <div className="flex items-center justify-center space-x-2 text-emerald-600">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                      <span className="text-xs font-medium">Swipe horizontally to view all columns</span>
                    </div>
                  </div>
                  
                  {/* Table Container with Horizontal Scroll */}
                  <div className="overflow-x-auto relative">
                    <table className="w-full min-w-[700px] sm:min-w-[800px]">
                      <thead className="bg-emerald-50 border-b border-emerald-200">
                        <tr>
                          <th className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">
                            Transaction
                          </th>
                          <th className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-200">
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-emerald-50 transition-colors">
                            <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4">
                              <div>
                                <p className="text-emerald-900 font-medium text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{transaction.description}</p>
                                {transaction.merchant_name && (
                                  <p className="text-emerald-600 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">@{transaction.merchant_name}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(transaction.category_name)}`}>
                                {transaction.category_name}
                              </span>
                            </td>
                            <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4">
                              <p className="text-emerald-900 font-semibold text-sm sm:text-base">{formatAmount(transaction.amount)}</p>
                            </td>
                            <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4">
                              <p className="text-emerald-600 text-xs sm:text-sm">{formatDate(transaction.transaction_date)}</p>
                            </td>
                            <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4">
                              <div className="flex space-x-1 sm:space-x-2">
                                <button
                                  onClick={() => handleViewDetails(transaction)}
                                  className="text-emerald-600 hover:text-emerald-700 p-1 rounded transition-colors cursor-pointer ios-touch-optimize"
                                  title="View Details"
                                >
                                  <FiEye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEditTransaction(transaction)}
                                  className="text-emerald-600 hover:text-emerald-700 p-1 rounded transition-colors cursor-pointer ios-touch-optimize"
                                  title="Edit"
                                >
                                  <FiEdit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTransaction(transaction)}
                                  className="text-red-600 hover:text-red-700 p-1 rounded transition-colors cursor-pointer ios-touch-optimize"
                                  title="Delete"
                                >
                                  <FiTrash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards - Hidden in favor of scrollable table */}
                  <div className="hidden">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="p-4 border-b border-emerald-200 last:border-b-0">
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-3 sm:px-6 py-4 border-t border-emerald-200 bg-emerald-50">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                        <p className="text-sm text-emerald-600 order-2 sm:order-1">
                          Page {currentPage} of {totalPages}
                        </p>
                        <div className="flex space-x-2 order-1 sm:order-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm border border-emerald-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-100 transition-colors ios-touch-optimize"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm border border-emerald-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-100 transition-colors ios-touch-optimize"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>

        {/* Floating Action Button */}
        <button
          onClick={() => setShowAddTransaction(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-emerald-600 hover:bg-emerald-700 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 cursor-pointer ios-touch-optimize"
          title="Add Transaction"
        >
          <FiPlus className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <AddTransactionModal
          isOpen={showAddTransaction}
          onClose={() => setShowAddTransaction(false)}
          onTransactionAdded={handleTransactionAdded}
        />
      )}

      {/* Transaction Details Modal */}
      {showTransactionDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-xl border border-emerald-200/30">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-emerald-200/30 sticky top-0 bg-white/95 backdrop-blur-sm rounded-t-2xl">
              <h3 className="text-lg font-semibold text-emerald-900">Transaction Details</h3>
              <button
                onClick={() => setShowTransactionDetails(false)}
                className="text-emerald-600 hover:text-emerald-700 transition-colors p-1 cursor-pointer ios-touch-optimize"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0">
                  <label className="text-sm font-medium text-emerald-700 sm:flex-shrink-0 sm:w-24">Description</label>
                  <p className="text-emerald-900 sm:text-right flex-1 sm:ml-4 break-words">{selectedTransaction.description}</p>
                </div>
                
                {selectedTransaction.merchant_name && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0">
                    <label className="text-sm font-medium text-emerald-700 sm:flex-shrink-0 sm:w-24">Merchant</label>
                    <p className="text-emerald-900 sm:text-right flex-1 sm:ml-4 break-words">@{selectedTransaction.merchant_name}</p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                  <label className="text-sm font-medium text-emerald-700 sm:flex-shrink-0 sm:w-24">Category</label>
                  <div className="flex-1 sm:ml-4 flex sm:justify-end">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(selectedTransaction.category_name)}`}>
                      {selectedTransaction.category_name}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                  <label className="text-sm font-medium text-emerald-700 sm:flex-shrink-0 sm:w-24">Amount</label>
                  <p className="text-emerald-900 font-semibold text-lg sm:text-right flex-1 sm:ml-4">{formatAmount(selectedTransaction.amount)}</p>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                  <label className="text-sm font-medium text-emerald-700 sm:flex-shrink-0 sm:w-24">Date</label>
                  <p className="text-emerald-900 sm:text-right flex-1 sm:ml-4">{formatDate(selectedTransaction.transaction_date)}</p>
                </div>
                
                {selectedTransaction.payment_method && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                    <label className="text-sm font-medium text-emerald-700 sm:flex-shrink-0 sm:w-24">Payment Method</label>
                    <p className="text-emerald-900 capitalize sm:text-right flex-1 sm:ml-4">{selectedTransaction.payment_method.replace('_', ' ')}</p>
                  </div>
                )}
                
                {selectedTransaction.notes && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0">
                    <label className="text-sm font-medium text-emerald-700 sm:flex-shrink-0 sm:w-24">Notes</label>
                    <p className="text-emerald-900 sm:text-right flex-1 sm:ml-4 break-words">{selectedTransaction.notes}</p>
                  </div>
                )}
                
                {selectedTransaction.tags && selectedTransaction.tags.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0">
                    <label className="text-sm font-medium text-emerald-700 sm:flex-shrink-0 sm:w-24">Tags</label>
                    <div className="flex flex-wrap gap-1 flex-1 sm:ml-4 sm:justify-end">
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
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-emerald-200/30 bg-emerald-50/50 rounded-b-2xl">
              <button
                onClick={() => setShowTransactionDetails(false)}
                className="px-4 py-2 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors w-full sm:w-auto cursor-pointer ios-touch-optimize"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowTransactionDetails(false);
                  handleEditTransaction(selectedTransaction);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors w-full sm:w-auto cursor-pointer ios-touch-optimize"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditTransaction && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-xl border border-emerald-200/30">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-emerald-200/30 sticky top-0 bg-white/95 backdrop-blur-sm rounded-t-2xl">
              <h3 className="text-lg font-semibold text-emerald-900">Edit Transaction</h3>
              <button
                onClick={() => setShowEditTransaction(false)}
                className="text-emerald-600 hover:text-emerald-700 transition-colors p-1 cursor-pointer ios-touch-optimize"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-700 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editFormData.amount}
                    onChange={(e) => handleEditInputChange('amount', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 ios-input-fix ${
                      editErrors.amount ? 'border-red-300 focus:ring-red-500/50 focus:border-red-500' : 'border-emerald-200'
                    }`}
                    required
                  />
                  {editErrors.amount && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.amount}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-emerald-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => handleEditInputChange('date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 ios-input-fix ${
                      editErrors.date ? 'border-red-300 focus:ring-red-500/50 focus:border-red-500' : 'border-emerald-200'
                    }`}
                    required
                  />
                  {editErrors.date && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.date}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.description}
                  onChange={(e) => handleEditInputChange('description', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 ios-input-fix ${
                    editErrors.description ? 'border-red-300 focus:ring-red-500/50 focus:border-red-500' : 'border-emerald-200'
                  }`}
                  required
                />
                {editErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{editErrors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFormData.category}
                  onChange={(e) => handleEditInputChange('category', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 ios-input-fix ${
                    editErrors.category ? 'border-red-300 focus:ring-red-500/50 focus:border-red-500' : 'border-emerald-200'
                  }`}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                    </option>
                  ))}
                </select>
                {editErrors.category && (
                  <p className="mt-1 text-sm text-red-600">{editErrors.category}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-700 mb-1">Merchant</label>
                  <input
                    type="text"
                    value={editFormData.merchant_name}
                    onChange={(e) => handleEditInputChange('merchant_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 ios-input-fix ${
                      editErrors.merchant_name ? 'border-red-300 focus:ring-red-500/50 focus:border-red-500' : 'border-emerald-200'
                    }`}
                    placeholder="e.g., Amazon, Starbucks"
                  />
                  {editErrors.merchant_name && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.merchant_name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-emerald-700 mb-1">Payment Method</label>
                  <select
                    value={editFormData.payment_method}
                    onChange={(e) => handleEditInputChange('payment_method', e.target.value)}
                    className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 ios-input-fix"
                  >
                    <option value="">Select payment method</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="digital_wallet">Digital Wallet</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-emerald-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900"
                />
              </div> */}

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-1">Notes</label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => handleEditInputChange('notes', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 ios-input-fix ${
                    editErrors.notes ? 'border-red-300 focus:ring-red-500/50 focus:border-red-500' : 'border-emerald-200'
                  }`}
                  placeholder="Optional notes about this transaction"
                />
                {editErrors.notes && (
                  <p className="mt-1 text-sm text-red-600">{editErrors.notes}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={editFormData.tags}
                  onChange={(e) => handleEditInputChange('tags', e.target.value)}
                  placeholder="Enter tags separated by commas"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 ios-input-fix ${
                    editErrors.tags ? 'border-red-300 focus:ring-red-500/50 focus:border-red-500' : 'border-emerald-200'
                  }`}
                />
                {editErrors.tags && (
                  <p className="mt-1 text-sm text-red-600">{editErrors.tags}</p>
                )}
              </div>
              
              {/* Required fields note */}
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-700">
                  <span className="text-red-500">*</span> Required fields
                </p>
              </div>
            </form>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-emerald-200/30 bg-emerald-50/50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowEditTransaction(false)}
                className="px-4 py-2 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer w-full sm:w-auto ios-touch-optimize"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSubmit}
                disabled={editLoading || isEditSubmitting}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer w-full sm:w-auto ios-touch-optimize"
              >
                {(editLoading || isEditSubmitting) && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                <span>{editLoading || isEditSubmitting ? 'Updating...' : 'Update Transaction'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {transactionToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-xl border border-red-200/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-900 flex items-center">
                <FiAlertTriangle className="h-5 w-5 mr-2" />
                Delete Transaction
              </h3>
              <button
                onClick={() => setTransactionToDelete(null)}
                className="text-emerald-600 hover:text-emerald-700 transition-colors p-1 cursor-pointer ios-touch-optimize"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            {/* Warning Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <FiAlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-1">Warning</h4>
                  <p className="text-sm text-red-700">
                    This action cannot be undone. The transaction will be permanently deleted from your records.
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-emerald-700 mb-4">
              Are you sure you want to delete this transaction?
            </p>
            
            <div className="bg-emerald-50 p-3 rounded-lg mb-4">
              <p className="text-emerald-900 font-medium break-words">{transactionToDelete.description}</p>
              <p className="text-emerald-600 text-sm">{formatAmount(transactionToDelete.amount)} • {formatDate(transactionToDelete.transaction_date)}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setTransactionToDelete(null)}
                className="px-4 py-2 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors w-full sm:w-auto cursor-pointer ios-touch-optimize"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTransaction}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors w-full sm:w-auto cursor-pointer ios-touch-optimize"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Success Dialog */}
      {showEditSuccessDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-xl border border-emerald-200/30">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-emerald-900 mb-2">Transaction Updated!</h3>
              <p className="text-emerald-700 mb-6">
                Your transaction has been successfully updated and saved.
              </p>
              <button
                onClick={handleEditSuccessConfirm}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer ios-touch-optimize"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Error Dialog */}
      {showEditErrorDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-xl border border-red-200/30">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Update Failed</h3>
              <p className="text-red-700 mb-6">
                {editErrorMessage}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleEditErrorRetry}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer ios-touch-optimize"
                >
                  Try Again
                </button>
                <button
                  onClick={handleEditErrorClose}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer ios-touch-optimize"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
