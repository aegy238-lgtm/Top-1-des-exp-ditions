import { Order, OrderStatus, DashboardStats, AgencyConfig, User, PaymentMethod, BannerConfig, AppConfig, ContactConfig, SiteConfig } from '../types';
import { GLOBAL_APPS_CONFIG, GLOBAL_BANNER_CONFIG, GLOBAL_CONTACT_CONFIG } from '../config';
import { firebaseConfig, ENABLE_CLOUD_DB } from '../firebaseConfig';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, setDoc, query, orderBy, limit } from 'firebase/firestore';

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

// --- Super Admin Credentials ---
const ADMIN_EMAIL = 'admin@haneen.com';
const ADMIN_PASS = 'zxcvbnmn123';

// --- Default Site Config ---
const DEFAULT_SITE_CONFIG: SiteConfig = {
    name: 'منصة حنين للشحن',
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
    // If DB doesn't exist or permission denied, stop trying to sync to prevent lag
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
        // 1. Sync Banner
        const bannerSnap = await getDoc(doc(db, "settings", "banner"));
        if (bannerSnap.exists()) {
            localStorage.setItem(BANNER_CONFIG_KEY, JSON.stringify(bannerSnap.data()));
        }

        // 2. Sync Apps
        const appsSnap = await getDoc(doc(db, "settings", "apps"));
        if (appsSnap.exists()) {
            localStorage.setItem(APPS_CONFIG_KEY, JSON.stringify(appsSnap.data().list));
        }

        // 3. Sync Contact
        const contactSnap = await getDoc(doc(db, "settings", "contact"));
        if (contactSnap.exists()) {
            localStorage.setItem(CONTACT_CONFIG_KEY, JSON.stringify(contactSnap.data()));
        }

        // 4. Sync Site Info
        const siteSnap = await getDoc(doc(db, "settings", "site"));
        if (siteSnap.exists()) {
            localStorage.setItem(SITE_CONFIG_KEY, JSON.stringify(siteSnap.data()));
        }
        
    } catch (e) {
        handleCloudError(e, "Settings Sync");
    }
}

// --- Orders Logic ---
let lastSyncTime = 0;

export const getOrders = (): Order[] => {
  // 1. Return Local Data Immediately (Fast)
  let localOrders: Order[] = [];
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    localOrders = data ? JSON.parse(data) : [];
  } catch (e) {
    localOrders = [];
  }

  // 2. Background Sync (Every 5 seconds max)
  const now = Date.now();
  if (ENABLE_CLOUD_DB && db && isCloudHealthy && (now - lastSyncTime > 5000)) {
      lastSyncTime = now;
      syncOrdersFromCloud(); 
      syncUsersFromCloud();
      syncSettingsFromCloud(); // Sync settings as well
  }

  return localOrders;
};

export const saveOrder = async (order: Order): Promise<void> => {
  // 1. Save Local
  const orders = getOrders(); // This gets local
  const updatedOrders = [order, ...orders];
  localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));

  // 2. Save Cloud
  if (ENABLE_CLOUD_DB && db && isCloudHealthy) {
      try {
          // Use order ID as document ID to prevent duplicates
          await setDoc(doc(db, "orders", order.id), order);
      } catch (e) {
          handleCloudError(e, "Save Order");
      }
  }
};

export const updateOrder = async (orderId: string, updates: Partial<Order>): Promise<boolean> => {
    // 1. Update Local
    const orders = getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return false;

    orders[index] = { ...orders[index], ...updates };
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    // 2. Update Cloud
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
        return data ? JSON.parse(data) : DEFAULT_SITE_CONFIG;
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
            // Save as an object containing the list
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
    // Local
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Cloud (Sync all - simplified for this use case, ideally only changed user)
    if (ENABLE_CLOUD_DB && db && isCloudHealthy) {
        users.forEach(async (u) => {
            try {
                // Don't save the hardcoded admin to cloud database to keep it secret/local logic
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
    isBanned: false
  };

  users.push(newUser);
  saveUsers(users); // Syncs to cloud
  
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

  return { success: true, user: newUser };
};

export const loginUser = (email: string, password: string): { success: boolean, message?: string, user?: User } => {
  // 1. Check for Super Admin
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
          isAdmin: true // Special Flag
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminUser));
      return { success: true, user: adminUser };
  }

  // 2. Check Regular Users
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return { success: false, message: 'بيانات الدخول غير صحيحة' };
  }

  if (user.isBanned) {
      return { success: false, message: 'عذراً، تم حظر حسابك من قبل الإدارة. يرجى التواصل مع الدعم.' };
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return { success: true, user };
};

export const getCurrentUser = (): User | null => {
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    if (data) {
        const sessionUser = JSON.parse(data);
        
        // If it's the admin, return immediately
        if (sessionUser.isAdmin) return sessionUser;

        const allUsers = getUsers();
        // Sync check: ensure session user matches latest data
        const freshUser = allUsers.find(u => u.id === sessionUser.id);
        
        if (freshUser && freshUser.isBanned) {
            localStorage.removeItem(CURRENT_USER_KEY);
            return null;
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
    // Prevent updating Admin profile via normal user flow
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.isAdmin) {
         return { success: true, message: 'لا يمكن تعديل بيانات المدير الأساسية من هنا' };
    }

    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return { success: false, message: 'المستخدم غير موجود' };

    users[userIndex].username = newUsername;

    saveUsers(users); // Cloud Sync
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

    saveUsers(users); // Cloud Sync
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
    saveUsers(users); // Cloud Sync
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
    saveUsers(users); // Cloud Sync
    return true;
};

export const toggleUserBan = (serialId: string): { success: boolean, newStatus?: boolean } => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.serialId === serialId);
    
    if (userIndex === -1) return { success: false };

    // Toggle ban status
    const currentStatus = users[userIndex].isBanned || false;
    users[userIndex].isBanned = !currentStatus;

    saveUsers(users); // Cloud Sync
    return { success: true, newStatus: !currentStatus };
};

export const initializeData = () => {
    if (!localStorage.getItem(VISITORS_KEY)) {
        localStorage.setItem(VISITORS_KEY, '1250');
    }
};
