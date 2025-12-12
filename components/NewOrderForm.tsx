import React, { useState, useEffect } from 'react';
import { Send, Smartphone, User, CreditCard, Hash, Zap, Loader2, CheckCircle2, Wallet, Users, Layout, Coins } from 'lucide-react';
import { Currency, Order, OrderStatus, PaymentMethod, AppConfig, ContactConfig } from '../types';
import { saveOrder, getAgencyConfig, getCurrentUser, deductUserBalance, getAppConfigs, getContactConfig } from '../services/storageService';

// Fallback number if config is missing
const DEFAULT_WHATSAPP = '201033851941';

// Professional labels
const CURRENCY_LABELS: Record<Currency, string> = {
  // Global
  [Currency.USD]: 'دولار أمريكي (USD)',
  [Currency.EUR]: 'يورو (EUR)',
  [Currency.GBP]: 'جنيه إسترليني (GBP)',
  // Gulf
  [Currency.SAR]: 'ريال سعودي (SAR)',
  [Currency.AED]: 'درهم إماراتي (AED)',
  [Currency.KWD]: 'دينار كويتي (KWD)',
  [Currency.QAR]: 'ريال قطري (QAR)',
  [Currency.BHD]: 'دينار بحريني (BHD)',
  [Currency.OMR]: 'ريال عماني (OMR)',
  // Arab
  [Currency.EGP]: 'جنيه مصري (EGP)',
  [Currency.JOD]: 'دينار أردني (JOD)',
  [Currency.IQD]: 'دينار عراقي (IQD)',
  [Currency.YER]: 'ريال يمني (YER)',
  [Currency.LBP]: 'ليرة لبنانية (LBP)',
  [Currency.SYP]: 'ليرة سورية (SYP)',
  [Currency.SDG]: 'جنيه سوداني (SDG)',
  [Currency.LYD]: 'دينار ليبي (LYD)',
  [Currency.TND]: 'دينار تونسي (TND)',
  [Currency.DZD]: 'دينار جزائري (DZD)',
  [Currency.MAD]: 'درهم مغربي (MAD)',
  [Currency.MRU]: 'أوقية موريتانية (MRU)',
  [Currency.SOS]: 'شلن صومالي (SOS)',
  [Currency.DJF]: 'فرنك جيبوتي (DJF)',
  [Currency.KMF]: 'فرنك قمري (KMF)',
};

interface NewOrderFormProps {
  onOrderSuccess: () => void;
}

const NewOrderForm: React.FC<NewOrderFormProps> = ({ onOrderSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    userId: '',
    appName: '',
    amount: '',
    currency: Currency.USD
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.AGENT);
  const [loading, setLoading] = useState(false);
  const [processingState, setProcessingState] = useState<'idle' | 'connecting' | 'shipping' | 'success'>('idle');
  const [isAgencyConnected, setIsAgencyConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [errorMessage, setErrorMessage] = useState('');
  
  // App & Contact Config State
  const [availableApps, setAvailableApps] = useState<AppConfig[]>([]);
  const [selectedAppConfig, setSelectedAppConfig] = useState<AppConfig | null>(null);
  const [contactConfig, setContactConfig] = useState<ContactConfig | null>(null);

  useEffect(() => {
    const agencyConfig = getAgencyConfig();
    setIsAgencyConnected(agencyConfig.isConnected);
    
    // Initial Load
    setAvailableApps(getAppConfigs());
    setContactConfig(getContactConfig());

    // Auto fill if user is logged in
    const user = getCurrentUser();
    if (user) {
        setCurrentUser(user);
        setFormData(prev => ({
            ...prev,
            username: user.username,
            userId: user.serialId
        }));
    }

    // POLL FOR CHANGES (Apps & Contact Settings)
    const interval = setInterval(() => {
      setAvailableApps(getAppConfigs());
      setContactConfig(getContactConfig());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Update selected config whenever availableApps updates or user changes selection
  useEffect(() => {
    if (formData.appName) {
      const appConfig = availableApps.find(app => app.name === formData.appName) || null;
      if (appConfig) {
          setSelectedAppConfig(appConfig);
      }
    }
  }, [availableApps, formData.appName]);

  const handleAppChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const appName = e.target.value;
      setFormData({...formData, appName: appName});
  };

  const generateWhatsAppLink = (phone: string) => {
      const message = `*طلب شحن جديد - منصة Top1* 🚀%0a
👤 اسم الحساب: ${formData.username}%0a
🆔 رقم الآيدي: ${formData.userId}%0a
📱 التطبيق: ${formData.appName}%0a
💰 المبلغ: ${formData.amount} ${CURRENCY_LABELS[formData.currency]}%0a
💳 طريقة الدفع: عبر الوكيل%0a
📅 التاريخ: ${new Date().toLocaleDateString('ar-EG')}`;
      return `https://wa.me/${phone}?text=${message}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const amount = parseFloat(formData.amount);
    if (!formData.username || !formData.userId || !formData.appName || isNaN(amount)) {
      alert('يرجى ملء جميع البيانات بشكل صحيح');
      setLoading(false);
      return;
    }

    // Determine Logic based on Payment Method
    if (paymentMethod === PaymentMethod.WALLET) {
        // --- PAY FROM SITE (WALLET) ---
        if (!currentUser) {
            setErrorMessage('يجب تسجيل الدخول أولاً للدفع من المحفظة');
            setLoading(false);
            return;
        }

        // 1. Deduct Balance Immediately
        const deduction = deductUserBalance(currentUser.id, amount);

        if (!deduction.success) {
            setErrorMessage(deduction.message || 'خطأ في عملية الخصم');
            setLoading(false);
            return;
        }

        // 2. Create Order with PENDING status
        const newOrder: Order = {
            id: Math.random().toString(36).substr(2, 9),
            username: formData.username,
            userId: formData.userId,
            appName: formData.appName,
            amount: amount,
            currency: formData.currency,
            status: OrderStatus.PENDING,
            paymentMethod: PaymentMethod.WALLET,
            date: new Date().toISOString(),
            timestamp: Date.now(),
            isRead: false
        };

        setProcessingState('connecting');
        setTimeout(() => {
            setProcessingState('shipping'); 
            setTimeout(() => {
                saveOrder(newOrder);
                setProcessingState('success');
                setTimeout(() => {
                    alert('تم إرسال البيانات بنجاح! انتظر الشحن خلال دقائق.');
                    setLoading(false);
                    setProcessingState('idle');
                    onOrderSuccess();
                }, 1000);
            }, 1000);
        }, 800);

    } else {
        // --- PAY VIA AGENT (WHATSAPP) ---
        const newOrder: Order = {
            id: Math.random().toString(36).substr(2, 9),
            username: formData.username,
            userId: formData.userId,
            appName: formData.appName,
            amount: amount,
            currency: formData.currency,
            status: OrderStatus.PENDING,
            paymentMethod: PaymentMethod.AGENT,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };

        saveOrder(newOrder);

        // Use configured phone or default
        const targetPhone = contactConfig?.primaryPhone || DEFAULT_WHATSAPP;
        const whatsappUrl = generateWhatsAppLink(targetPhone);

        setTimeout(() => {
            setLoading(false);
            window.open(whatsappUrl, '_blank');
            setLoading(false); // Reset loading state
            onOrderSuccess();
        }, 1500);
    }
  };

  const calculatedCoins = selectedAppConfig && formData.amount 
    ? (parseFloat(formData.amount) * selectedAppConfig.exchangeRate).toLocaleString()
    : '---';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 md:p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/20">
                    <Zap className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-white">بدء طلب شحن</h2>
            </div>
            {isAgencyConnected && (
                <div className="flex items-center gap-2 bg-slate-800 px-2 md:px-3 py-1 rounded-full border border-slate-700">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] md:text-xs text-slate-300 font-medium hidden sm:inline">الشحن الفوري مفعل</span>
                </div>
            )}
        </div>

        <div className="p-4 md:p-8">
            {/* Loading Overlay */}
            {loading && processingState !== 'idle' && (
                <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center animate-fade-in rounded-2xl">
                    {processingState === 'connecting' && (
                         <>
                            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
                            <h3 className="text-xl font-bold text-slate-800">جاري الاتصال بالسيرفر...</h3>
                         </>
                    )}
                    {processingState === 'shipping' && (
                         <>
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                                <Send className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">جاري إرسال الطلب...</h3>
                         </>
                    )}
                    {processingState === 'success' && (
                         <>
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">تمت العملية بنجاح!</h3>
                         </>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                
                {/* User Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <User className="w-4 h-4 text-emerald-500" />
                            اسم الحساب (كما يظهر في اللعبة)
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-medium text-sm md:text-base"
                            placeholder="Example Name"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Hash className="w-4 h-4 text-emerald-500" />
                            رقم المعرف (User ID)
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-mono text-sm md:text-base"
                            placeholder="12345678"
                            value={formData.userId}
                            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                        />
                    </div>
                </div>

                {/* App Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Layout className="w-4 h-4 text-emerald-500" />
                        اختر التطبيق / اللعبة
                    </label>
                    <div className="relative">
                        <select
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all appearance-none bg-white text-sm md:text-base"
                            value={formData.appName}
                            onChange={handleAppChange}
                        >
                            <option value="">-- اختر التطبيق --</option>
                            {availableApps.map((app) => (
                                <option key={app.id} value={app.name}>{app.name}</option>
                            ))}
                        </select>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                    {selectedAppConfig && (
                         <p className="text-xs text-emerald-600 font-bold px-1">
                            ✨ سعر الصرف: 1 دولار = {selectedAppConfig.exchangeRate} كوينز
                         </p>
                    )}
                </div>

                {/* Amount & Calculation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-emerald-500" />
                            مبلغ الشحن (بالدولار)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                required
                                min="1"
                                step="0.5"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-bold text-lg"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 flex items-center gap-2">
                            <Coins className="w-4 h-4 text-slate-400" />
                            ستحصل على (كوينز)
                        </label>
                        <div className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-600 font-bold text-lg flex items-center gap-2">
                            {calculatedCoins} <span className="text-xs font-normal text-slate-400">عملة</span>
                        </div>
                    </div>
                </div>

                {/* Payment Method Toggle */}
                <div className="pt-4 border-t border-slate-100">
                    <label className="text-sm font-bold text-slate-700 mb-4 block">طريقة الدفع</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <button
                            type="button"
                            onClick={() => setPaymentMethod(PaymentMethod.WALLET)}
                            className={`p-3 md:p-4 rounded-xl border-2 transition-all flex items-center gap-3 relative overflow-hidden
                                ${paymentMethod === PaymentMethod.WALLET 
                                    ? 'border-emerald-500 bg-emerald-50/50' 
                                    : 'border-slate-100 hover:border-slate-200'}`}
                        >
                            <div className={`p-2 rounded-full flex-shrink-0 ${paymentMethod === PaymentMethod.WALLET ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                <Wallet className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="text-right flex-1">
                                <span className={`block font-bold text-sm md:text-base ${paymentMethod === PaymentMethod.WALLET ? 'text-emerald-800' : 'text-slate-600'}`}>رصيد المحفظة</span>
                                <span className="text-xs text-slate-500">الخصم المباشر من حسابك</span>
                            </div>
                            {paymentMethod === PaymentMethod.WALLET && (
                                <div className="absolute top-2 left-2 text-emerald-500">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setPaymentMethod(PaymentMethod.AGENT)}
                            className={`p-3 md:p-4 rounded-xl border-2 transition-all flex items-center gap-3 relative overflow-hidden
                                ${paymentMethod === PaymentMethod.AGENT 
                                    ? 'border-green-500 bg-green-50/50' 
                                    : 'border-slate-100 hover:border-slate-200'}`}
                        >
                            <div className={`p-2 rounded-full flex-shrink-0 ${paymentMethod === PaymentMethod.AGENT ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                <Smartphone className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="text-right flex-1">
                                <span className={`block font-bold text-sm md:text-base ${paymentMethod === PaymentMethod.AGENT ? 'text-green-800' : 'text-slate-600'}`}>عبر الوكيل</span>
                                <span className="text-xs text-slate-500">تحويل بنكي / فودافون كاش</span>
                            </div>
                            {paymentMethod === PaymentMethod.AGENT && (
                                <div className="absolute top-2 left-2 text-green-500">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                            )}
                        </button>
                    </div>
                </div>

                {errorMessage && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-bold text-center animate-pulse border border-red-100">
                        {errorMessage}
                    </div>
                )}

                {/* Submit Buttons */}
                <div className="pt-2">
                    {paymentMethod === PaymentMethod.WALLET ? (
                         <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 md:py-4 rounded-xl font-bold text-base md:text-lg text-white shadow-xl shadow-emerald-200 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3
                                ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        >
                            {loading ? (
                                'جاري المعالجة...'
                            ) : (
                                <>
                                    <Zap className="w-5 h-5" />
                                    شحن فوري (خصم {formData.amount || '0'} $)
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 md:py-4 rounded-xl font-bold text-base md:text-lg text-white shadow-xl shadow-green-200 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3
                                    ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#25D366] hover:bg-[#128C7E]'}`}
                            >
                                <Smartphone className="w-6 h-6" />
                                {contactConfig?.buttonLabel || 'إرسال الطلب للوكيل (واتساب)'}
                            </button>
                            
                            {/* Secondary Buttons (If Configured) */}
                            {contactConfig?.secondaryPhone && (
                                <button
                                    type="button"
                                    onClick={() => window.open(generateWhatsAppLink(contactConfig.secondaryPhone!), '_blank')}
                                    className="w-full py-3 rounded-xl font-bold text-slate-600 border-2 border-slate-200 hover:bg-slate-50 transition-all text-sm md:text-base"
                                >
                                    تواصل مع الوكيل 2
                                </button>
                            )}
                             {contactConfig?.tertiaryPhone && (
                                <button
                                    type="button"
                                    onClick={() => window.open(generateWhatsAppLink(contactConfig.tertiaryPhone!), '_blank')}
                                    className="w-full py-3 rounded-xl font-bold text-slate-600 border-2 border-slate-200 hover:bg-slate-50 transition-all text-sm md:text-base"
                                >
                                    تواصل مع الوكيل 3
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default NewOrderForm;