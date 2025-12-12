import React, { useState, useEffect } from 'react';
import { Megaphone, Save, Eye, EyeOff, LayoutTemplate, Image } from 'lucide-react';
import { getBannerConfig, saveBannerConfig } from '../services/storageService';
import { BannerConfig, BannerStyle } from '../types';

const AdminBannerSettings: React.FC = () => {
  const [config, setConfig] = useState<BannerConfig>({
      isVisible: true,
      title: '',
      message: '',
      style: 'promo',
      iconUrl: ''
  });

  useEffect(() => {
    setConfig(getBannerConfig());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveBannerConfig(config);
    alert('تم تحديث البانر بنجاح!');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
        <LayoutTemplate className="w-6 h-6 text-purple-600" />
        <h3 className="text-lg font-bold text-slate-800">إعدادات البانر الإعلاني (Hero Banner)</h3>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        
        {/* Toggle Visibility */}
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-700">حالة البانر</span>
            <button
                type="button"
                onClick={() => setConfig({...config, isVisible: !config.isVisible})}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${config.isVisible ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}
            >
                {config.isVisible ? (
                    <> <Eye className="w-4 h-4" /> مفعل (ظاهر للعملاء) </>
                ) : (
                    <> <EyeOff className="w-4 h-4" /> معطل (مخفي) </>
                )}
            </button>
        </div>

        {/* Style Selector */}
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">نوع البانر (اللون والتصميم)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { id: 'promo', label: 'عرض خاص (بنفسجي)', color: 'bg-purple-600' },
                    { id: 'info', label: 'معلومة (أزرق)', color: 'bg-blue-600' },
                    { id: 'warning', label: 'تنبيه (برتقالي)', color: 'bg-amber-500' },
                    { id: 'alert', label: 'خطر/هام (أحمر)', color: 'bg-red-600' }
                ].map((style) => (
                    <div 
                        key={style.id}
                        onClick={() => setConfig({...config, style: style.id as BannerStyle})}
                        className={`cursor-pointer p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all
                            ${config.style === style.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                        <div className={`w-full h-8 rounded ${style.color}`}></div>
                        <span className="text-xs font-bold text-slate-600">{style.label}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Custom Icon/Image */}
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Image className="w-4 h-4 text-slate-400" />
                رابط صورة/أيقونة مخصصة (اختياري)
            </label>
            <input 
                type="text" 
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none text-left"
                placeholder="https://example.com/my-icon.png"
                value={config.iconUrl || ''}
                onChange={(e) => setConfig({...config, iconUrl: e.target.value})}
                dir="ltr"
            />
            <p className="text-xs text-slate-400 mt-1">سيتم استبدال أيقونة الميكروفون/التنبيه الافتراضية بهذه الصورة في حال توفر الرابط.</p>
        </div>

        {/* Content */}
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">العنوان الرئيسي</label>
            <input 
                type="text" 
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none"
                placeholder="مثال: خصومات الجمعة البيضاء!"
                value={config.title}
                onChange={(e) => setConfig({...config, title: e.target.value})}
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">نص الرسالة</label>
            <textarea 
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none h-24"
                placeholder="اكتب تفاصيل الإعلان هنا..."
                value={config.message}
                onChange={(e) => setConfig({...config, message: e.target.value})}
            />
        </div>

        <button 
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
        >
            <Save className="w-5 h-5" />
            حفظ إعدادات البانر
        </button>
      </form>
    </div>
  );
};

export default AdminBannerSettings;
