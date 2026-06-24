'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiMail, FiPhone, FiGlobe, FiBell, FiDollarSign, FiEdit3, FiMenu, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import DashboardSidebar from '@/components/DashboardSidebar';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string;
  last_login?: string;
}

interface UserPreferences {
  currency: string;
  timezone: string;
  daily_message_enabled: boolean;
  notification_enabled: boolean;
}

export default function SettingsPage() {
  const { user, logout, isAuthenticated, isLoading, getUserProfile, updateUserProfile, getUserPreferences, updateUserPreferences } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');
  
  // Profile state
  const [profileData, setProfileData] = useState<UserProfile>({
    id: '',
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    last_login: ''
  });
  
  // Preferences state
  const [preferencesData, setPreferencesData] = useState<UserPreferences>({
    currency: 'USD',
    timezone: 'UTC',
    daily_message_enabled: true,
    notification_enabled: true
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Success/Error dialog states for profile updates
  const [showProfileSuccessDialog, setShowProfileSuccessDialog] = useState(false);
  const [showProfileErrorDialog, setShowProfileErrorDialog] = useState(false);
  const [profileErrorMessage, setProfileErrorMessage] = useState('');
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [showProfileNoChangesDialog, setShowProfileNoChangesDialog] = useState(false);
  
  // Success/Error dialog states for preferences updates
  const [showPreferencesSuccessDialog, setShowPreferencesSuccessDialog] = useState(false);
  const [showPreferencesErrorDialog, setShowPreferencesErrorDialog] = useState(false);
  const [preferencesErrorMessage, setPreferencesErrorMessage] = useState('');
  const [isPreferencesSubmitting, setIsPreferencesSubmitting] = useState(false);
  const [showPreferencesNoChangesDialog, setShowPreferencesNoChangesDialog] = useState(false);
  
  // Original data for comparison
  const [originalProfileData, setOriginalProfileData] = useState<UserProfile>({
    id: '',
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    last_login: ''
  });
  
  const [originalPreferencesData, setOriginalPreferencesData] = useState<UserPreferences>({
    currency: 'USD',
    timezone: 'UTC',
    daily_message_enabled: true,
    notification_enabled: true
  });

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = () => {
    logout();
    router.push('/pages/login');
  };

  // Helper function to check if profile data has changed
  const hasProfileDataChanged = () => {
    return (
      profileData.first_name !== originalProfileData.first_name ||
      profileData.last_name !== originalProfileData.last_name ||
      profileData.username !== originalProfileData.username ||
      profileData.phone !== originalProfileData.phone
    );
  };

  // Helper function to check if preferences data has changed
  const hasPreferencesDataChanged = () => {
    return (
      preferencesData.currency !== originalPreferencesData.currency ||
      preferencesData.timezone !== originalPreferencesData.timezone ||
      preferencesData.daily_message_enabled !== originalPreferencesData.daily_message_enabled ||
      preferencesData.notification_enabled !== originalPreferencesData.notification_enabled
    );
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/pages/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    console.log('Settings page - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
    if (isAuthenticated && !isLoading) {
      loadUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load profile data from API
      const profileResult = await getUserProfile();
      if (profileResult.success && profileResult.data) {
        const profileData = {
          id: profileResult.data.id || '',
          email: profileResult.data.email || '',
          username: profileResult.data.username || '',
          first_name: profileResult.data.first_name || '',
          last_name: profileResult.data.last_name || '',
          phone: profileResult.data.phone || '',
          last_login: profileResult.data.last_login || ''
        };
        setProfileData(profileData);
        setOriginalProfileData(profileData); // Store original data for comparison
        console.log('Profile data loaded successfully:', profileResult.data);
      } else {
        console.warn('Failed to load profile from API, using context data:', profileResult.message);
        // Fallback to user context data
        if (user) {
          const profileData = {
            id: user.id || '',
            email: user.email || '',
            username: user.username || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone: user.phone || '',
            last_login: user.last_login ? user.last_login.toString() : ''
          };
          setProfileData(profileData);
          setOriginalProfileData(profileData); // Store original data for comparison
        } else {
          console.error('No user data available in context');
          toast.error('Unable to load user profile data');
        }
      }
      
      // Load preferences from API
      const preferencesResult = await getUserPreferences();
      if (preferencesResult.success && preferencesResult.data) {
        const preferencesData = {
          currency: preferencesResult.data.currency || 'USD',
          timezone: preferencesResult.data.timezone || 'UTC',
          daily_message_enabled: preferencesResult.data.daily_message_enabled ?? true,
          notification_enabled: preferencesResult.data.notification_enabled ?? true
        };
        setPreferencesData(preferencesData);
        setOriginalPreferencesData(preferencesData); // Store original data for comparison
        console.log('Preferences data loaded successfully:', preferencesResult.data);
      } else {
        console.warn('Failed to load preferences from API, using defaults:', preferencesResult.message);
        // Fallback to defaults
        const preferencesData = {
          currency: 'USD',
          timezone: 'UTC',
          daily_message_enabled: true,
          notification_enabled: true
        };
        setPreferencesData(preferencesData);
        setOriginalPreferencesData(preferencesData); // Store original data for comparison
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProfileSubmitting) return;
    
    // Check if any changes were made
    if (!hasProfileDataChanged()) {
      setShowProfileNoChangesDialog(true);
      return;
    }
    
    setSaving(true);
    setIsProfileSubmitting(true);
    
    try {
      const result = await updateUserProfile(profileData);
      if (result.success) {
        // Update original data after successful save
        setOriginalProfileData(profileData);
        setShowProfileSuccessDialog(true);
        toast.success('Profile updated successfully!');
      } else {
        setProfileErrorMessage(result.message || 'Failed to update profile. Please try again.');
        setShowProfileErrorDialog(true);
        toast.error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileErrorMessage('Failed to update profile. Please try again.');
      setShowProfileErrorDialog(true);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
      setIsProfileSubmitting(false);
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreferencesSubmitting) return;
    
    // Check if any changes were made
    if (!hasPreferencesDataChanged()) {
      setShowPreferencesNoChangesDialog(true);
      return;
    }
    
    setSaving(true);
    setIsPreferencesSubmitting(true);
    
    try {
      const result = await updateUserPreferences(preferencesData);
      if (result.success) {
        // Update original data after successful save
        setOriginalPreferencesData(preferencesData);
        setShowPreferencesSuccessDialog(true);
        toast.success('Preferences updated successfully!');
      } else {
        setPreferencesErrorMessage(result.message || 'Failed to update preferences. Please try again.');
        setShowPreferencesErrorDialog(true);
        toast.error(result.message || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      setPreferencesErrorMessage('Failed to update preferences. Please try again.');
      setShowPreferencesErrorDialog(true);
      toast.error('Failed to update preferences');
    } finally {
      setSaving(false);
      setIsPreferencesSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.startsWith('profile_')) {
      const profileField = field.replace('profile_', '');
      setProfileData(prev => ({
        ...prev,
        [profileField]: value
      }));
    } else if (field.startsWith('pref_')) {
      const prefField = field.replace('pref_', '');
      setPreferencesData(prev => ({
        ...prev,
        [prefField]: value
      }));
    }
  };

  // Profile dialog handlers
  const handleProfileSuccessConfirm = () => {
    setShowProfileSuccessDialog(false);
  };

  const handleProfileErrorRetry = () => {
    setShowProfileErrorDialog(false);
    setProfileErrorMessage('');
  };

  const handleProfileErrorClose = () => {
    setShowProfileErrorDialog(false);
    setProfileErrorMessage('');
  };

  const handleProfileNoChangesConfirm = () => {
    setShowProfileNoChangesDialog(false);
  };

  // Preferences dialog handlers
  const handlePreferencesSuccessConfirm = () => {
    setShowPreferencesSuccessDialog(false);
  };

  const handlePreferencesErrorRetry = () => {
    setShowPreferencesErrorDialog(false);
    setPreferencesErrorMessage('');
  };

  const handlePreferencesErrorClose = () => {
    setShowPreferencesErrorDialog(false);
    setPreferencesErrorMessage('');
  };

  const handlePreferencesNoChangesConfirm = () => {
    setShowPreferencesNoChangesDialog(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 flex overflow-hidden">
        <DashboardSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={logout}
          user={user}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          currentPath="/pages/settings"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-emerald-700 text-lg">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-emerald-900 mb-4">Access Denied</h1>
          <p className="text-emerald-600 text-lg">Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  console.log('Settings page rendering - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'user:', user);

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
        currentPath="/pages/settings"
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
                Settings
              </h1>
            </div>
            
            {/* User Profile - Current Page */}
            <div className="flex items-center space-x-2 sm:space-x-3 bg-emerald-50 rounded-lg p-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center cursor-pointer">
                <FiUser className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="hidden xs:block">
                <p className="text-emerald-900 font-medium text-xs sm:text-sm truncate max-w-24 sm:max-w-none">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-emerald-600 text-xs truncate max-w-24 sm:max-w-none">@{user?.username}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Settings Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-emerald-900 mb-2">
                Settings
              </h2>
              <p className="text-emerald-600">Manage your account and preferences</p>
            </div>
            
            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 mb-6">
              <div className="flex border-b border-emerald-100">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 px-8 py-4 text-left font-medium transition-colors cursor-pointer ios-touch-optimize ${
                    activeTab === 'profile'
                      ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                      : 'text-emerald-700 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FiUser className="h-5 w-5" />
                    <span>Profile</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`flex-1 px-8 py-4 text-left font-medium transition-colors cursor-pointer ios-touch-optimize ${
                    activeTab === 'preferences'
                      ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                      : 'text-emerald-700 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FiBell className="h-5 w-5" />
                    <span>Preferences</span>
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-emerald-700 text-lg">Loading your settings...</p>
                  </div>
                ) : (
                  <>
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                      <div className="space-y-6">
                        <div className="text-center mb-6">
                          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FiUser className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-emerald-900 mb-2">Personal Information</h3>
                          <p className="text-emerald-600">Update your personal details and contact information</p>
                        </div>
                        <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-emerald-700 mb-2">
                          First Name *
                        </label>
                        <div className="relative">
                          <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-5 w-5" />
                          <input
                            type="text"
                            value={profileData.first_name || ''}
                            onChange={(e) => handleInputChange('profile_first_name', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 ios-input-fix"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-emerald-700 mb-2">
                          Last Name *
                        </label>
                        <div className="relative">
                          <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-5 w-5" />
                          <input
                            type="text"
                            value={profileData.last_name || ''}
                            onChange={(e) => handleInputChange('profile_last_name', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 ios-input-fix"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-emerald-700 mb-2">
                          Username *
                        </label>
                        <div className="relative">
                          <FiEdit3 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-5 w-5" />
                          <input
                            type="text"
                            value={profileData.username || ''}
                            onChange={(e) => handleInputChange('profile_username', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 ios-input-fix"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-emerald-700 mb-2">
                          Email * <span className="text-xs text-emerald-600">(Verified - Read Only)</span>
                        </label>
                        <div className="relative">
                          <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-5 w-5" />
                          <input
                            type="email"
                            value={profileData.email || ''}
                            className="w-full pl-10 pr-4 py-3 border border-emerald-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed ios-input-fix"
                            disabled
                            readOnly
                          />
                        </div>
                        <p className="text-xs text-emerald-600 mt-1">
                          This email is verified and cannot be changed. Contact support if you need to update it.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-emerald-700 mb-2">
                          Phone
                        </label>
                        <div className="relative">
                          <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-5 w-5" />
                          <input
                            type="tel"
                            value={profileData.phone || ''}
                            onChange={(e) => handleInputChange('profile_phone', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 ios-input-fix"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving || isProfileSubmitting}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer ios-touch-optimize"
                      >
                        {(saving || isProfileSubmitting) && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                        <span>{saving || isProfileSubmitting ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </div>
                        </form>
                      </div>
                    )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FiBell className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-emerald-900 mb-2">App Preferences</h3>
                      <p className="text-emerald-600">Customize your app settings and notification preferences</p>
                    </div>
                    <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-emerald-700 mb-2">
                          Currency
                        </label>
                        <div className="relative">
                          <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-5 w-5" />
                          <select
                            value={preferencesData.currency || 'USD'}
                            onChange={(e) => handleInputChange('pref_currency', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 ios-input-fix"
                          >
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="JPY">JPY - Japanese Yen</option>
                            <option value="CAD">CAD - Canadian Dollar</option>
                            <option value="AUD">AUD - Australian Dollar</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-emerald-700 mb-2">
                          Timezone
                        </label>
                        <div className="relative">
                          <FiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-5 w-5" />
                          <select
                            value={preferencesData.timezone || 'UTC'}
                            onChange={(e) => handleInputChange('pref_timezone', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 ios-input-fix"
                          >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time (ET)</option>
                            <option value="America/Chicago">Central Time (CT)</option>
                            <option value="America/Denver">Mountain Time (MT)</option>
                            <option value="America/Los_Angeles">Pacific Time (PT)</option>
                            <option value="Europe/London">London (GMT)</option>
                            <option value="Europe/Paris">Paris (CET)</option>
                            <option value="Asia/Tokyo">Tokyo (JST)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-emerald-900">Daily Messages</h3>
                          <p className="text-sm text-emerald-600">Receive daily motivational messages</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferencesData.daily_message_enabled ?? true}
                            onChange={(e) => handleInputChange('pref_daily_message_enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-emerald-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-emerald-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-emerald-900">Notifications</h3>
                          <p className="text-sm text-emerald-600">Receive email notifications</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferencesData.notification_enabled ?? true}
                            onChange={(e) => handleInputChange('pref_notification_enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-emerald-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-emerald-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                    </div> */}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving || isPreferencesSubmitting}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer ios-touch-optimize"
                      >
                        {(saving || isPreferencesSubmitting) && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                        <span>{saving || isPreferencesSubmitting ? 'Saving...' : 'Save Preferences'}</span>
                      </button>
                    </div>
                    </form>
                  </div>
                )}
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Profile Success Dialog */}
      {showProfileSuccessDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-xl border border-emerald-200/30">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-emerald-900 mb-2">Profile Updated!</h3>
              <p className="text-emerald-700 mb-6">
                Your profile information has been successfully updated and saved.
              </p>
              <button
                onClick={handleProfileSuccessConfirm}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer ios-touch-optimize"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Error Dialog */}
      {showProfileErrorDialog && (
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
                {profileErrorMessage}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleProfileErrorRetry}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer ios-touch-optimize"
                >
                  Try Again
                </button>
                <button
                  onClick={handleProfileErrorClose}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer ios-touch-optimize"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Success Dialog */}
      {showPreferencesSuccessDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-xl border border-emerald-200/30">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-emerald-900 mb-2">Preferences Updated!</h3>
              <p className="text-emerald-700 mb-6">
                Your app preferences have been successfully updated and saved.
              </p>
              <button
                onClick={handlePreferencesSuccessConfirm}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer ios-touch-optimize"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Error Dialog */}
      {showPreferencesErrorDialog && (
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
                {preferencesErrorMessage}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handlePreferencesErrorRetry}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer ios-touch-optimize"
                >
                  Try Again
                </button>
                <button
                  onClick={handlePreferencesErrorClose}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer ios-touch-optimize"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile No Changes Dialog */}
      {showProfileNoChangesDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-xl border border-amber-200/30">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4">
                <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">No Changes Made</h3>
              <p className="text-amber-700 mb-6">
                You haven&apos;t made any changes to your profile information. Please modify at least one field before saving.
              </p>
              <button
                onClick={handleProfileNoChangesConfirm}
                className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors cursor-pointer ios-touch-optimize"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences No Changes Dialog */}
      {showPreferencesNoChangesDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-xl border border-amber-200/30">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4">
                <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">No Changes Made</h3>
              <p className="text-amber-700 mb-6">
                You haven&apos;t made any changes to your preferences. Please modify at least one setting before saving.
              </p>
              <button
                onClick={handlePreferencesNoChangesConfirm}
                className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors cursor-pointer ios-touch-optimize"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
