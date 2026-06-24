'use client';

import { useState, useEffect } from 'react';
import { FiX, FiDollarSign, FiFileText, FiCalendar, FiTag, FiCreditCard, FiEdit3 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory?: string | null;
  onTransactionAdded?: () => void;
}

// Only expense transactions are supported

export default function AddTransactionModal({ 
  isOpen, 
  onClose, 
  selectedCategory,
  onTransactionAdded
}: AddTransactionModalProps) {
  const { addExpense, getCategories } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: selectedCategory || '',
    date: new Date().toISOString().split('T')[0],
    merchant_name: '',
    payment_method: '',
    location: '',
    notes: '',
    tags: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Amount validation
    if (!formData.amount || formData.amount.trim() === '') {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount))) {
      newErrors.amount = 'Amount must be a valid number';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (parseFloat(formData.amount) > 999999.99) {
      newErrors.amount = 'Amount cannot exceed $999,999.99';
    }

    // Description validation
    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 3) {
      newErrors.description = 'Description must be at least 3 characters long';
    } else if (formData.description.trim().length > 200) {
      newErrors.description = 'Description cannot exceed 200 characters';
    }

    // Category validation
    if (!formData.category || formData.category.trim() === '') {
      newErrors.category = 'Category is required';
    }

    // Date validation
    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      
      if (selectedDate > today) {
        newErrors.date = 'Date cannot be in the future';
      } else if (selectedDate < oneYearAgo) {
        newErrors.date = 'Date cannot be more than 1 year ago';
      }
    }

    // Merchant name validation (optional but if provided, validate)
    if (formData.merchant_name && formData.merchant_name.trim().length > 100) {
      newErrors.merchant_name = 'Merchant name cannot exceed 100 characters';
    }

    // Notes validation (optional but if provided, validate)
    if (formData.notes && formData.notes.trim().length > 500) {
      newErrors.notes = 'Notes cannot exceed 500 characters';
    }

    // Tags validation (optional but if provided, validate)
    if (formData.tags && formData.tags.trim().length > 200) {
      newErrors.tags = 'Tags cannot exceed 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    // Clear previous errors
    setErrors({});
    
    // Validate form before submission
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setIsLoading(true);
    setIsSubmitting(true);

    try {
      const transactionData = {
        transaction_type: 'expense' as const,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        transaction_date: formData.date,
        merchant_name: formData.merchant_name || undefined,
        payment_method: formData.payment_method || undefined,
        location: formData.location || undefined,
        notes: formData.notes || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : undefined
      };

      const result = await addExpense(transactionData);
      
      if (result.success) {
        // Show success dialog instead of immediate close
        setShowSuccessDialog(true);
        toast.success('Transaction added successfully!');
      } else {
        // Show error dialog with retry option
        setErrorMessage(result.message || 'Failed to add transaction. Please try again.');
        setShowErrorDialog(true);
        toast.error(result.message || 'Failed to add transaction. Please try again.');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      setErrorMessage('Failed to add transaction. Please try again.');
      setShowErrorDialog(true);
      toast.error('Failed to add transaction. Please try again.');
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessDialog(false);
    
    // Reset form
    setFormData({
      amount: '',
      description: '',
      category: selectedCategory || '',
      date: new Date().toISOString().split('T')[0],
      merchant_name: '',
      payment_method: '',
      location: '',
      notes: '',
      tags: ''
    });

    // Notify parent component to refresh data
    if (onTransactionAdded) {
      onTransactionAdded();
    }

    // Close modal
    onClose();
  };

  const handleErrorRetry = () => {
    setShowErrorDialog(false);
    setErrorMessage('');
  };

  const handleErrorClose = () => {
    setShowErrorDialog(false);
    setErrorMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-emerald-200 w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl">
        {/* Header - Sticky */}
        <div className="flex items-center justify-between p-6 border-b border-emerald-200 bg-white/95 backdrop-blur-sm rounded-t-2xl sticky top-0 z-10">
          <h2 className="text-xl font-bold text-emerald-900">
            Add Transaction
          </h2>
          <button
            onClick={onClose}
            className="text-emerald-700 hover:text-emerald-600 transition-colors cursor-pointer ios-touch-optimize"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Transaction Type - Fixed as Expense */}
          <div>
            <label className="block text-emerald-900 text-sm font-medium mb-3">
              Transaction Type
            </label>
            <div className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900">
              <span className="text-lg">📤</span>
              <span>Expense</span>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-emerald-900 text-sm font-medium mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-5 w-5" />
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
                className={`w-full pl-10 pr-4 py-3 bg-emerald-50 border rounded-lg text-emerald-900 placeholder-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ios-input-fix ${
                  errors.amount ? 'border-red-300 focus:border-red-500 focus:ring-red-500/50' : 'border-emerald-200 focus:border-emerald-500'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-emerald-900 text-sm font-medium mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiFileText className="absolute left-3 top-3 text-emerald-500 h-5 w-5" />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter transaction description..."
                required
                rows={3}
                className={`w-full pl-10 pr-4 py-3 bg-emerald-50 border rounded-lg text-emerald-900 placeholder-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none ios-input-fix ${
                  errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500/50' : 'border-emerald-200 focus:border-emerald-500'
                }`}
              />
            </div>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-emerald-900 text-sm font-medium mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className={`w-full px-4 py-3 bg-emerald-50 border rounded-lg text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ios-input-fix ${
                errors.category ? 'border-red-300 focus:border-red-500 focus:ring-red-500/50' : 'border-emerald-200 focus:border-emerald-500'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-emerald-900 text-sm font-medium mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-5 w-5" />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className={`w-full pl-10 pr-4 py-3 bg-emerald-50 border rounded-lg text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ios-input-fix ${
                  errors.date ? 'border-red-300 focus:border-red-500 focus:ring-red-500/50' : 'border-emerald-200 focus:border-emerald-500'
                }`}
              />
            </div>
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            )}
          </div>

          {/* Merchant Name */}
          <div>
            <label className="block text-emerald-900 text-sm font-medium mb-2">
              Merchant Name
            </label>
            <div className="relative">
              <FiEdit3 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-5 w-5" />
              <input
                type="text"
                name="merchant_name"
                value={formData.merchant_name}
                onChange={handleInputChange}
                placeholder="e.g., Walmart, Amazon, Starbucks"
                className={`w-full pl-10 pr-4 py-3 bg-emerald-50 border rounded-lg text-emerald-900 placeholder-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ios-input-fix ${
                  errors.merchant_name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/50' : 'border-emerald-200 focus:border-emerald-500'
                }`}
              />
            </div>
            {errors.merchant_name && (
              <p className="mt-1 text-sm text-red-600">{errors.merchant_name}</p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-emerald-900 text-sm font-medium mb-2">
              Payment Method
            </label>
            <div className="relative">
              <FiCreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-5 w-5" />
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 ios-input-fix"
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

          {/* Location
          <div>
            <label className="block text-emerald-900 text-sm font-medium mb-2">
              Location
            </label>
            <div className="relative">
              <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-5 w-5" />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., New York, NY or Store Address"
                className="w-full pl-10 pr-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 placeholder-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>
          </div> */}

          {/* Notes */}
          <div>
            <label className="block text-emerald-900 text-sm font-medium mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Additional notes about this transaction..."
              rows={3}
              className={`w-full px-4 py-3 bg-emerald-50 border rounded-lg text-emerald-900 placeholder-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none ios-input-fix ${
                errors.notes ? 'border-red-300 focus:border-red-500 focus:ring-red-500/50' : 'border-emerald-200 focus:border-emerald-500'
              }`}
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-emerald-900 text-sm font-medium mb-2">
              Tags (Optional)
            </label>
            <div className="relative">
              <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-5 w-5" />
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g., groceries, work, entertainment"
                className={`w-full pl-10 pr-4 py-3 bg-emerald-50 border rounded-lg text-emerald-900 placeholder-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ios-input-fix ${
                  errors.tags ? 'border-red-300 focus:border-red-500 focus:ring-red-500/50' : 'border-emerald-200 focus:border-emerald-500'
                }`}
              />
            </div>
            {errors.tags && (
              <p className="mt-1 text-sm text-red-600">{errors.tags}</p>
            )}
          </div>

          </form>
          
          {/* Required Fields Note */}
          <div className="px-6 pb-4">
            <p className="text-xs text-gray-500">
              <span className="text-red-500">*</span> Required fields
            </p>
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="flex space-x-3 p-6 border-t border-emerald-200 bg-emerald-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer ios-touch-optimize"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || isSubmitting}
            className={`
              flex-1 px-4 py-3 rounded-lg transition-colors flex items-center justify-center cursor-pointer ios-touch-optimize
              ${isLoading || isSubmitting
                ? 'bg-emerald-400 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-700'
              }
              text-white font-medium shadow-sm
            `}
          >
            {isLoading || isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Adding...
              </>
            ) : (
              'Add Transaction'
            )}
          </button>
        </div>
      </div>

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-md w-full shadow-xl border border-emerald-200/30">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-emerald-900 mb-2">Success!</h3>
              <p className="text-emerald-700 mb-6">Your transaction has been added successfully.</p>
              <button
                onClick={handleSuccessConfirm}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ios-touch-optimize"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Dialog */}
      {showErrorDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-md w-full shadow-xl border border-red-200/30">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-red-900 mb-2">Error</h3>
              <p className="text-red-700 mb-6">{errorMessage}</p>
              <div className="flex space-x-3">
                <button
                  onClick={handleErrorRetry}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer ios-touch-optimize"
                >
                  Try Again
                </button>
                <button
                  onClick={handleErrorClose}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer ios-touch-optimize"
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
