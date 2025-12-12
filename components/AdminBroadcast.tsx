import React, { useState } from 'react';
import { Megaphone, Send, Users, BellRing, CheckCircle2, Trash2 } from 'lucide-react';
import { sendBroadcastNotification, getUsers, wipeAllNotificationsGlobal } from '../services/storageService';

const AdminBroadcast: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const usersCount = getUsers().filter(u => !u.isAdmin).length;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    
    if (window.confirm(`⚠️ تأكيد الإرسال:\nهل أنت متأكد من إرسال هذا الإشعار لجميع المستخدمين (${usersCount} مستخدم)؟`)) {
        setLoading(true);
        setFeedback(null);
        
        // Simulate network delay for UX
        setTimeout(async () => {
            const result = await sendBroadcastNotification(title, message);
            if (result.success) {
                setFeedback({ type: 'success', text: result.message || 'تم الإرسال بنجاح' });
                setTitle('');
                setMessage('');
            } else {
                setFeedback({ type: 'error', text: result.message || 'فشل الإرسال' });
            }
            setLoading(false);
        }, 1000);
    }
  };

  const handleWipeNotifications = async () => {
      if (window.confirm(`🔥 حذف سجل الإشعارات:\n\nهل أنت متأكد من حذف جميع الإشعارات السابقة من حسابات كل المستخدمين؟\n\nلن يرى أي مستخدم الإشعارات القديمة بعد الآن.`)) {
          setLoading(true);
          const result = await wipeAllNotificationsGlobal();
          setLoading(false);
          if (result.success) {
              setFeedback({ type: 'success', text: result.message || 'تم حذف السجل بنجاح' });
          } else {
              setFeedback({ type: 'error', text: result.message || 'فشل الحذف' });
          }
      }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Header */}
            <div className="bg-slate-900 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500 rounded-lg">
                        <Megaphone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">إرسال إشعارات جماعية</h2>
                        <p className="text-slate-400 text-sm">إرسال تنبيهات أو أخبار لجميع المستخدمين دفعة واحدة</p>
                    </div>
                </div>
                
                {/* Delete Button Header */}
                <button 
                    onClick={handleWipeNotifications}
                    title="حذف جميع الإشعارات القديمة من النظام"
                    className="bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold border border-red-800"
                >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">حذف أرشيف الإشعارات</span>
                </button>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Form Section */}
                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleSend} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">عنوان الإشعار</label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none transition-all"
                                placeholder="مثال: خصومات الجمعة البيضاء 💥"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">نص الرسالة</label>
                            <textarea 
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none h-40 resize-none transition-all"
                                placeholder="اكتب تفاصيل الإشعار هنا..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                            />
                        </div>

                        {feedback && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 font-medium animate-pulse ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <BellRing className="w-5 h-5" />}
                                {feedback.text}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-3
                                ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700 hover:scale-[1.02]'}`}
                        >
                            {loading ? 'جاري التنفيذ...' : (
                                <>
                                    <Send className="w-5 h-5" />
                                    إرسال للكل ({usersCount})
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Preview Section */}
                <div className="md:col-span-1">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">معاينة المستلمين</h3>
                        
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                                <Users className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                                <span className="block text-2xl font-bold text-slate-800">{usersCount}</span>
                                <span className="text-xs text-slate-500">مستخدم نشط سيستلم الرسالة</span>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                            <div className="absolute -top-2 right-4 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">معاينة</div>
                            <h4 className="font-bold text-slate-800 text-sm mb-1">{title || 'عنوان الإشعار'}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-4">
                                {message || 'هنا سيظهر نص الرسالة كما سيراها المستخدم في قائمة الإشعارات الخاصة به...'}
                            </p>
                        </div>

                        <div className="mt-6 text-xs text-slate-400 leading-relaxed text-center space-y-2">
                            <p>⚠️ تنبيه: عند الضغط على إرسال، سيتم إنشاء إشعار في حساب كل مستخدم فوراً.</p>
                            <p className="text-red-400">🔥 زر الحذف في الأعلى يقوم بمسح جميع الإشعارات السابقة لجميع المستخدمين.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

export default AdminBroadcast;
