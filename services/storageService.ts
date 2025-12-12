import { Order, OrderStatus, DashboardStats, AgencyConfig, User, PaymentMethod, BannerConfig, AppConfig, ContactConfig, SiteConfig, AdminPermissions, SystemNotification } from '../types';
import { GLOBAL_APPS_CONFIG, GLOBAL_BANNER_CONFIG, GLOBAL_CONTACT_CONFIG } from '../config';
import { firebaseConfig, ENABLE_CLOUD_DB } from '../firebaseConfig';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, setDoc, query, orderBy, limit, deleteDoc, where, writeBatch } from 'firebase/firestore';

// --- Local Storage Keys ---
const ORDERS_KEY = 'haneen_orders';
const VISITORS_KEY = 'haneen_visitors';
const AGENCY_CONFIG_KEY = 'haneen_agency_config';
const USERS_KEY = 'haneen_users';
const CURRENT_USER_KEY = 'haneen_current_session_user';
const BANNER_CONFIG_KEY = 'haneen_banner_config';
const APPS_CONFIG_KEY = 'haneen_apps_config';
const CONTACT_CONFIG_KEY = 'haneen_contact_config';
const SITE_CONFIG_KEY = 'haneen_site_config';
const NOTIFICATIONS_KEY = 'haneen_notifications';

// --- Super Admin Credentials ---
export const ADMIN_EMAIL = 'admin@haneen.com'; // Exported to be used in checks
const ADMIN_PASS = 'zxcvbnmn123';

// --- Default Site Config ---
const DEFAULT_SITE_CONFIG: SiteConfig = {
    name: 'منصة Top1',
    slogan: 'خدمات شحن الألعاب الفورية'
};

// --- Firebase Initialization ---
let db: any = null;
let isCloudHealthy = true; // Circuit breaker flag

if (ENABLE_CLOUD_DB) {
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log("🔥 Firebase Connected Successfully to:", firebaseConfig.projectId);
    } catch (e) {
        console.error("Firebase Init Error:", e);
        isCloudHealthy = false;
    }
}

// Helper: Handle Cloud Errors gracefully
const handleCloudError = (e: any, context: string) => {
    console.error(`Cloud Error (${context}):`, e);
    if (e.code === 'not-found' || e.message?.includes('not exist') || e.code === 'permission-denied') {
        if (isCloudHealthy) {
            console.warn(`⚠️ Stopping Cloud Sync due to critical error: ${context}. App switching to Local Mode.`);
            isCloudHealthy = false;
        }
    }
};

// Helper: Sync functions (Run in background)
const syncOrdersFromCloud = async () => {
    if (!db || !isCloudHealthy) return;
    try {
        const q = query(collection(db, "orders"), orderBy("timestamp", "desc"), limit(100));
        const querySnapshot = await getDocs(q);
        const cloudOrders: Order[] = [];
        querySnapshot.forEach((doc) => {
            cloudOrders.push(doc.data() as Order);
        });
        
        if (cloudOrders.length > 0) {
            localStorage.setItem(ORDERS_KEY, JSON.stringify(cloudOrders));
        }
    } catch (e) {
        handleCloudError(e, "Orders Sync");
    }
};

const syncUsersFromCloud = async () => {
    if (!db || !isCloudHealthy) return;
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const cloudUsers: User[] = [];
        querySnapshot.forEach((doc) => {
            cloudUsers.push(doc.data() as User);
        });
        if (cloudUsers.length > 0) {
            localStorage.setItem(USERS_KEY, JSON.stringify(cloudUsers));
        }
    } catch (e) {
        handleCloudError(e, "Users Sync");
    }
}

// NEW: Sync Settings (Banner, Apps, Contact, Site) from Cloud
const syncSettingsFromCloud = async () => {
    if (!db || !isCloudHealthy) return;
    try {
        const bannerSnap = await getDoc(doc(db, "settings", "banner"));
        if (bannerSnap.exists()) {
            localStorage.setItem(BANNER_CONFIG_KEY, JSON.stringify(bannerSnap.data()));
        }

        const appsSnap = await getDoc(doc(db, "settings", "apps"));
        if (appsSnap.exists()) {
            localStorage.setItem(APPS_CONFIG_KEY, JSON.stringify(appsSnap.data().list));
        }

        const contactSnap = await getDoc(doc(db, "settings", "contact"));
        if (contactSnap.exists()) {
            localStorage.setItem(CONTACT_CONFIG_KEY, JSON.stringify(contactSnap.data()));
        }

        const siteSnap = await getDoc(doc(db, "settings", "site"));
        if (siteSnap.exists()) {
            localStorage.setItem(SITE_CONFIG_KEY, JSON.stringify(siteSnap.data()));
        }
        
    } catch (e) {
        handleCloudError(e, "Settings Sync");
    }
}

// NEW: Sync Notifications
const syncNotificationsFromCloud = async () => {
    if (!db || !isCloudHealthy) return;
    try {
        // Just fetch last 100 for efficiency
        const q = query(collection(db, "notifications"), orderBy("timestamp", "desc"), limit(200));
        const querySnapshot = await getDocs(q);
        const cloudNotifs: SystemNotification[] = [];
        querySnapshot.forEach((doc) => {
            cloudNotifs.push(doc.data() as SystemNotification);
        });
        
        if (cloudNotifs.length > 0) {
             // Merge with local? Or overwrite? Overwrite is safer for sync
             localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(cloudNotifs));
        }
    } catch (e) {
        handleCloudError(e, "Notifications Sync");
    }
};

// --- Orders Logic ---
let lastSyncTime = 0;

export const getOrders = (): Order[] => {
  let localOrders: Order[] = [];
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    localOrders = data ? JSON.parse(data) : [];
  } catch (e) {
    localOrders = [];
  }

  const now = Date.now();
  if (ENABLE_CLOUD_DB && db && isCloudHealthy && (now - lastSyncTime > 5000)) {
      lastSyncTime = now;
      syncOrdersFromCloud(); 
      syncUsersFromCloud();
      syncSettingsFromCloud();
      syncNotificationsFromCloud();
  }

  return localOrders;
};

export const saveOrder = async (order: Order): Promise<void> => {
  const orders = getOrders();
  const updatedOrders = [order, ...orders];
  localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));

  if (ENABLE_CLOUD_DB && db && isCloudHealthy) {
      try {
          await setDoc(doc(db, "orders", order.id), order);
      } catch (e) {
          handleCloudError(e, "Save Order");
      }
  }
};

export const updateOrder = async (orderId: string, updates: Partial<Order>): Promise<boolean> => {
    const orders = getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return false;

    orders[index] = { ...orders[index], ...updates };
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    if (ENABLE_CLOUD_DB && db && isCloudHealthy) {
        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, updates);
        } catch (e) {
            handleCloudError(e, "Update Order");
        }
    }
    return true;
};

export const getStats = (): DashboardStats => {
  const orders = getOrders();
  const visitors = parseInt(localStorage.getItem(VISITORS_KEY) || '1200', 10);
  const totalAmount = orders.reduce((acc, curr) => acc + curr.amount, 0);

  return {
    visitors,
    totalOrders: orders.length,
    totalAmount
  };
};

// --- Agency Logic ---
export const getAgencyConfig = (): AgencyConfig => {
  try {
    const data = localStorage.getItem(AGENCY_CONFIG_KEY);
    return data ? JSON.parse(data) : {
      agencyUrl: '',
      apiKey: '',
      isConnected: false,
      lastSync: null
    };
  } catch (e) {
    return {
      agencyUrl: '',
      apiKey: '',
      isConnected: false,
      lastSync: null
    };
  }
};

export const saveAgencyConfig = async (config: AgencyConfig): Promise<void> => {
  localStorage.setItem(AGENCY_CONFIG_KEY, JSON.stringify(config));
  if (ENABLE_CLOUD_DB && db && isCloudHealthy) {
      try {
          await setDoc(doc(db, "settings", "agency"), config);
      } catch(e) { handleCloudError(e, "Save Agency Config"); }
  }
};

// --- Banner Logic ---
export const getBannerConfig = (): BannerConfig => {
    try {
        const data = localStorage.getItem(BANNER_CONFIG_KEY);
        return data ? JSON.parse(data) : GLOBAL_BANNER_CONFIG;
    } catch (e) {
        return GLOBAL_BANNER_CONFIG;
    }
};

export const saveBannerConfig = async (config: BannerConfig): Promise<void> => {
    localStorage.setItem(BANNER_CONFIG_KEY, JSON.stringify(config));
    if (ENABLE_CLOUD_DB && db && isCloudHealthy) {
        try {
            await setDoc(doc(db, "settings", "banner"), config);
        } catch(e) { handleCloudError(e, "Save Banner Config"); }
    }
};

// --- Contact Logic ---
export const getContactConfig = (): ContactConfig => {
    try {
        const data = localStorage.getItem(CONTACT_CONFIG_KEY);
        return data ? JSON.parse(data) : GLOBAL_CONTACT_CONFIG;
    } catch (e) {
        return GLOBAL_CONTACT_CONFIG;
    }
}

export const saveContactConfig = async (config: ContactConfig): Promise<void> => {
    localStorage.setItem(CONTACT_CONFIG_KEY, JSON.stringify(config));
    if (ENABLE_CLOUD_DB && db && isCloudHealthy) {
        try {
            await setDoc(doc(db, "settings", "contact"), config);
        } catch(e) { handleCloudError(e, "Save Contact Config"); }
    }
}

// --- Site Config Logic (General Settings) ---
export const getSiteConfig = (): SiteConfig => {
    try {
        const data = localStorage.getItem(SITE_CONFIG_KEY);
        if (data) {
            const config = JSON.parse(data);
            // SANITIZATION: Force remove legacy names
            if (config.name && (config.name.includes('Copy of') || config.name.includes('كازيه') || config.name.includes('منصة حنين'))) {
                return DEFAULT_SITE_CONFIG;
            }
            return config;
        }
        return DEFAULT_SITE_CONFIG;
    } catch (e) {
        return DEFAULT_SITE_CONFIG;
    }
};

export const saveSiteConfig = async (config: SiteConfig): Promise<void> => {
    localStorage.setItem(SITE_CONFIG_KEY, JSON.stringify(config));
    if (ENABLE_CLOUD_DB && db && isCloudHealthy) {
        try {
            await setDoc(doc(db, "settings", "site"), config);
        } catch(e) { handleCloudError(e, "Save Site Config"); }
    }
};

// --- App Config Logic ---
export const getAppConfigs = (): AppConfig[] => {
    try {
        const data = localStorage.getItem(APPS_CONFIG_KEY);
        return data ? JSON.parse(data) : GLOBAL_APPS_CONFIG;
    } catch (e) {
        return GLOBAL_APPS_CONFIG;
    }
};

export const saveAppConfigs = async (apps: AppConfig[]): Promise<void> => {
    localStorage.setItem(APPS_CONFIG_KEY, JSON.stringify(apps));
    if (ENABLE_CLOUD_DB && db && isCloudHealthy) {
        try {
            await setDoc(doc(db, "settings", "apps"), { list: apps });
        } catch(e) { handleCloudError(e, "Save App Configs"); }
    }
};

export const addAppConfig = (name: string, exchangeRate: number): AppConfig => {
    const apps = getAppConfigs();
    const newApp: AppConfig = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        exchangeRate,
        isActive: true
    };
    apps.push(newApp);
    saveAppConfigs(apps);
    return newApp;
};

// --- User & Wallet Logic ---

export const getUsers = (): User[] => {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveUsers = async (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    if (ENABLE_CLOUD_DB && db && isCloudHealthy) {
        users.forEach(async (u) => {
            try {
                if (u.email !== ADMIN_EMAIL) {
                     await setDoc(doc(db, "users", u.id), u);
                }
            } catch (e) { handleCloudError(e, "Save User"); }
        });
    }
}

export const registerUser = (email: string, password: string, username: string): { success: boolean, message?: string, user?: User } => {
  if (email === ADMIN_EMAIL) {
       return { success: false, message: 'هذا البريد الإلكتروني محجوز للإدارة' };
  }
  
  const users = getUsers();
  
  if (users.find(u => u.email === email)) {
    return { success: false, message: 'البريد الإلكتروني مسجل مسبقاً' };
  }

  const lastSerial = users.length > 0 
    ? Math.max(...users.map(u => parseInt(u.serialId))) 
    : 10000;
  
  const newUser: User = {
    id: Math.random().toString(36).substr(2, 9),
    serialId: (lastSerial + 1).toString(),
    email,
    password, 
    username,
    balanceUSD: 0,
    balanceCoins: 0,
    createdAt: Date.now(),
    isBanned: false,
    isDeactivated: false
  };

  users.push(newUser);
  saveUsers(users); 
  
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

  return { success: true, user: newUser };
};

export const createSubAdmin = (email: string, password: string, username: string, permissions: AdminPermissions): { success: boolean, message?: string } => {
    if (email === ADMIN_EMAIL) {
        return { success: false, message: 'لا يمكن استخدام بريد المالك' };
    }
    const users = getUsers();
    if (users.find(u => u.email === email)) {
        return { success: false, message: 'البريد الإلكتروني مستخدم بالفعل' };
    }

    const lastSerial = users.length > 0 ? Math.max(...users.map(u => parseInt(u.serialId))) : 10000;

    const newAdmin: User = {
        id: Math.random().toString(36).substr(2, 9),
        serialId: (lastSerial + 1).toString(),
        email,
        password,
        username,
        balanceUSD: 0,
        balanceCoins: 0,
        createdAt: Date.now(),
        isBanned: false,
        isAdmin: true,
        permissions: permissions
    };

    users.push(newAdmin);
    saveUsers(users);
    return { success: true };
};

export const updateUserPermissions = (userId: string, permissions: AdminPermissions): boolean => {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return false;
    if (users[index].email === ADMIN_EMAIL) return false;

    users[index].permissions = permissions;
    saveUsers(users);
    return true;
}

export const loginUser = (email: string, password: string): { success: boolean, message?: string, user?: User } => {
  // 1. Check for Super Admin (Owner)
  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      const adminUser: User = {
          id: 'SUPER_ADMIN',
          serialId: '00001',
          email: ADMIN_EMAIL,
          password: '***',
          username: 'مدير الموقع (المالك)',
          balanceUSD: 999999,
          balanceCoins: 999999,
          createdAt: Date.now(),
          isBanned: false,
          isAdmin: true,
          permissions: {
              canManageOrders: true,
              canManageWallet: true,
              canManageSettings: true,
              canManageTeam: true
          }
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminUser));
      return { success: true, user: adminUser };
  }

  // 2. Check Regular Users / Sub-Admins
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return { success: false, message: 'بيانات الدخول غير صحيحة' };
  }

  // 3. CHECK BAN STATUS (Flexible System)
  if (user.isBanned) {
      return { success: false, message: '⛔ عذراً، تم حظر حسابك نهائياً من قبل الإدارة لمخالفة القوانين.' };
  }

  // 4. CHECK DEACTIVATION STATUS
  if (user.isDeactivated) {
      return { success: false, message: '🔕 تم تعطيل هذا الحساب أو إغلاق الصفحة مؤقتاً. يرجى التواصل مع الدعم لإعادة التنشيط.' };
  }

  if (user.banExpiresAt && user.banExpiresAt > Date.now()) {
      const expireDate = new Date(user.banExpiresAt).toLocaleDateString('ar-EG');
      const expireTime = new Date(user.banExpiresAt).toLocaleTimeString('ar-EG');
      return { success: false, message: `⏳ حسابك مجمد مؤقتاً حتى ${expireDate} الساعة ${expireTime}.` };
  }

  // If freeze expired, clear it
  if (user.banExpiresAt && user.banExpiresAt <= Date.now()) {
      user.banExpiresAt = undefined;
      const index = users.findIndex(u => u.id === user.id);
      if (index !== -1) {
          users[index] = user;
          saveUsers(users);
      }
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return { success: true, user };
};

export const getCurrentUser = (): User | null => {
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    if (data) {
        const sessionUser = JSON.parse(data);
        if (sessionUser.email === ADMIN_EMAIL) return sessionUser;

        const allUsers = getUsers();
        const freshUser = allUsers.find(u => u.id === sessionUser.id);
        
        if (freshUser) {
            // Check Ban/Freeze/Deactivation on every refresh
            if (freshUser.isBanned || freshUser.isDeactivated) {
                localStorage.removeItem(CURRENT_USER_KEY);
                return null;
            }
            if (freshUser.banExpiresAt && freshUser.banExpiresAt > Date.now()) {
                 localStorage.removeItem(CURRENT_USER_KEY);
                 return null;
            }
        }

        return freshUser || sessionUser;
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const logoutUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const updateCurrentSession = (user: User) => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export const updateUserProfile = (userId: string, newUsername: string): { success: boolean, message?: string } => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.isAdmin) {
         return { success: true, message: 'لا يمكن تعديل بيانات المدير الأساسية من هنا' };
    }

    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return { success: false, message: 'المستخدم غير موجود' };

    users[userIndex].username = newUsername;

    saveUsers(users); 
    updateCurrentSession(users[userIndex]); 

    return { success: true, message: 'تم تحديث الاسم بنجاح' };
};

export const getUserBySerial = (serialId: string): User | undefined => {
    const users = getUsers();
    return users.find(u => u.serialId === serialId);
}

export const updateUserBalance = (serialId: string, type: 'USD' | 'COINS', amount: number): boolean => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.serialId === serialId);
    
    if (userIndex === -1) return false;

    if (type === 'USD') {
        users[userIndex].balanceUSD += amount;
    } else {
        users[userIndex].balanceCoins += amount;
    }

    saveUsers(users); 
    return true;
}

export const deductUserBalance = (userId: string, amount: number): { success: boolean, message?: string } => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return { success: false, message: 'المستخدم غير موجود' };

    if (users[userIndex].balanceUSD < amount) {
        return { success: false, message: 'رصيد المحفظة غير كافٍ' };
    }

    users[userIndex].balanceUSD -= amount;
    saveUsers(users); 
    updateCurrentSession(users[userIndex]);

    return { success: true };
};

export const zeroUserBalance = (serialId: string, type: 'USD' | 'COINS'): boolean => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.serialId === serialId);
    if (userIndex === -1) return false;
    
    if (type === 'USD') {
        users[userIndex].balanceUSD = 0;
    } else {
        users[userIndex].balanceCoins = 0;
    }
    saveUsers(users); 
    return true;
};

export const wipeUserBalances = (serialId: string): boolean => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.serialId === serialId);
    if (userIndex === -1) return false;
    
    users[userIndex].balanceUSD = 0;
    users[userIndex].balanceCoins = 0;
    saveUsers(users); 
    return true;
};

// --- GLOBAL COIN WIPE (Super Admin Only) ---
export const wipeAllCoinsGlobal = async (): Promise<{ success: boolean, message?: string }> => {
    const currentUser = getCurrentUser();
    if (currentUser?.email !== ADMIN_EMAIL) {
        return { success: false, message: 'غير مصرح لك بهذا الإجراء' };
    }

    const users = getUsers();
    
    // Set all coins to 0 for all users
    const updatedUsers = users.map(u => ({
        ...u,
        balanceCoins: 0
    }));
    
    saveUsers(updatedUsers);
    
    // Batch update for Cloud
    if (ENABLE_CLOUD_DB && db && isCloudHealthy) {
        try {
            const batch = writeBatch(db);
            const batchList = updatedUsers.slice(0, 490);
            
            batchList.forEach(u => {
                 if (u.id && u.id !== 'SUPER_ADMIN') {
                     const ref = doc(db, "users", u.id);
                     batch.update(ref, { balanceCoins: 0 });
                 }
            });
            await batch.commit();
        } catch(e) { handleCloudError(e, "Global Wipe Coins"); }
    }

    return { success: true, message: 'تم تصفير كوينزات جميع المستخدمين بنجاح.' };
};

// --- NEW: GLOBAL ORDER HISTORY WIPE (Super Admin Only) ---
export const wipeAllOrdersGlobal = async (): Promise<{ success: boolean, message?: string }> => {
    const currentUser = getCurrentUser();
    if (currentUser?.email !== ADMIN_EMAIL) {
        return { success: false, message: 'غير مصرح لك بهذا الإجراء' };
    }

    // 1. Clear Local Storage
    localStorage.removeItem(ORDERS_KEY);

    // 2. Clear Cloud (Firestore)
    if (ENABLE_CLOUD_DB && db && isCloudHealthy) {
        try {
            // Firestore doesn't support deleting a whole collection directly in web SDK easily.
            // We have to fetch and delete in batches.
            const q = query(collection(db, "orders"), limit(500)); // Limit to prevent timeout, might need loops for huge DB
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                 const batch = writeBatch(db);
                 snapshot.docs.forEach((doc) => {
                     batch.delete(doc.ref);
                 });
                 await batch.commit();
            }
        } catch(e) { handleCloudError(e, "Global Wipe Orders"); }
    }

    return { success: true, message: 'تم حذف سجل الطلبات بالكامل بنجاح.' };
}

// --- NEW ADVANCED BAN SYSTEM ---
export const setUserBanStatus = (serialId: string, type: 'none' | 'permanent' | 'temporary', durationHours?: number): { success: boolean, message?: string } => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.serialId === serialId);
    
    if (userIndex === -1) return { success: false, message: 'المستخدم غير موجود' };

    if (users[userIndex].email === ADMIN_EMAIL) {
        return { success: false, message: '⛔ لا يمكن حظر مالك الموقع!' };
    }

    const user = users[userIndex];

    if (type === 'permanent') {
        user.isBanned = true;
        user.banExpiresAt = undefined;
    } else if (type === 'temporary') {
        if (!durationHours) durationHours = 24; // Default 24h
        user.isBanned = false;
        user.banExpiresAt = Date.now() + (durationHours * 60 * 60 * 1000);
    } else {
        // Unban
        user.isBanned = false;
        user.banExpiresAt = undefined;
    }

    users[userIndex] = user;
    saveUsers(users);
    return { success: true };
}

export const toggleUserBan = (serialId: string): { success: boolean, newStatus?: boolean, message?: string } => {
    const result = setUserBanStatus(serialId, 'permanent'); 
    return { success: result.success, message: result.message };
};

export const adminResetUserPassword = (serialId: string, newTemporaryPass: string): { success: boolean, message?: string } => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.serialId === serialId);
    
    if (userIndex === -1) return { success: false, message: 'المستخدم غير موجود' };
    if (users[userIndex].email === ADMIN_EMAIL) return { success: false, message: 'لا يمكن تغيير كلمة مرور المالك من هنا' };

    users[userIndex].password = newTemporaryPass;
    users[userIndex].mustChangePassword = true; 

    saveUsers(users);
    return { success: true, message: 'تم إعادة تعيين كلمة المرور بنجاح' };
}

// --- NEW MANAGEMENT FUNCTIONS ---

export const removeAdminPrivileges = (serialId: string): { success: boolean, message?: string } => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.serialId === serialId);
    
    if (userIndex === -1) return { success: false, message: 'المستخدم غير موجود' };
    if (users[userIndex].email === ADMIN_EMAIL) return { success: false, message: 'لا يمكن إزالة صلاحيات المالك' };

    users[userIndex].isAdmin = false;
    users[userIndex].permissions = undefined;

    saveUsers(users);
    return { success: true, message: 'تم سحب الصلاحيات وعاد الحساب إلى مستخدم عادي.' };
};

export const deleteUserPermanently = (serialId: string): { success: boolean, message?: string } => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.serialId === serialId);
    
    if (userIndex === -1) return { success: false, message: 'المستخدم غير موجود' };
    if (users[userIndex].email === ADMIN_EMAIL) return { success: false, message: 'لا يمكن حذف المالك' };

    const userId = users[userIndex].id;
    
    // Remove from Local Storage
    const updatedUsers = users.filter(u => u.serialId !== serialId);
    saveUsers(updatedUsers);

    // Remove from Cloud if enabled
    if (ENABLE_CLOUD_DB && db && isCloudHealthy) {
        try {
            deleteDoc(doc(db, "users", userId));
        } catch(e) { handleCloudError(e, "Delete User"); }
    }

    return { success: true, message: 'تم حذف الحساب وجميع البيانات نهائياً.' };
};

export const toggleUserDeactivation = (serialId: string): { success: boolean, message?: string, isDeactivated?: boolean } => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.serialId === serialId);
    
    if (userIndex === -1) return { success: false, message: 'المستخدم غير موجود' };
    if (users[userIndex].email === ADMIN_EMAIL) return { success: false, message: 'لا يمكن تعطيل المالك' };

    const newState = !users[userIndex].isDeactivated;
    users[userIndex].isDeactivated = newState;

    saveUsers(users);
    return { 
        success: true, 
        message: newState ? 'تم إغلاق الصفحة وتعطيل الحساب مؤقتاً.' : 'تم إعادة تنشيط الحساب والصفحة.',
        isDeactivated: newState
    };
};

// --- SYSTEM NOTIFICATIONS LOGIC ---

export const getSystemNotifications = (): SystemNotification[] => {
    try {
        const data = localStorage.getItem(NOTIFICATIONS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
};

export const saveSystemNotifications = async (notifications: SystemNotification[]) => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    // Not syncing individually here to avoid mass writes in one function, usually handled by batch or single updates
};

export const sendBroadcastNotification = async (title: string, message: string): Promise<{success: boolean, message?: string}> => {
    const users = getUsers();
    const activeUsers = users.filter(u => !u.isBanned && !u.isDeactivated && u.email !== ADMIN_EMAIL);
    
    if (activeUsers.length === 0) {
        return { success: false, message: 'لا يوجد مستخدمين نشطين لإرسال الإشعار لهم' };
    }

    const currentNotifications = getSystemNotifications();
    const newNotifications: SystemNotification[] = [];

    // Create a notification for EACH user
    activeUsers.forEach(user => {
        const notif: SystemNotification = {
            id: Math.random().toString(36).substr(2, 9),
            userId: user.serialId,
            title: title,
            message: message,
            timestamp: Date.now(),
            isRead: false,
            type: 'system'
        };
        newNotifications.push(notif);
    });

    const updatedList = [...newNotifications, ...currentNotifications];
    saveSystemNotifications(updatedList);

    // Sync to Cloud (Batch Write for efficiency)
    if (ENABLE_CLOUD_DB && db && isCloudHealthy) {
        try {
            const batch = writeBatch(db);
            // Limit batch size to 500 (Firebase limit)
            const batchList = newNotifications.slice(0, 490); 
            
            batchList.forEach((notif) => {
                const ref = doc(collection(db, "notifications"));
                batch.set(ref, notif);
            });
            
            await batch.commit();
        } catch (e) {
            handleCloudError(e, "Broadcast Notification");
            // Don't fail the whole operation if cloud fails, local is updated
        }
    }

    return { success: true, message: `تم إرسال الإشعار بنجاح إلى ${activeUsers.length} مستخدم` };
};

// NEW: Wipe All Notifications History (Admin Only)
export const wipeAllNotificationsGlobal = async (): Promise<{ success: boolean, message?: string }> => {
    const currentUser = getCurrentUser();
    if (currentUser?.email !== ADMIN_EMAIL) {
        return { success: false, message: 'غير مصرح لك بهذا الإجراء' };
    }

    // 1. Clear Local Storage
    localStorage.removeItem(NOTIFICATIONS_KEY);

    // 2. Clear Cloud (Firestore)
    if (ENABLE_CLOUD_DB && db && isCloudHealthy) {
        try {
            const q = query(collection(db, "notifications"), limit(500));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                 const batch = writeBatch(db);
                 snapshot.docs.forEach((doc) => {
                     batch.delete(doc.ref);
                 });
                 await batch.commit();
            }
        } catch(e) { handleCloudError(e, "Global Wipe Notifications"); }
    }

    return { success: true, message: 'تم حذف أرشيف الإشعارات بالكامل لجميع المستخدمين.' };
};

export const markNotificationAsRead = async (notificationId: string) => {
    const notifications = getSystemNotifications();
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
        notifications[index].isRead = true;
        saveSystemNotifications(notifications);
        
        // Note: We are not syncing read status back to cloud for every click to save quota in this demo,
        // but in production, you should update the specific doc.
    }
}


export const initializeData = () => {
    if (!localStorage.getItem(VISITORS_KEY)) {
        localStorage.setItem(VISITORS_KEY, '1250');
    }
};