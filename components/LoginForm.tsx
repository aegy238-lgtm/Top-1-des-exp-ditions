import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface LoginFormProps {
  onLogin: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'zxc1234zxc') {
      onLogin();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[500px]">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full text-center animate-fade-in">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">منطقة محمية</h2>
        <p className="text-slate-500 mb-8 text-sm">يرجى إدخال كلمة المرور للوصول إلى لوحة التحكم</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
             <input 
              type="password" 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="كلمة المرور"
              className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none text-center transition-all font-sans
                ${error 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50' 
                  : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200 bg-slate-50 focus:bg-white'
                }`}
              autoFocus
            />
          </div>
         
          {error && (
            <p className="text-red-500 text-sm font-medium animate-pulse">
              كلمة المرور غير صحيحة
            </p>
          )}

          <button 
            type="submit"
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            تسجيل الدخول
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;