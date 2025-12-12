import React, { useState, useEffect } from 'react';
import { Settings, Save, Globe } from 'lucide-react';
import { getSiteConfig, saveSiteConfig } from '../services/storageService';
import { SiteConfig } from '../types';

const AdminGeneralSettings: React.FC = () => {
  const [config, setConfig] = useState<SiteConfig>({
      name: '',
      slogan: ''
  });

  useEffect(() => {
    setConfig(getSiteConfig());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSiteConfig(config);
    alert('تم تحديث إعدادات الموقع بنجاح! سيتم تطبيق التغييرات فوراً.');
    // Force simple refresh to see changes in Sidebar/Title
    window.location.reload();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
        <Settings className="w-6 h-6 text-slate-700" />
        <h3 className="text-lg font-bold text-slate-800">إعدادات الموقع العامة</h3>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400" />
                اسم المنصة / الموقع
            </label>
            <input 
                type="text" 
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-200 focus:border-slate-500 outline-none"
                placeholder="مثال: منصة حنين للشحن"
                value={config.name}
                onChange={(e) => setConfig({...config, name: e.target.value})}
                required
            />
            <p className="text-xs text-slate-400 mt-1">سيظهر هذا الاسم في القائمة الجانبية وصفحة الدخول</p>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">الوصف المختصر (Slogan)</label>
            <input 
                type="text" 
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-200 focus:border-slate-500 outline-none"
                placeholder="مثال: خدمات شحن الألعاب الفورية"
                value={config.slogan || ''}
                onChange={(e) => setConfig({...config, slogan: e.target.value})}
            />
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

export default AdminGeneralSettings;
