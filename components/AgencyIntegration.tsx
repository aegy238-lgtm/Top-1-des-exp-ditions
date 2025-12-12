import React, { useState, useEffect } from 'react';
import { Link2, CheckCircle2, XCircle, RefreshCw, ShieldCheck, Server } from 'lucide-react';
import { getAgencyConfig, saveAgencyConfig } from '../services/storageService';
import { AgencyConfig } from '../types';

const AgencyIntegration: React.FC = () => {
  const [config, setConfig] = useState<AgencyConfig>({
    agencyUrl: '',
    apiKey: '',
    isConnected: false,
    lastSync: null
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    setConfig(getAgencyConfig());
  }, []);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Simulate API Connection
    setTimeout(() => {
      if (config.agencyUrl.includes('.') && config.agencyUrl.length > 5) {
        const newConfig = {
          ...config,
          isConnected: true,
          lastSync: Date.now()
        };
        setConfig(newConfig);
        saveAgencyConfig(newConfig);
        setMessage({ type: 'success', text: 'تم الاتصال بالوكالة بنجاح! الشحن التلقائي مفعل الآن.' });
      } else {
        setMessage({ type: 'error', text: 'فشل الاتصال: يرجى التحقق من الرابط وصلاحية المفتاح.' });
        setConfig(prev => ({...prev, isConnected: false}));
      }
      setLoading(false);
    }, 1500);
  };

  const handleDisconnect = () => {
    if (window.confirm('هل أنت متأكد من إلغاء الربط؟ سيتوقف الشحن التلقائي.')) {
        const newConfig = {
            ...config,
            isConnected: false,
            lastSync: null
        };
        setConfig(newConfig);
        saveAgencyConfig(newConfig);
        setMessage({ type: 'success', text: 'تم إلغاء الربط بنجاح.' });
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/20 rounded-lg backdrop-blur-sm border border-emerald-500/30">
              <Link2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold">ربط وكالة الشحن (API)</h2>
          </div>
          <p className="text-slate-300 max-w-2xl leading-relaxed">
            قم بربط منصة Top1 مع وكالة الشحن المعتمدة لتفعيل نظام الشحن التلقائي. عند تفعيل هذه الخاصية، سيتم تنفيذ الطلبات مباشرة دون تدخل يدوي.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-16 -mb-16"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Server className="w-5 h-5 text-slate-500" />
              إعدادات الاتصال
            </h3>

            <form onSubmit={handleConnect} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  رابط الوكالة (Agency Endpoint URL)
                </label>
                <input
                  type="url"
                  placeholder="https://api.agency.com/v1/integrate"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none transition-all font-mono text-sm bg-slate-50"
                  value={config.agencyUrl}
                  onChange={(e) => setConfig({...config, agencyUrl: e.target.value})}
                  disabled={config.isConnected || loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  مفتاح الربط (API Key / Token)
                </label>
                <input
                  type="password"
                  placeholder="sk_live_xxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none transition-all font-mono text-sm bg-slate-50"
                  value={config.apiKey}
                  onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                  disabled={config.isConnected || loading}
                />
              </div>

              {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  {message.text}
                </div>
              )}

              <div className="pt-4 flex items-center gap-4">
                {!config.isConnected ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 py-3 px-6 rounded-lg text-white font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2
                      ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02]'}`}
                  >
                    {loading ? (
                        <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            جاري الاتصال...
                        </>
                    ) : (
                        <>
                            <Link2 className="w-5 h-5" />
                            تفعيل الدمج
                        </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="flex-1 py-3 px-6 rounded-lg bg-red-50 text-red-600 font-bold border border-red-200 hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    إلغاء الربط
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Status Panel */}
        <div className="space-y-6">
          <div className={`rounded-xl p-6 border shadow-sm transition-all ${config.isConnected ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
            <h3 className="text-lg font-bold text-slate-800 mb-4">حالة النظام</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">حالة الاتصال</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${config.isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                  <span className={`w-2 h-2 rounded-full ${config.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  {config.isConnected ? 'متصل بنجاح' : 'غير متصل'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">الشحن التلقائي</span>
                <span className={`text-sm font-bold ${config.isConnected ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {config.isConnected ? 'مفعل (Active)' : 'معطل'}
                </span>
              </div>

              {config.lastSync && (
                <div className="flex items-center justify-between border-t border-slate-200/50 pt-3">
                  <span className="text-slate-500 text-xs">آخر مزامنة</span>
                  <span className="text-slate-700 text-xs font-mono">
                    {new Date(config.lastSync).toLocaleTimeString('ar-EG')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
             <div className="flex items-start gap-3">
               <ShieldCheck className="w-6 h-6 text-blue-600 mt-0.5" />
               <div>
                 <h4 className="font-bold text-blue-800 text-sm">معلومات الأمان</h4>
                 <p className="text-blue-600 text-xs mt-1 leading-relaxed">
                   يتم تشفير مفاتيح API وحفظها محلياً في متصفحك. لا يتم مشاركة بيانات الدمج مع أي طرف ثالث.
                 </p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyIntegration;