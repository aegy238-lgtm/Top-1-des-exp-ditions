import React from 'react';
import { Users, ShoppingCart, Activity } from 'lucide-react';
import { DashboardStats } from '../types';

interface StatsCardsProps {
  stats: DashboardStats;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Visitors Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between transition-transform hover:-translate-y-1">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">عدد الزوار</p>
          <h3 className="text-2xl font-bold text-slate-800">{stats.visitors.toLocaleString()}</h3>
        </div>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* Orders Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between transition-transform hover:-translate-y-1">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">إجمالي الطلبات</p>
          <h3 className="text-2xl font-bold text-slate-800">{stats.totalOrders.toLocaleString()}</h3>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
          <ShoppingCart className="w-6 h-6" />
        </div>
      </div>

      {/* Active Tracking Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between transition-transform hover:-translate-y-1">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">حالة النظام</p>
          <h3 className="text-2xl font-bold text-slate-800">نشط الآن</h3>
        </div>
        <div className="p-3 bg-purple-50 text-purple-600 rounded-full animate-pulse">
          <Activity className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatsCards;