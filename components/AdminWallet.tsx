import React, { useState } from 'react';
import { Search, Coins, DollarSign, Plus, UserCheck, AlertCircle, Trash2, Ban, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { getUserBySerial, updateUserBalance, zeroUserBalance, toggleUserBan } from '../services/storageService';
import { User } from '../types';

const AdminWallet: React.FC = () => {
  const [serialId, setSerialId] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'USD' | 'COINS'>('COINS');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleSearch = () => {
    const user = getUserBySerial(serialId);
    if (user) {
      setFoundUser(user);
      setMessage(null);
    } else {
      setFoundUser(null);
      setMessage({ type: 'error', text: 'لم يتم العثور على مستخدم بهذا الرقم التسلسلي' });
    }
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
        // Refresh user data
        const updated = getUserBySerial(serialId);
        if (updated) setFoundUser(updated);
    } else {
        setMessage({ type: 'error', text: 'حدث خطأ أثناء التحديث' });
    }
  };

  const handleZeroBalance = (currencyType: 'USD' | 'COINS') => {
    if(!foundUser) return;
    if(window.confirm(`هل أنت متأكد من تصفير رصيد ${currencyType === 'USD' ? 'الدولار' : 'الكوينز'} للمستخدم ${foundUser.username}؟ لا يمكن التراجع عن هذا الإجراء.`)) {
        const result = zeroUserBalance(foundUser.serialId, currencyType);
        if(result) {
            const updated = getUserBySerial(foundUser.serialId);
            if(updated) setFoundUser(updated);
            setMessage({ type: 'success', text: `تم تصفير رصيد ${currencyType === 'USD' ? 'الدولار' : 'الكوينز'} بنجاح` });
        }
    }
  };

  const handleBanToggle = () => {
    if(!foundUser) return;
    const action = foundUser.isBanned ? 'رفع الحظر عن' : 'حظر';
    if(window.confirm(`هل أنت متأكد من ${action} المستخدم ${foundUser.username}؟`)) {
        const result = toggleUserBan(foundUser.serialId);
        if(result.success) {
            const updated = getUserBySerial(foundUser.serialId);
            if(updated) setFoundUser(updated);
            setMessage({ 
                type: 'success', 
                text: result.newStatus ? 'تم حظر الحساب نهائياً' : 'تم إعادة تفعيل الحساب بنجاح' 
            });
        }
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-lg">
             <Coins className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">إدارة أرصدة المستخدمين</h2>
            <p className="text-slate-400 text-sm">بحث عن مستخدم وإضافة رصيد (كوينز / دولار)</p>
          </div>
        </div>

        <div className="p-8">
            {/* Search Section */}
            <div className="flex gap-4 mb-8">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-slate-400 absolute right-3 top-3.5" />
                    <input 
                        type="text" 
                        placeholder="أدخل الرقم التسلسلي للمستخدم (مثال: 10001)"
                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                        value={serialId}
                        onChange={(e) => setSerialId(e.target.value)}
                    />
                </div>
                <button 
                    onClick={handleSearch}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-6 rounded-xl font-bold transition-colors"
                >
                    بحث
                </button>
            </div>

            {/* User Details & Action */}
            {foundUser && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 animate-fade-in">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center 
                            ${foundUser.isBanned ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                            {foundUser.isBanned ? <Ban className="w-8 h-8" /> : <UserCheck className="w-8 h-8" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                {foundUser.username}
                                {foundUser.isBanned && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">محظور</span>}
                            </h3>
                            <div className="flex gap-4 mt-1 text-sm text-slate-600">
                                <span className="flex items-center gap-1 bg-white px-2 py-1 rounded border">
                                    <span className="font-bold">ID:</span> {foundUser.serialId}
                                </span>
                                <span className="flex items-center gap-1 bg-white px-2 py-1 rounded border">
                                    <span className="font-bold">البريد:</span> {foundUser.email}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-center">
                            <span className="text-slate-500">رصيد الدولار</span>
                            <span className="text-xl font-bold text-green-600">${foundUser.balanceUSD.toFixed(2)}</span>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-center">
                            <span className="text-slate-500">رصيد الكوينز</span>
                            <span className="text-xl font-bold text-yellow-600">{foundUser.balanceCoins} 🪙</span>
                        </div>
                    </div>

                    <form onSubmit={handleDeposit} className="space-y-4 mb-8">
                        <label className="block font-bold text-slate-700">إضافة رصيد جديد</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="relative">
                                <select 
                                    className="w-full p-3 rounded-lg border border-slate-300 outline-none focus:border-emerald-500"
                                    value={type}
                                    onChange={(e) => setType(e.target.value as any)}
                                    disabled={foundUser.isBanned ?? false}
                                >
                                    <option value="COINS">كوينز (عملات)</option>
                                    <option value="USD">دولار ($)</option>
                                </select>
                             </div>
                             <div className="relative">
                                <input 
                                    type="number"
                                    step="0.01"
                                    placeholder="المبلغ"
                                    className="w-full p-3 rounded-lg border border-slate-300 outline-none focus:border-emerald-500"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    disabled={foundUser.isBanned ?? false}
                                />
                             </div>
                             <button 
                                type="submit"
                                disabled={foundUser.isBanned ?? false}
                                className={`font-bold rounded-lg flex items-center justify-center gap-2 transition-colors
                                    ${foundUser.isBanned 
                                        ? 'bg-slate-300 cursor-not-allowed text-slate-500' 
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                             >
                                <Plus className="w-5 h-5" />
                                إيداع الرصيد
                             </button>
                        </div>
                    </form>

                    {/* Danger Zone */}
                    <div className="border-t border-slate-200 pt-6 mt-6">
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-red-500" />
                            إجراءات الحساب (منطقة الخطر)
                        </h4>
                        <div className="flex flex-wrap gap-4">
                            <button 
                                onClick={() => handleZeroBalance('USD')}
                                className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-bold text-sm flex items-center gap-2 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                تصفير رصيد الدولار ($)
                            </button>
                            <button 
                                onClick={() => handleZeroBalance('COINS')}
                                className="px-4 py-2 bg-white text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50 font-bold text-sm flex items-center gap-2 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                تصفير رصيد الكوينز (🪙)
                            </button>
                            <div className="w-px h-8 bg-slate-300 mx-2 hidden md:block self-center"></div>
                            <button 
                                onClick={handleBanToggle}
                                className={`px-4 py-2 rounded-lg text-white font-bold text-sm flex items-center gap-2 transition-colors
                                    ${foundUser.isBanned 
                                        ? 'bg-emerald-600 hover:bg-emerald-700' 
                                        : 'bg-slate-800 hover:bg-slate-900'}`}
                            >
                                {foundUser.isBanned ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        رفع الحظر عن الحساب
                                    </>
                                ) : (
                                    <>
                                        <Ban className="w-4 h-4" />
                                        حظر الحساب نهائياً
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Messages */}
            {message && (
                <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <UserCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminWallet;