'use client';

import { FiHome, FiTrendingUp, FiDollarSign, FiSettings, FiLogOut, FiX } from 'react-icons/fi';
import { User } from '@/lib/models/User';

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  user: User | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentPath?: string;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function DashboardSidebar({ isOpen, onClose, onLogout, user, isCollapsed, onToggleCollapse, currentPath }: DashboardSidebarProps) {
  const menuItems = [
    { icon: FiHome, label: 'Dashboard', href: '/pages/home', active: currentPath === '/pages/home' },
    { icon: FiTrendingUp, label: 'Analytics', href: '/analytics', active: currentPath === '/analytics' },
    { icon: FiDollarSign, label: 'Transactions', href: '/pages/transactions', active: currentPath === '/pages/transactions' },
    { icon: FiSettings, label: 'Settings', href: '/pages/settings', active: currentPath === '/pages/settings' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-screen w-72 bg-gradient-to-b from-emerald-900/98 via-emerald-900/95 to-emerald-950/98 backdrop-blur-md border-r border-amber-200/30 z-50
        transform transition-all duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:sticky lg:top-0 lg:z-auto
        ${isCollapsed ? 'lg:w-16' : 'lg:w-72'}
        shadow-2xl
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-amber-200/30">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-200 to-amber-300 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-950 font-bold text-lg">A</span>
            </div>
            {!isCollapsed && (
              <h2 className="text-xl font-bold text-amber-200 whitespace-nowrap">
                AscenD Finance
              </h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-amber-100 transition-colors p-1 rounded-lg hover:bg-amber-600/20 lg:hidden"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>


        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menuItems.map((item, index) => (
              <li key={index}>
                <a
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group
                    ${item.active 
                      ? 'bg-gradient-to-r from-amber-600/30 to-amber-500/20 text-amber-200 border border-amber-500/40 shadow-lg' 
                      : 'text-emerald-200 hover:bg-gradient-to-r hover:from-emerald-800/30 hover:to-emerald-700/20 hover:text-amber-200 hover:shadow-md'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className={`h-5 w-5 transition-colors flex-shrink-0 ${item.active ? 'text-amber-300' : 'text-emerald-300 group-hover:text-amber-300'}`} />
                  {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-amber-200/30">
          <button
            onClick={onLogout}
            className={`
              flex items-center w-full px-4 py-3 text-emerald-200 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-red-500/10 hover:text-red-200 rounded-xl transition-all duration-200 group cursor-pointer
              ${isCollapsed ? 'justify-center' : 'space-x-3'}
            `}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <FiLogOut className="h-5 w-5 text-emerald-300 group-hover:text-red-300 transition-colors flex-shrink-0" />
            {!isCollapsed && <span className="font-medium whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}
