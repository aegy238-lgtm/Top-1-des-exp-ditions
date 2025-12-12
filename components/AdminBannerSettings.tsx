import React, { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, LayoutTemplate, Image, Type, UploadCloud, X } from 'lucide-react';
import { getBannerConfig, saveBannerConfig } from '../services/storageService';
import { BannerConfig, BannerStyle } from '../types';

const AdminBannerSettings: React.FC = () => {
  const [config, setConfig] = useState<BannerConfig>({
      isVisible: true,
      showText: true,
      title: '',
      message: '',
      style: 'promo',
      iconUrl: '',
      backgroundUrl: ''
  });

  useEffect(() => {
    const savedConfig = getBannerConfig();
    setConfig({
        isVisible: true,
        showText: true,
        backgroundUrl: '',
        iconUrl: '',
        ...savedConfig
    });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveBannerConfig(config);
    alert('تم تحديث البانر بنجاح!');
  };

  // Handle Image Upload (Convert to Base64)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          // Check file size (Limit to ~500KB to prevent localStorage quota exceeded)
          if (file.size > 800000) { // ~800KB
              alert('حجم الصورة كبير جداً. يرجى استخدام صورة أقل من 800 كيلوبايت لضمان سرعة التطبيق.');
              return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result as string;
              setConfig({ ...config, backgroundUrl: base64String });
          };
          reader.readAsDataURL(file);
      }
  };

  const removeImage = () => {
      setConfig({ ...config, backgroundUrl: '' });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
        <LayoutTemplate className="w-6 h-6 text-purple-600" />
        <h3 className="text-lg font-bold text-slate-800">إعدادات البانر الإعلاني (Hero Banner)</h3>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Toggle Visibility */}
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-700">حالة البانر (تشغيل/إيقاف)</span>
            <button
                type="button"
                onClick={() => setConfig({...config, isVisible: !config.isVisible})}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${config.isVisible ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}
            >
                {config.isVisible ? (
                    <> <Eye className="w-4 h-4" /> ظاهر للعملاء </>
                ) : (
                    <> <EyeOff className="w-4 h-4" /> مخفي </>
                )}
            </button>
        </div>

        {/* Image Upload Section */}
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
            {config.backgroundUrl ? (
                <div className="relative group">
                    <img 
                        src={config.backgroundUrl} 
                        alt="Banner Preview" 
                        className="w-full h-32 object-cover rounded-lg shadow-md"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <button
                            type="button"
                            onClick={removeImage}
                            className="bg-red-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-red-700"
                        >
                            <X className="w-4 h-4" />
                            حذف الصورة
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-full mb-3">
                            <UploadCloud className="w-8 h-8" />
                        </div>
                        <h4 className="font-bold text-slate-700 mb-1">اضغط هنا لرفع صورة البانر</h4>
                        <p className="text-xs text-slate-500">يدعم JPG, PNG. المقاس المفضل: 1200x300 بكسل.</p>
                    </div>
                </>
            )}
        </div>

        {/* Text Visibility Toggle */}
        <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-lg">
             <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-700">إظهار النصوص فوق الصورة؟</span>
             </div>
             <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setConfig({...config, showText: true})}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${config.showText ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                    نعم (إظهار)
                </button>
                <button
                    type="button"
                    onClick={() => setConfig({...config, showText: false})}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!config.showText ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                    لا (صورة فقط)
                </button>
             </div>
        </div>

        {/* Content Section - Only enabled if showText is true */}
        <div className={`space-y-4 transition-all ${!config.showText ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
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
            
            {/* Style Selector (Fallback) */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">لون الخلفية (في حال عدم وجود صورة)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { id: 'promo', label: 'بنفسجي', color: 'bg-purple-600' },
                        { id: 'info', label: 'أزرق', color: 'bg-blue-600' },
                        { id: 'warning', label: 'برتقالي', color: 'bg-amber-500' },
                        { id: 'alert', label: 'أحمر', color: 'bg-red-600' }
                    ].map((style) => (
                        <div 
                            key={style.id}
                            onClick={() => setConfig({...config, style: style.id as BannerStyle})}
                            className={`cursor-pointer p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-all
                                ${config.style === style.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}
                        >
                            <div className={`w-full h-4 rounded ${style.color}`}></div>
                            <span className="text-[10px] font-bold text-slate-600">{style.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Icon URL */}
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Image className="w-4 h-4 text-slate-400" />
                    رابط أيقونة صغيرة (اختياري)
                </label>
                <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none text-left"
                    placeholder="أيقونة تظهر بجانب النص"
                    value={config.iconUrl || ''}
                    onChange={(e) => setConfig({...config, iconUrl: e.target.value})}
                    dir="ltr"
                />
            </div>
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