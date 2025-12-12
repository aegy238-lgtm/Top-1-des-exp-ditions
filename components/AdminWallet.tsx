import React, { useState, useEffect } from 'react';
import { Search, Coins, Plus, UserCheck, AlertCircle, Trash2, Ban, ShieldAlert, CheckCircle2, Eye, Clock, Lock, Users, Eraser } from 'lucide-react';
import { getUserBySerial, updateUserBalance, zeroUserBalance, setUserBanStatus, getUsers, wipeUserBalances } from '../services/storageService';
import { User } from '../types';

const AdminWallet: React.FC = () => {
  const [serialId, setSerialId] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'USD' | 'COINS'>('COINS');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);

  useEffect(() => {
    // Load recent users to "Identify" them (as per request)
    const allUsers = getUsers().filter(u => !u.isAdmin).slice(-10).reverse(); // Last 10 registered
    setRecentUsers(allUsers);
  }, []);

  const handleSearch = () => {
    if (!serialId) return;
    const user = getUserBySerial(serialId);
    if (user) {
      setFoundUser(user);
      setMessage(null);
    } else {
      setFoundUser(null);
      setMessage({ type: 'error', text: 'لم يتم العثور على مستخدم بهذا الرقم التسلسلي' });
    }
  };

  const handleQuickSelect = (user: User) => {
      setSerialId(user.serialId);
      setFoundUser(user);
      setMessage(null);
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundUser) return;
    
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
        setMessage({ type: 'error', text: 'يرجى إدخال مبلغ صحيح' });
        return;
    }

    const success = updateUserBalance(foundUser.serialId, type, val);
    if (success) {
        setMessage({ type: 'success', text: `تم إضافة ${val} ${type === 'USD' ? 'دولار' : 'كوينز'} بنجاح للمستخدم ${foundUser.username}` });
        setAmount('');
        const updated = getUserBySerial(serialId);
        if (updated) setFoundUser(updated);
    } else {
        setMessage({ type: 'error', text: 'حدث خطأ أثناء التحديث' });
    }
  };

  const handleZeroBalance = (currencyType: 'USD' | 'COINS') => {
    if(!foundUser) return;
    if(window.confirm(`⚠️ تحذير: هل أنت متأكد تماماً من تصفير رصيد ${currencyType === 'USD' ? 'الدولار' : 'الكوينز'}؟`)) {
        const result = zeroUserBalance(foundUser.serialId, currencyType);
        if(result) {
            const updated = getUserBySerial(foundUser.serialId);
            if(updated) setFoundUser(updated);
            setMessage({ type: 'success', text: `تم تصفير رصيد ${currencyType === 'USD' ? 'الدولار' : 'الكوينز'} بنجاح` });
        }
    }
  };

  const handleWipeAction = () => {
     if (!foundUser) return;
     if (window.confirm(`⚠️ تحذير خطير: هل أنت متأكد من تصفير جميع أرصدة (الدولار والكوينز) للمستخدم ${foundUser.username}؟ لا يمكن التراجع عن هذا الإجراء.`)) {
         const success = wipeUserBalances(foundUser.serialId);
         if (success) {
              const updated = getUserBySerial(foundUser.serialId);
              if (updated) setFoundUser(updated);
              setMessage({ type: 'success', text: 'تم تصفير الحساب بالكامل (دولار وكوينز) بنجاح' });
         }
     }
  }

  const handleBanAction = (action: 'permanent' | '24h' | '72h' | 'unban') => {
      if (!foundUser) return;
      
      let confirmMsg = '';
      if (action === 'permanent') confirmMsg = `⛔ حظر نهائي: هل أنت متأكد من حظر ${foundUser.username} نهائياً؟`;
      else if (action === '24h') confirmMsg = `⏳ تجميد مؤقت: هل تريد تجميد حساب ${foundUser.username} لمدة 24 ساعة؟`;
      else if (action === '72h') confirmMsg = `⏳ تجميد مؤقت: هل تريد تجميد حساب ${foundUser.username} لمدة 3 أيام؟`;
      else confirmMsg = `✅ رفع العقوبة: هل تريد إعادة تفعيل حساب ${foundUser.username}؟`;

      if (window.confirm(confirmMsg)) {
          let result;
          if (action === 'permanent') result = setUserBanStatus(foundUser.serialId, 'permanent');
          else if (action === '24h') result = setUserBanStatus(foundUser.serialId, 'temporary', 24);
          else if (action === '72h') result = setUserBanStatus(foundUser.serialId, 'temporary', 72);
          else result = setUserBanStatus(foundUser.serialId, 'none');

          if (result.success) {
              const updated = getUserBySerial(foundUser.serialId);
              if (updated) setFoundUser(updated);
              setMessage({ type: 'success', text: 'تم تحديث حالة العقوبة بنجاح' });
          } else {
              setMessage({ type: 'error', text: result.message || 'فشل الإجراء' });
          }
      }
  }

  // Helper to get status display
  const getUserStatus = (user: User) => {
      if (user.isBanned) return <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><Ban className="w-3 h-3" /> محظور نهائياً</span>;
      if (user.banExpiresAt && user.banExpiresAt > Date.now()) {
          const hoursLeft = Math.ceil((user.banExpiresAt - Date.now()) / (1000 * 60 * 60));
          return <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> مجمد ({hoursLeft}س)</span>;
      }
      return <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> نشط</span>;
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500 rounded-lg">
                <Users className="w-6 h-6 text-white" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-white">مركز التحكم بالأعضاء والرقابة</h2>
                <p className="text-slate-400 text-sm">كشف الهوية، إدارة الأرصدة، ونظام العقوبات الذكي</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
            
            {/* Sidebar: Identity Detection (Recent Users) */}
            <div className="lg:col-span-1 border-l border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    كشف الهوية (آخر المسجلين)
                </h3>
                <div className="space-y-2">
                    {recentUsers.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">لا يوجد أعضاء جدد</p>
                    ) : (
                        recentUsers.map(u => (
                            <div 
                                key={u.id} 
                                onClick={() => handleQuickSelect(u)}
                                className={`p-3 rounded-lg border border-slate-200 bg-white cursor-pointer hover:border-indigo-300 transition-all shadow-sm
                                    ${foundUser?.id === u.id ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-slate-800 text-sm truncate w-24">{u.username}</span>
                                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1 rounded">{u.serialId}</span>
                                </div>
                                <div className="text-xs text-indigo-600 font-medium truncate mb-2">{u.email}</div>
                                <div className="flex justify-between items-center">
                                    {getUserStatus(u)}
                                    <span className="text-[10px] text-slate-400">{new Date(u.createdAt).toLocaleDateString('ar-EG')}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Control Area */}
            <div className="lg:col-span-2 p-6 md:p-8">
                {/* Search */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 text-slate-400 absolute right-3 top-3.5" />
                        <input 
                            type="text" 
                            placeholder="بحث دقيق برقم الـ ID (مثال: 10001)"
                            className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                            value={serialId}
                            onChange={(e) => setSerialId(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleSearch}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold transition-colors w-full sm:w-auto"
                    >
                        بحث
                    </button>
                </div>

                {foundUser ? (
                    <div className="animate-fade-in space-y-6">
                        {/* User Profile Card */}
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
                             {/* Status Banner */}
                             <div className="absolute top-0 left-0 p-4">
                                {getUserStatus(foundUser)}
                             </div>

                             <div className="flex items-center gap-4 mb-4 mt-2">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl font-bold text-slate-400">
                                    {foundUser.username.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{foundUser.username}</h3>
                                    <p className="text-indigo-600 font-medium text-sm">{foundUser.email}</p>
                                    <p className="text-slate-400 text-xs mt-1 font-mono">ID: {foundUser.serialId}</p>
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                                    <span className="text-emerald-800 text-xs font-bold block">رصيد الدولار</span>
                                    <span className="text-2xl font-bold text-emerald-600">${foundUser.balanceUSD.toFixed(2)}</span>
                                </div>
                                <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg">
                                    <span className="text-yellow-800 text-xs font-bold block">رصيد الكوينز</span>
                                    <span className="text-2xl font-bold text-yellow-600">{foundUser.balanceCoins}</span>
                                </div>
                             </div>
                        </div>

                        {/* Balance Actions */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Coins className="w-5 h-5 text-emerald-600" />
                                إدارة الرصيد
                            </h4>
                            <form onSubmit={handleDeposit} className="flex gap-3">
                                <select 
                                    className="p-3 rounded-lg border border-slate-300 outline-none text-sm"
                                    value={type}
                                    onChange={(e) => setType(e.target.value as any)}
                                >
                                    <option value="COINS">كوينز</option>
                                    <option value="USD">دولار</option>
                                </select>
                                <input 
                                    type="number"
                                    step="0.01"
                                    placeholder="القيمة"
                                    className="flex-1 p-3 rounded-lg border border-slate-300 outline-none"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                                <button type="submit" className="bg-emerald-600 text-white px-4 rounded-lg font-bold hover:bg-emerald-700">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </form>
                            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                                <button onClick={() => handleZeroBalance('USD')} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded border border-red-200">
                                    تصفير الدولار
                                </button>
                                <button onClick={() => handleZeroBalance('COINS')} className="text-xs font-bold text-amber-500 hover:bg-amber-50 px-3 py-2 rounded border border-amber-200">
                                    تصفير الكوينز
                                </button>
                            </div>
                        </div>

                        {/* Penalty System (The new Logic) */}
                        <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                            <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5" />
                                نظام العقوبات والرقابة
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <button 
                                    onClick={() => handleBanAction('24h')}
                                    className="bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 py-3 rounded-lg text-sm font-bold flex flex-col items-center gap-1 shadow-sm"
                                >
                                    <Clock className="w-4 h-4" />
                                    تجميد 24 ساعة
                                </button>
                                <button 
                                    onClick={handleWipeAction}
                                    className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 py-3 rounded-lg text-sm font-bold flex flex-col items-center gap-1 shadow-sm"
                                >
                                    <Eraser className="w-4 h-4" />
                                    تصفير شامل
                                </button>
                                <button 
                                    onClick={() => handleBanAction('72h')}
                                    className="bg-white border border-orange-300 text-orange-700 hover:bg-orange-50 py-3 rounded-lg text-sm font-bold flex flex-col items-center gap-1 shadow-sm"
                                >
                                    <Lock className="w-4 h-4" />
                                    تجميد 3 أيام
                                </button>
                                <button 
                                    onClick={() => handleBanAction('permanent')}
                                    className="bg-white border border-red-300 text-red-600 hover:bg-red-50 py-3 rounded-lg text-sm font-bold flex flex-col items-center gap-1 shadow-sm"
                                >
                                    <Ban className="w-4 h-4" />
                                    حظر نهائي
                                </button>
                                <button 
                                    onClick={() => handleBanAction('unban')}
                                    className="bg-white border border-emerald-300 text-emerald-600 hover:bg-emerald-50 py-3 rounded-lg text-sm font-bold flex flex-col items-center gap-1 shadow-sm"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    فك الحظر
                                </button>
                            </div>
                            <p className="text-xs text-red-400 mt-3">
                                * التجميد المؤقت يمنع الدخول لفترة محددة، بينما الحظر النهائي يغلق الحساب للأبد.
                                <br/>
                                * التصفير الشامل يقوم بمصادرة جميع أرصدة المستخدم (دولار وكوينز) فوراً.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <Users className="w-16 h-16 mb-4 opacity-20" />
                        <p>اختر عضواً من القائمة الجانبية أو ابحث بالرقم التسلسلي</p>
                    </div>
                )}

                {/* Messages */}
                {message && (
                    <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 animate-bounce-in ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                        {message.type === 'success' ? <UserCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWallet;