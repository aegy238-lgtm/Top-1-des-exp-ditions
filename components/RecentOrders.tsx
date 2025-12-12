import React from 'react';
import { Order, OrderStatus } from '../types';

interface RecentOrdersProps {
  orders: Order[];
}

const RecentOrders: React.FC<RecentOrdersProps> = ({ orders }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-800">أحدث الطلبات</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-sm">
            <tr>
              <th className="px-6 py-3 font-medium">اسم المستخدم</th>
              <th className="px-6 py-3 font-medium">الآيدي (ID)</th>
              <th className="px-6 py-3 font-medium">التطبيق</th>
              <th className="px-6 py-3 font-medium">المبلغ</th>
              <th className="px-6 py-3 font-medium">الحالة</th>
              <th className="px-6 py-3 font-medium">التاريخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  لا توجد طلبات حتى الآن
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-700 font-medium">{order.username}</td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-sm">{order.userId}</td>
                  <td className="px-6 py-4 text-slate-600">{order.appName}</td>
                  <td className="px-6 py-4 text-slate-800 font-bold">
                    {order.amount} <span className="text-xs text-slate-500 font-normal">{order.currency}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-800' : 
                        order.status === OrderStatus.PENDING ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {new Date(order.date).toLocaleDateString('ar-EG')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrders;