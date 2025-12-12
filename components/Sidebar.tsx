import React from 'react';
import { LayoutDashboard, PlusCircle, LogOut, Package, Link2, Coins, UserCircle, Settings, MessageSquare, History, Users } from 'lucide-react';
import { getCurrentUser, logoutUser } from '../services/storageService';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: any) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  onLogoutUser: () => void;
  siteName: string; 
  unreadCount?: number; // New prop for notifications
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setActiveView, 
  isOpen, 
  setIsOpen, 
  isAdmin, 
  setIsAdmin,
  onLogoutUser,
  siteName,
  unreadCount = 0
}) => {
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    // Always log out completely to redirect to login page
    logoutUser();
    onLogoutUser();
  };

  // Helper to check permissions
  // If user is owner (isAdmin + canManageTeam), they see everything.
  // Otherwise check specific permission flag.
  const perms = currentUser?.permissions || { 
      canManageOrders: false, 
      canManageWallet: false, 
      canManageSettings: false, 
      canManageTeam: false 
  };

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 z-30 w-64 h-full bg-slate-900 text-white transition-transform duration-300 transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-center h-20 border-b border-slate-700 bg-slate-950 px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <Package className="w-8 h-8 text-emerald-500 flex-shrink-0" />
            <h1 className="text-lg font-bold tracking-wide truncate">{siteName}</h1>
          </div>
        </div>

        {/* User Info Snippet if Logged In */}
        {!isAdmin && currentUser && (
          <div className="p-4 border-b border-slate-800 bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                {currentUser.username.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate w-32">{currentUser.username}</p>
                <p className="text-xs text-emerald-400 font-mono">ID: {currentUser.serialId}</p>
              </div>
            </div>
          </div>
        )}

        {/* Admin Info Snippet */}
        {isAdmin && currentUser && (
          <div className="p-4 border-b border-slate-800 bg-indigo-900/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                {currentUser.username.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate w-32">{currentUser.username}</p>
                <p className="text-xs text-indigo-300 font-mono">
                    {perms.canManageTeam ? 'Super Admin' : 'Admin'}
                </p>
              </div>
            </div>
          </div>
        )}

        <nav className="mt-6 px-4 space-y-2">
          
          {/* Public / User Links */}
          <button
            onClick={() => { setActiveView('new-order'); setIsOpen(false); }}
            className={`flex items-center w-full px-4 py-3 text-start rounded-lg transition-colors ${activeView === 'new-order' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <PlusCircle className="w-5 h-5 ml-3" />
            <span>طلب شحن جديد</span>
          </button>

          {!isAdmin && !currentUser && (
             <button
              onClick={() => { setActiveView('user-auth'); setIsOpen(false); }}
              className={`flex items-center w-full px-4 py-3 text-start rounded-lg transition-colors ${activeView === 'user-auth' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <UserCircle className="w-5 h-5 ml-3" />
              <span>دخول / تسجيل</span>
            </button>
          )}

          {!isAdmin && currentUser && (
            <>
             <button
              onClick={() => { setActiveView('user-history'); setIsOpen(false); }}
              className={`flex items-center justify-between w-full px-4 py-3 text-start rounded-lg transition-colors ${activeView === 'user-history' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center">
                <History className="w-5 h-5 ml-3" />
                <span>سجل عملياتي</span>
              </div>
              {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {unreadCount}
                  </span>
              )}
            </button>

             <button
              onClick={() => { setActiveView('user-profile'); setIsOpen(false); }}
              className={`flex items-center w-full px-4 py-3 text-start rounded-lg transition-colors ${activeView === 'user-profile' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Settings className="w-5 h-5 ml-3" />
              <span>إعدادات الحساب</span>
            </button>
            </>
          )}

          {/* ADMIN ONLY SECTION */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">الإدارة</p>
              </div>

              {/* Dashboard is visible to all admins, but content inside might be limited later if needed */}
              <button
                onClick={() => { setActiveView('dashboard'); setIsOpen(false); }}
                className={`flex items-center w-full px-4 py-3 text-start rounded-lg transition-colors ${activeView === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <LayoutDashboard className="w-5 h-5 ml-3" />
                <span>لوحة التحكم</span>
              </button>

              {/* Orders Permission */}
              {perms.canManageOrders && (
                  <button
                    onClick={() => { setActiveView('admin-orders'); setIsOpen(false); }}
                    className={`flex items-center w-full px-4 py-3 text-start rounded-lg transition-colors ${activeView === 'admin-orders' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    <MessageSquare className="w-5 h-5 ml-3" />
                    <span>طلبات الشحن</span>
                  </button>
              )}

              {/* Wallet Permission */}
              {perms.canManageWallet && (
                  <button
                    onClick={() => { setActiveView('admin-wallet'); setIsOpen(false); }}
                    className={`flex items-center w-full px-4 py-3 text-start rounded-lg transition-colors ${activeView === 'admin-wallet' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    <Coins className="w-5 h-5 ml-3" />
                    <span>إدارة الأرصدة</span>
                  </button>
              )}

              {/* Settings Permission (Agency, etc) */}
              {perms.canManageSettings && (
                  <button
                    onClick={() => { setActiveView('agency-integration'); setIsOpen(false); }}
                    className={`flex items-center w-full px-4 py-3 text-start rounded-lg transition-colors ${activeView === 'agency-integration' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    <Link2 className="w-5 h-5 ml-3" />
                    <span>ربط وكالة الشحن</span>
                  </button>
              )}

              {/* TEAM Permission (SUPER ADMIN ONLY) */}
              {perms.canManageTeam && (
                  <button
                    onClick={() => { setActiveView('admin-team'); setIsOpen(false); }}
                    className={`flex items-center w-full px-4 py-3 text-start rounded-lg transition-colors ${activeView === 'admin-team' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    <Users className="w-5 h-5 ml-3" />
                    <span>إدارة فريق العمل</span>
                  </button>
              )}

            </>
          )}
        </nav>

        {(isAdmin || currentUser) && (
          <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 ml-3" />
              <span>تسجيل خروج</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;