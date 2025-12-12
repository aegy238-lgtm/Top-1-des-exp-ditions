import React, { useState } from 'react';
import { Eraser, AlertTriangle, ShieldAlert, CheckCircle2, Trash2, FileWarning } from 'lucide-react';
import { wipeAllCoinsGlobal, wipeAllOrdersGlobal } from '../services/storageService';

const AdminGlobalControl: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleGlobalWipeCoins = async () => {
    // Level 1 Warning
    if (!window.confirm("⛔ تحذير أمني عالي ⛔\n\nهل أنت متأكد من رغبتك في تصفير الكوينزات (Coins) لجميع المستخدمين في المنصة؟\n\nهذا الإجراء سيحذف جميع النقاط لجميع المستخدمين فوراً ولا يمكن التراجع عنه.")) {
        return;
    }

    // Level 2 Warning
    if (!window.confirm("⚠️ تأكيد نهائي وحاسم:\n\nبمجرد الضغط على 'موافق'، سيتم جعل رصيد الكوينز = 0 لكل الحسابات المسجلة.\n\nهل أنت متأكد تماماً؟")) {
        return;
    }

    setLoading(true);
    setFeedback(null);

    const result = await wipeAllCoinsGlobal();
    
    setLoading(false);
    if (result.success) {
        setFeedback({ type: 'success', text: result.message || 'تم تصفير جميع الكوينزات بنجاح.' });
    } else {
        setFeedback({ type: 'error', text: result.message || 'حدث خطأ أثناء التنفيذ.' });
    }
  };

  const handleGlobalWipeOrders = async () => {
    // Level 1 Warning
    if (!window.confirm("⛔ تحذير: حذف سجل الطلبات بالكامل ⛔\n\nهل أنت متأكد من رغبتك في حذف جميع الطلبات (Orders) من قاعدة البيانات؟\n\nسيتم حذف سجل الطلبات القديمة والجديدة لجميع المستخدمين.")) {
        return;
    }

    // Level 2 Warning
    if (!window.confirm("⚠️ تأكيد نهائي:\n\nلن يتمكن أي مستخدم أو مشرف من رؤية الطلبات السابقة بعد الآن.\n\nاضغط 'موافق' للتنفيذ.")) {
        return;
    }

    setLoading(true);
    setFeedback(null);

    const result = await wipeAllOrdersGlobal();
    
    setLoading(false);
    if (result.success) {
        setFeedback({ type: 'success', text: result.message || 'تم حذف جميع الطلبات بنجاح.' });
    } else {
        setFeedback({ type: 'error', text: result.message || 'حدث خطأ أثناء التنفيذ.' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
            
            {/* Header */}
            <div className="bg-red-600 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-800/30 rounded-lg">
                        <ShieldAlert className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">منطقة الخطر (إجراءات المالك)</h2>
                        <p className="text-red-100 text-sm">أدوات تحكم شاملة وحساسة بقاعدة البيانات</p>
                    </div>
                </div>
            </div>

            <div className="p-8 md:p-12">
                
                {feedback && (
                    <div className={`max-w-2xl mx-auto mb-10 p-4 rounded-xl flex items-center justify-center gap-3 font-bold shadow-sm ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {feedback.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                        {feedback.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* CARD 1: COINS WIPE */}
                    <div className="border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow bg-slate-50 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                            <Eraser className="w-10 h-10 text-yellow-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">تصفير الكوينز الشامل</h3>
                        <p className="text-slate-500 mb-6 text-sm leading-relaxed">
                            حذف جميع نقاط الكوينز من محافظ جميع المستخدمين دفعة واحدة. مفيد عند إعادة ضبط المواسم أو تغيير الأسعار.
                        </p>
                        <button 
                            onClick={handleGlobalWipeCoins}
                            disabled={loading}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 mt-auto
                                ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                        >
                            <Eraser className="w-5 h-5" />
                            تنفيذ تصفير الكوينز
                        </button>
                    </div>

                    {/* CARD 2: ORDERS WIPE */}
                    <div className="border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow bg-slate-50 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <Trash2 className="w-10 h-10 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">حذف جميع الطلبات</h3>
                        <p className="text-slate-500 mb-6 text-sm leading-relaxed">
                            حذف الأرشيف الكامل لطلبات الشحن (المعلقة، المكتملة، والملغية). سيتم تنظيف جداول البيانات بالكامل.
                        </p>
                        <button 
                            onClick={handleGlobalWipeOrders}
                            disabled={loading}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 mt-auto
                                ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                        >
                            <FileWarning className="w-5 h-5" />
                            تنفيذ حذف الطلبات
                        </button>
                    </div>

                </div>

            </div>
            
            <div className="bg-slate-50 p-4 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-400 font-mono">AUTHORIZED PERSONNEL ONLY • OWNER PERMISSION REQUIRED</p>
            </div>
        </div>
    </div>
  );
};

export default AdminGlobalControl;
