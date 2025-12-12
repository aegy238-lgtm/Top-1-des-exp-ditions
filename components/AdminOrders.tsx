import React, { useState, useEffect } from 'react';
import { getOrders, updateOrder } from '../services/storageService';
import { Order, OrderStatus, PaymentMethod } from '../types';
import { CheckCircle2, MessageSquare, User, Clock, Search, Wallet, Coins } from 'lucide-react';

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const refreshOrders = () => {
    // Filter mainly for Pending Wallet orders or all orders
    const allOrders = getOrders();
    setOrders(allOrders);
  };

  useEffect(() => {
    refreshOrders();
    const interval = setInterval(refreshOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirmOrder = () => {
    if (!selectedOrder) return;

    const message = adminMessage || 'تم تنفيذ طلبك بنجاح!';
    
    updateOrder(selectedOrder.id, {
        status: OrderStatus.COMPLETED,
        adminMessage: message,
        isRead: false
    });

    alert('تم تأكيد الطلب وإرسال الرسالة للمستخدم');
    setSelectedOrder(null);
    setAdminMessage('');
    refreshOrders();
  };

  const filteredOrders = orders.filter(o => 
    (o.username.includes(searchTerm) || o.userId.includes(searchTerm)) &&
    o.status === OrderStatus.PENDING &&
    o.paymentMethod === PaymentMethod.WALLET
  );

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">طلبات الشحن المعلقة</h2>
                    <p className="text-slate-400 text-sm">مراجعة طلبات المحفظة وإرسال التأكيدات</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
            {/* List of Orders */}
            <div className="lg:col-span-1 border-l border-slate-200 h-[600px] flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                        <input 
                            type="text" 
                            placeholder="بحث باسم المستخدم أو الآيدي"
                            className="w-full pr-9 pl-4 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 outline-none text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredOrders.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            لا توجد طلبات معلقة حالياً
                        </div>
                    ) : (
                        filteredOrders.map(order => (
                            <div 
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors
                                    ${selectedOrder?.id === order.id ? 'bg-emerald-50 border-emerald-200' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-slate-800 text-sm">{order.username}</span>
                                    <span className="text-xs text-slate-400">{new Date(order.date).toLocaleTimeString('ar-EG')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                     <div className="flex items-center gap-1 text-xs text-slate-500">
                                        <Wallet className="w-3 h-3" />
                                        <span>{order.paymentMethod === PaymentMethod.WALLET ? 'محفظة' : 'وكيل'}</span>
                                     </div>
                                     <div className="text-right">
                                        <span className="block font-bold text-emerald-600 text-sm">{order.amount} $</span>
                                        {order.coinAmount !== undefined && (
                                            <span className="text-[10px] text-yellow-600 font-medium block">
                                                {order.coinAmount.toLocaleString()} C
                                            </span>
                                        )}
                                     </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Details & Action */}
            <div className="lg:col-span-2 p-6 bg-slate-50">
                {selectedOrder ? (
                    <div className="h-full flex flex-col">
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">تفاصيل الطلب #{selectedOrder.id}</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="block text-slate-500 mb-1">اسم المستخدم</span>
                                    <span className="font-bold text-slate-800">{selectedOrder.username}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-500 mb-1">الرقم التسلسلي (ID)</span>
                                    <span className="font-bold text-slate-800 font-mono">{selectedOrder.userId}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-500 mb-1">التطبيق</span>
                                    <span className="font-bold text-slate-800">{selectedOrder.appName}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-500 mb-1">المبلغ المخصوم</span>
                                    <span className="font-bold text-red-600">{selectedOrder.amount} {selectedOrder.currency}</span>
                                </div>
                                {selectedOrder.coinAmount !== undefined && (
                                    <div className="col-span-2 bg-yellow-50 p-2 rounded border border-yellow-100 flex items-center gap-2 mt-2">
                                        <Coins className="w-5 h-5 text-yellow-600" />
                                        <span className="text-slate-700 font-medium">الكمية المطلوبة للشحن: </span>
                                        <span className="font-bold text-yellow-700 text-lg">{selectedOrder.coinAmount.toLocaleString()} كوينز</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                هذا الطلب مدفوع مسبقاً من المحفظة. يرجى الشحن للعميل ثم تأكيد الطلب.
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex-1">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">الرد على الطلب</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">رسالة التأكيد (ستظهر للمستخدم في الإشعارات)</label>
                                <textarea 
                                    className="w-full p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-200 outline-none h-32"
                                    placeholder="مثال: تم شحن حسابك بنجاح! شكراً لاستخدامك منصة حنين."
                                    value={adminMessage}
                                    onChange={(e) => setAdminMessage(e.target.value)}
                                ></textarea>
                            </div>
                            <button 
                                onClick={handleConfirmOrder}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                تأكيد التنفيذ وإرسال الرسالة
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                        <p>اختر طلباً من القائمة لعرض التفاصيل والرد عليه</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;