import React, { useState, useEffect } from 'react';
import { Menu, Bell, Sparkles, MessageCircle, Package, Info, Megaphone } from 'lucide-react';
import Sidebar from './components/Sidebar';
import StatsCards from './components/StatsCards';
import RecentOrders from './components/RecentOrders';
import NewOrderForm from './components/NewOrderForm';
import AgencyIntegration from './components/AgencyIntegration';
import LoginForm from './components/LoginForm';
import UserAuth from './components/UserAuth';
import UserProfile from './components/UserProfile';
import UserHistory from './components/UserHistory';
import AdminWallet from './components/AdminWallet';
import AdminOrders from './components/AdminOrders';
import AdminTeamManagement from './components/AdminTeamManagement';
import AdminBroadcast from './components/AdminBroadcast';
import AdminGlobalControl from './components/AdminGlobalControl';
import HeroBanner from './components/HeroBanner';
import AdminBannerSettings from './components/AdminBannerSettings';
import AdminAppsSettings from './components/AdminAppsSettings';
import AdminContactSettings from './components/AdminContactSettings';
import AdminGeneralSettings from './components/AdminGeneralSettings';
import { getOrders, getStats, initializeData, getCurrentUser, updateOrder, logoutUser, getSiteConfig, getSystemNotifications, markNotificationAsRead } from './services/storageService';
import { Order, DashboardStats, SiteConfig, SystemNotification } from './types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Initialize dummy data
initializeData();

type ViewState = 'dashboard' | 'new-order' | 'agency-integration' | 'user-auth' | 'admin-wallet' | 'user-profile' | 'admin-orders' | 'user-history' | 'admin-team' | 'admin-broadcast' | 'admin-global-control';

interface NotificationItem {
    id: string;
    message: string;
    timestamp: number;
    isRead: boolean;
    type: 'order' | 'system';
    title?: string; // Optional title for system notifications
}

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('new-order');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ visitors: 0, totalOrders: 0, totalAmount: 0 });
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Site Configuration
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({ name: 'منصة Top1', slogan: '' });

  // Auth States
  const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  // Load data function
  const refreshData = () => {
    setOrders(getOrders());
    setSystemNotifications(getSystemNotifications());
    setStats(getStats());
    const config = getSiteConfig();
    setSiteConfig(config);
    document.title = config.name; // Update Browser Title

    // Only refresh user if logged in to avoid unnecessary storage hits on landing
    const user = getCurrentUser();
    if (user) {
        setCurrentUser(user);
        // If it's the Super Admin, ensure admin access is granted
        if (user.isAdmin && !isAuthenticatedAdmin) {
            setIsAuthenticatedAdmin(true);
        }
    }
  };

  useEffect(() => {
    refreshData();
    // Check initially
    const user = getCurrentUser();
    if (user?.isAdmin) {
        setIsAuthenticatedAdmin(true);
        setActiveView('dashboard');
    }

    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Prepare chart data (Last 5 orders amount)
  const chartData = orders.slice(0, 7).reverse().map(o => ({
    name: o.username.split(' ')[0], 
    amount: o.amount
  }));

  const handleOrderSuccess = () => {
    refreshData();
  };

  const handleUserLoginSuccess = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user?.isAdmin) {
        setIsAuthenticatedAdmin(true);
        setActiveView('dashboard'); // Redirect admin directly to dashboard
    } else {
        setActiveView('new-order');
    }
  }

  const handleUserLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setIsAuthenticatedAdmin(false);
    // Force view reset to ensure Login screen appears cleanly if logic changes
    setActiveView('user-auth'); 
  }

  // --- NOTIFICATION LOGIC ---
  const getAggregatedNotifications = (): NotificationItem[] => {
      if (!currentUser) return [];

      // 1. Order Notifications (Admin replies to orders)
      const orderNotifs: NotificationItem[] = orders
        .filter(o => o.userId === currentUser.serialId && o.adminMessage && !o.isRead)
        .map(o => ({
            id: o.id,
            message: o.adminMessage || '',
            timestamp: o.timestamp,
            isRead: false,
            type: 'order',
            title: 'تحديث على الطلب'
        }));

      // 2. System Notifications (Broadcasts from Admin)
      const sysNotifs: NotificationItem[] = systemNotifications
        .filter(n => n.userId === currentUser.serialId && !n.isRead)
        .map(n => ({
            id: n.id,
            message: n.message,
            timestamp: n.timestamp,
            isRead: false,
            type: 'system',
            title: n.title
        }));

      // Sort by newest
      return [...orderNotifs, ...sysNotifs].sort((a, b) => b.timestamp - a.timestamp);
  };

  const userNotifications = getAggregatedNotifications();

  const handleMarkAsRead = (notif: NotificationItem) => {
    if (notif.type === 'order') {
        updateOrder(notif.id, { isRead: true });
        setActiveView('user-history'); // Go to history to see full details
    } else {
        markNotificationAsRead(notif.id);
        // Stay here or maybe show a modal with full text if it's long
    }
    refreshData();
    setShowNotifications(false);
  };

  // --- GATEKEEPER: FORCE LOGIN ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>
        </div>

        <div className="w-full max-w-md space-y-6 md:space-y-8 relative z-10 animate-fade-in px-2">
            <div className="text-center">
                <div className="inline-flex p-4 md:p-5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700 shadow-2xl mb-6 md:mb-8">
                    <Package className="w-12 h-12 md:w-16 md:h-16 text-emerald-500" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">{siteConfig.name}</h1>
                <p className="text-slate-400 text-base md:text-lg">{siteConfig.slogan || 'سجل الدخول لإدارة طلباتك وشحن ألعابك المفضلة'}</p>
            </div>
            
            {/* Login Component */}
            <UserAuth onSuccess={handleUserLoginSuccess} />
            
            <div className="text-center space-y-4">
              <p className="text-slate-600 text-xs md:text-sm">
                  &copy; {new Date().getFullYear()} جميع الحقوق محفوظة لـ {siteConfig.name}
              </p>
            </div>
        </div>
      </div>
    );
  }

  // Helper to allow admin bypass or require secondary auth for sensitive areas
  const isAuthorizedAdmin = isAuthenticatedAdmin || currentUser?.isAdmin;
  
  // Permission checks
  const canManageSettings = currentUser?.permissions?.canManageSettings;
  const canManageTeam = currentUser?.permissions?.canManageTeam;
  const isSuperAdmin = currentUser?.email === 'admin@haneen.com';

  // --- MAIN APP (AUTHENTICATED) ---
  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans" onClick={() => setShowNotifications(false)}>
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isAdmin={isAuthorizedAdmin}
        setIsAdmin={setIsAuthenticatedAdmin}
        onLogoutUser={handleUserLogout}
        siteName={siteConfig.name}
        unreadCount={userNotifications.length}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:mr-64">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 md:h-20 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 shadow-sm md:shadow-none">
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg active:scale-95 transition-transform"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 truncate max-w-[150px] md:max-w-none">
              {activeView === 'dashboard' ? 'لوحة القيادة' : 
               activeView === 'new-order' ? 'طلب شحن' : 
               activeView === 'agency-integration' ? 'الوكالة' :
               activeView === 'admin-wallet' ? 'الأرصدة' :
               activeView === 'admin-orders' ? 'الطلبات' :
               activeView === 'admin-team' ? 'فريق العمل' :
               activeView === 'admin-broadcast' ? 'إرسال إشعارات' :
               activeView === 'admin-global-control' ? 'تصفير الكوينز' :
               activeView === 'user-auth' ? 'دخول' : 
               activeView === 'user-profile' ? 'حسابي' : 
               activeView === 'user-history' ? 'سجلي' : ''}
            </h2>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {currentUser && (
               <div className="flex items-center gap-2 md:gap-3 bg-slate-100 px-2 md:px-3 py-1.5 rounded-full border border-slate-200">
                  <span className="text-xs md:text-sm font-bold text-green-600">${currentUser.balanceUSD.toFixed(1)}</span>
                  <div className="w-px h-3 md:h-4 bg-slate-300"></div>
                  <span className="text-xs md:text-sm font-bold text-yellow-600">{currentUser.balanceCoins}</span>
               </div>
            )}

            {/* Notifications Bell */}
            <div className="relative">
                <div 
                    onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); }}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-full cursor-pointer transition-colors relative active:scale-95"
                >
                    <Bell className="w-5 h-5 md:w-6 md:h-6" />
                    {userNotifications.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                </div>

                {/* Dropdown */}
                {showNotifications && (
                    <div className="absolute left-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fade-in origin-top-left">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 text-sm">الإشعارات الواردة</h3>
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{userNotifications.length} جديد</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {userNotifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    لا توجد إشعارات جديدة
                                </div>
                            ) : (
                                userNotifications.map(notification => (
                                    <div 
                                        key={notification.id} 
                                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer relative
                                            ${notification.type === 'system' ? 'bg-pink-50/30' : ''}`}
                                        onClick={() => handleMarkAsRead(notification)}
                                    >
                                        <div className="flex items-start gap-3">
                                           {/* Icon Based on Type */}
                                           <div className={`p-2 rounded-full flex-shrink-0 
                                                ${notification.type === 'order' ? 'bg-emerald-100 text-emerald-600' : 'bg-pink-100 text-pink-600'}`}>
                                                {notification.type === 'order' ? <MessageCircle className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                                           </div>
                                           
                                           <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-xs font-bold ${notification.type === 'order' ? 'text-emerald-700' : 'text-pink-700'}`}>
                                                        {notification.title || (notification.type === 'order' ? 'رد على طلبك' : 'إشعار إداري')}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">{new Date(notification.timestamp).toLocaleTimeString('ar-EG')}</span>
                                                </div>
                                                <p className="text-sm text-slate-700 font-medium leading-relaxed line-clamp-2">
                                                    {notification.message}
                                                </p>
                                           </div>
                                        </div>
                                        {/* Unread Dot */}
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold border-2 shadow-sm text-sm md:text-base
                ${currentUser?.isAdmin ? 'bg-purple-600 text-white border-purple-300' : 'bg-emerald-100 text-emerald-700 border-white'}`}>
              {currentUser?.username.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="p-3 md:p-6 overflow-y-auto h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] pb-20 md:pb-6">
          
          {/* SHOW HERO BANNER ONLY ON USER VIEWS (Not Auth or Admin) */}
          {activeView === 'new-order' && <HeroBanner />}

          {/* MAIN INTERFACE (NEW ORDER FORM) - RESTORED */}
          {activeView === 'new-order' && (
             <div className="animate-fade-in">
                <NewOrderForm onOrderSuccess={handleOrderSuccess} />
             </div>
          )}

          {/* USER AUTH VIEW - (Used inside sidebar if logic permits, but mostly handled by gatekeeper now) */}
          {activeView === 'user-auth' && (
             <div className="animate-fade-in py-4">
                <UserAuth onSuccess={handleUserLoginSuccess} />
             </div>
          )}

          {/* USER PROFILE VIEW */}
          {activeView === 'user-profile' && (
             <div className="animate-fade-in py-4">
                <UserProfile />
             </div>
          )}

          {/* USER HISTORY VIEW */}
          {activeView === 'user-history' && (
             <div className="animate-fade-in py-4">
                <UserHistory />
             </div>
          )}

          {/* ADMIN TEAM MANAGEMENT VIEW */}
          {activeView === 'admin-team' && (
             !isAuthorizedAdmin ? (
               <LoginForm onLogin={() => setIsAuthenticatedAdmin(true)} />
             ) : (
                canManageTeam ? (
                  <AdminTeamManagement />
                ) : (
                  <div className="p-10 text-center text-red-500 font-bold">عذراً، لا تملك صلاحية الوصول لهذه الصفحة.</div>
                )
             )
          )}

          {/* ADMIN BROADCAST VIEW */}
          {activeView === 'admin-broadcast' && (
             !isAuthorizedAdmin ? (
               <LoginForm onLogin={() => setIsAuthenticatedAdmin(true)} />
             ) : (
               <AdminBroadcast />
             )
          )}

          {/* ADMIN GLOBAL CONTROL VIEW (Super Admin Only) */}
          {activeView === 'admin-global-control' && (
             !isAuthorizedAdmin ? (
               <LoginForm onLogin={() => setIsAuthenticatedAdmin(true)} />
             ) : (
                isSuperAdmin ? (
                    <AdminGlobalControl />
                ) : (
                    <div className="p-10 text-center text-red-500 font-bold">عذراً، هذه الصفحة مخصصة للمالك فقط.</div>
                )
             )
          )}

          {/* ADMIN WALLET VIEW */}
          {activeView === 'admin-wallet' && (
             !isAuthorizedAdmin ? (
               <LoginForm onLogin={() => setIsAuthenticatedAdmin(true)} />
             ) : (
               <AdminWallet />
             )
          )}

          {/* ADMIN ORDERS VIEW */}
          {activeView === 'admin-orders' && (
             !isAuthorizedAdmin ? (
               <LoginForm onLogin={() => setIsAuthenticatedAdmin(true)} />
             ) : (
               <AdminOrders />
             )
          )}

          {/* DASHBOARD VIEW */}
          {activeView === 'dashboard' && (
            !isAuthorizedAdmin ? (
              <LoginForm onLogin={() => setIsAuthenticatedAdmin(true)} />
            ) : (
              <div className="space-y-6 animate-fade-in">
                {/* Dashboard Stats */}
                <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl border border-slate-700/50 mb-8">
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-right space-y-3">
                      <div className="flex items-center justify-center md:justify-start gap-3">
                        <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
                        <span className="text-emerald-400 font-bold tracking-wider text-xs md:text-sm bg-emerald-500/10 px-3 py-1 rounded-full">تحديث مباشر</span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black">لوحة تحكم الأدمن</h2>
                      <p className="text-slate-400 max-w-md text-sm md:text-base">مرحباً بك في لوحة الإدارة. يمكنك متابعة الإحصائيات، إدارة الطلبات، وتعديل إعدادات الموقع بالكامل من هنا.</p>
                    </div>
                  </div>
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-16 -mb-16"></div>
                </div>

                <StatsCards stats={stats} />
                
                {/* Admin Panels Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <RecentOrders orders={orders} />
                        {/* Chart */}
                        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100">
                          <h3 className="text-lg font-bold text-slate-800 mb-4">تحليل المبيعات (آخر 7 طلبات)</h3>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip 
                                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                    </div>

                    {/* ONLY SHOW SETTINGS IF PERMISSION GRANTED */}
                    <div className="space-y-6">
                        {canManageSettings ? (
                            <>
                                <AdminGeneralSettings />
                                <AdminContactSettings />
                                <AdminAppsSettings />
                                <AdminBannerSettings />
                            </>
                        ) : (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                                <span className="block mb-2 text-2xl">🔒</span>
                                لا تملك صلاحية الوصول لإعدادات الموقع
                            </div>
                        )}
                    </div>
                </div>
              </div>
            )
          )}

          {/* AGENCY INTEGRATION VIEW */}
          {activeView === 'agency-integration' && (
             !isAuthorizedAdmin ? (
                <LoginForm onLogin={() => setIsAuthenticatedAdmin(true)} />
             ) : (
                canManageSettings ? (
                  <AgencyIntegration />
                ) : (
                  <div className="p-10 text-center text-red-500 font-bold">عذراً، لا تملك صلاحية الوصول لهذه الصفحة.</div>
                )
             )
          )}

        </main>
      </div>
    </div>
  );
};

export default App;
