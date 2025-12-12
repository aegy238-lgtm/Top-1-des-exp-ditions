import React, { useState, useEffect } from 'react';
import { MessageCircle, Save, Smartphone, Type } from 'lucide-react';
import { getContactConfig, saveContactConfig } from '../services/storageService';
import { ContactConfig } from '../types';

const AdminContactSettings: React.FC = () => {
  const [config, setConfig] = useState<ContactConfig>({
      primaryPhone: '',
      buttonLabel: 'إرسال الطلب للوكيل (واتساب)',
      secondaryPhone: '',
      tertiaryPhone: ''
  });

  useEffect(() => {
    setConfig(getContactConfig());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveContactConfig(config);
    alert('تم تحديث إعدادات التواصل بنجاح! سيظهر التعديل فوراً للمستخدمين.');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
        <MessageCircle className="w-6 h-6 text-green-600" />
        <h3 className="text-lg font-bold text-slate-800">إعدادات التواصل (واتساب)</h3>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Main Settings */}
        <div className="space-y-4">
            <h4 className="font-bold text-slate-700 text-sm border-r-4 border-emerald-500 pr-2">الإعدادات الأساسية</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-slate-400" />
                        رقم الواتساب الرئيسي
                    </label>
                    <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none dir-ltr"
                        placeholder="2010xxxxxxxx"
                        value={config.primaryPhone}
                        onChange={(e) => setConfig({...config, primaryPhone: e.target.value})}
                        dir="ltr"
                        required
                    />
                    <p className="text-xs text-slate-400 mt-1">يجب إدخال الرقم مع كود الدولة وبدون علامة +</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <Type className="w-4 h-4 text-slate-400" />
                        اسم الزر (يظهر للمستخدم)
                    </label>
                    <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none"
                        placeholder="مثال: إرسال الطلب للوكيل (واتساب)"
                        value={config.buttonLabel}
                        onChange={(e) => setConfig({...config, buttonLabel: e.target.value})}
                        required
                    />
                </div>
            </div>
        </div>

        {/* Extra Numbers */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
             <h4 className="font-bold text-slate-700 text-sm border-r-4 border-blue-500 pr-2">أرقام وكلاء إضافية (اختياري)</h4>
             <p className="text-xs text-slate-500">إذا قمت بإضافة أرقام هنا، ستظهر أزرار إضافية للمستخدم للتواصل مع وكلاء آخرين.</p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">رقم الواتساب الإضافي 1</label>
                    <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none dir-ltr"
                        placeholder="رقم اختياري"
                        value={config.secondaryPhone}
                        onChange={(e) => setConfig({...config, secondaryPhone: e.target.value})}
                        dir="ltr"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">رقم الواتساب الإضافي 2</label>
                    <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none dir-ltr"
                        placeholder="رقم اختياري"
                        value={config.tertiaryPhone}
                        onChange={(e) => setConfig({...config, tertiaryPhone: e.target.value})}
                        dir="ltr"
                    />
                </div>
             </div>
        </div>

        <button 
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
        >
            <Save className="w-5 h-5" />
            حفظ التغييرات
        </button>
      </form>
    </div>
  );
};

export default AdminContactSettings;