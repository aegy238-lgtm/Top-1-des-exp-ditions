import React, { useState, useEffect } from 'react';
import { getOrders, getCurrentUser } from '../services/storageService';
import { Order, OrderStatus } from '../types';
import { Clock, CheckCircle2, XCircle, AlertCircle, FileText, MessageCircle } from 'lucide-react';

const UserHistory: React.FC = () => {
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      const allOrders = getOrders();
      // Filter orders for this specific user
      const filtered = allOrders.filter(o => o.userId === user.serialId);
      // Sort by newest first
      setMyOrders(filtered.sort((a, b) => b.timestamp - a.timestamp));
    }
  }, []);

  if (!currentUser) {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <p>يرجى تسجيل الدخول لعرض السجل</p>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-lg">
             <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">سجل عمليات الشحن</h2>
            <p className="text-slate-400 text-sm">أرشيف كامل لطلباتك ورسائل التأكيد من الإدارة</p>
          </div>
        </div>

        <div className="p-6">
            {myOrders.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">لا يوجد سجلات</h3>
                    <p className="text-slate-500 mt-1">لم تقم بأي عمليات شحن حتى الآن.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {myOrders.map((order) => (
                        <div key={order.id} className="border border-slate-200 rounded-xl p-5 hover:border-emerald-200 transition-all bg-slate-50/50">
                            
                            {/* Order Summary Row */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full 
                                        ${order.status === OrderStatus.COMPLETED || order.status === OrderStatus.AUTO_COMPLETED ? 'bg-green-100 text-green-600' : 
                                          order.status === OrderStatus.PENDING ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                                        {order.status === OrderStatus.COMPLETED || order.status === OrderStatus.AUTO_COMPLETED ? <CheckCircle2 className="w-6 h-6" /> :
                                         order.status === OrderStatus.PENDING ? <Clock className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{order.appName}</h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <span>{new Date(order.date).toLocaleDateString('ar-EG')}</span>
                                            <span>•</span>
                                            <span className="font-mono" dir="ltr">{new Date(order.date).toLocaleTimeString('ar-EG')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-left md:text-right">
                                    <span className="block text-2xl font-bold text-emerald-600">{order.amount} <span className="text-sm text-slate-500 font-normal">{order.currency}</span></span>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1
                                        ${order.status === OrderStatus.COMPLETED || order.status === OrderStatus.AUTO_COMPLETED ? 'bg-green-100 text-green-700' : 
                                          order.status === OrderStatus.PENDING ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-slate-200 pt-4 bg-white p-3 rounded-lg">
                                <div>
                                    <span className="block text-slate-400 text-xs mb-1">اسم الحساب</span>
                                    <span className="font-bold text-slate-700">{order.username}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 text-xs mb-1">الآيدي (ID)</span>
                                    <span className="font-mono font-bold text-slate-700">{order.userId}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 text-xs mb-1">طريقة الدفع</span>
                                    <span className="font-bold text-slate-700">
                                        {order.paymentMethod === 'WALLET' ? 'رصيد المحفظة' : 'عبر الوكيل'}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 text-xs mb-1">رقم الطلب</span>
                                    <span className="font-mono font-bold text-slate-700">#{order.id}</span>
                                </div>
                            </div>

                            {/* Admin Message Section - Only shows if completed and has message */}
                            {order.adminMessage && (
                                <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex gap-3 animate-fade-in">
                                    <MessageCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-emerald-800 mb-1">رسالة من الإدارة:</h4>
                                        <p className="text-emerald-700 text-sm leading-relaxed">
                                            {order.adminMessage}
                                        </p>
                                    </div>
                                </div>
                            )}

                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default UserHistory;