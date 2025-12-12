import React, { useState, useEffect } from 'react';
import { User, Save, AlertCircle, CheckCircle2, CreditCard, Lock } from 'lucide-react';
import { getCurrentUser, updateUserProfile } from '../services/storageService';
import { User as UserType } from '../types';

const UserProfile: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    serialId: ''
  });
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
        setUser(currentUser);
        setFormData({
            username: currentUser.username,
            serialId: currentUser.serialId
        });
    }
  }, []);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setMessage(null);

    if (!formData.username) {
        setMessage({ type: 'error', text: 'يرجى إدخال اسم المستخدم' });
        return;
    }

    // Call service with just username (ID is no longer passed for update)
    const result = updateUserProfile(user.id, formData.username);
    
    if (result.success) {
        setMessage({ type: 'success', text: result.message || 'تم تحديث البيانات بنجاح' });
        // Refresh local user state
        const updated = getCurrentUser();
        if (updated) setUser(updated);
    } else {
        setMessage({ type: 'error', text: result.message || 'حدث خطأ' });
    }
  };

  if (!user) return <div className="p-8 text-center">يرجى تسجيل الدخول</div>;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-8 text-center">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl font-bold shadow-lg shadow-emerald-500/30">
                    {user.username.charAt(0)}
                </div>
                <h2 className="text-2xl font-bold text-white">{user.username}</h2>
                <p className="text-emerald-400 font-mono mt-1">ID: {user.serialId}</p>
            </div>

            <div className="p-8">
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">اسم المستخدم</label>
                        <div className="relative">
                            <User className="w-5 h-5 text-slate-400 absolute right-3 top-3" />
                            <input 
                                type="text" 
                                className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                placeholder="اكتب اسمك الجديد"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                            الرقم التسلسلي (ID)
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                غير قابل للتغيير
                            </span>
                        </label>
                        <div className="relative">
                            <CreditCard className="w-5 h-5 text-slate-400 absolute right-3 top-3" />
                            <input 
                                type="text" 
                                className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed outline-none font-mono"
                                value={formData.serialId}
                                disabled
                                readOnly
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {message.text}
                        </div>
                    )}

                    <button 
                        type="submit"
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        حفظ التغييرات
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};

export default UserProfile;