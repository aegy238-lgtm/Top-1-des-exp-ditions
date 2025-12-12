import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, UserPlus, LogIn, ArrowRight } from 'lucide-react';
import { loginUser, registerUser, getSiteConfig } from '../services/storageService';

interface UserAuthProps {
  onSuccess: () => void;
}

const UserAuth: React.FC<UserAuthProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [siteName, setSiteName] = useState('منصة حنين');

  useEffect(() => {
    const config = getSiteConfig();
    setSiteName(config.name);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const result = loginUser(formData.email, formData.password);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Error logging in');
      }
    } else {
      if (!formData.username) {
        setError('يرجى إدخال اسم المستخدم');
        return;
      }
      const result = registerUser(formData.email, formData.password, formData.username);
      if (result.success) {
        alert(`تم إنشاء الحساب بنجاح! رقمك التسلسلي هو: ${result.user?.serialId}`);
        onSuccess();
      } else {
        setError(result.message || 'Error registering');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isLogin ? `أهلاً بك مجدداً في ${siteName}` : 'انضم إلينا واحصل على رقم تسلسلي خاص'}
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">اسم المستخدم</label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    required={!isLogin}
                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    placeholder="الاسم الكامل"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute right-3 top-3" />
                <input
                  type="email"
                  required
                  className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">كلمة المرور</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute right-3 top-3" />
                <input
                  type="password"
                  required
                  className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  placeholder="********"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
            >
              {isLogin ? (
                <>
                  <LogIn className="w-5 h-5" />
                  دخول
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  إنشاء الحساب
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-slate-600 hover:text-emerald-600 text-sm font-medium flex items-center justify-center gap-1 mx-auto transition-colors"
            >
              {isLogin ? 'ليس لديك حساب؟ إنشاء حساب جديد' : 'لديك حساب بالفعل؟ تسجيل الدخول'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAuth;
