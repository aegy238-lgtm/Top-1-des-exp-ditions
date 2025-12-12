import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Check, Lock, Mail, Trash2, Ban, CheckCircle2 } from 'lucide-react';
import { getUsers, createSubAdmin, updateUserPermissions, toggleUserBan, getCurrentUser } from '../services/storageService';
import { User, AdminPermissions } from '../types';

const AdminTeamManagement: React.FC = () => {
  const [admins, setAdmins] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    permissions: {
        canManageOrders: true,
        canManageWallet: false,
        canManageSettings: false,
        canManageTeam: false
    } as AdminPermissions
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshAdmins();
  }, []);

  const refreshAdmins = () => {
    const allUsers = getUsers();
    const adminUsers = allUsers.filter(u => u.isAdmin);
    setAdmins(adminUsers);
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.username) return;
    setLoading(true);

    const result = createSubAdmin(formData.email, formData.password, formData.username, formData.permissions);
    
    if (result.success) {
        alert('تم إضافة المشرف الجديد بنجاح');
        setFormData({
            username: '',
            email: '',
            password: '',
            permissions: { canManageOrders: true, canManageWallet: false, canManageSettings: false, canManageTeam: false }
        });
        refreshAdmins();
    } else {
        alert(result.message || 'حدث خطأ');
    }
    setLoading(false);
  };

  const handlePermissionChange = (userId: string, key: keyof AdminPermissions) => {
    const admin = admins.find(a => a.id === userId);
    if (!admin || !admin.permissions) return;

    const newPermissions = { ...admin.permissions, [key]: !admin.permissions[key] };
    updateUserPermissions(userId, newPermissions);
    refreshAdmins();
  };

  const handleBan = (serialId: string) => {
      const result = toggleUserBan(serialId);
      if (result.success) {
          refreshAdmins();
      } else {
          alert(result.message || 'فشل الإجراء');
      }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
       {/* Header */}
       <div className="bg-slate-900 p-6 rounded-t-2xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                    <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">إدارة فريق العمل</h2>
                    <p className="text-slate-400 text-sm">إضافة مشرفين، تعيين الصلاحيات، وحماية الحساب الرئيسي</p>
                </div>
            </div>
            <div className="bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/50 text-indigo-200 text-xs font-mono">
                Super Admin Access Only
            </div>
       </div>

       <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-slate-200 p-6">
            
            {/* Create New Admin Form */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-indigo-600" />
                    دعوة مشرف جديد
                </h3>
                <form onSubmit={handleAddAdmin} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input 
                            type="text" 
                            placeholder="اسم المشرف (Username)" 
                            className="px-4 py-3 rounded-lg border border-slate-300 outline-none focus:border-indigo-500"
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            required
                        />
                        <input 
                            type="email" 
                            placeholder="البريد الإلكتروني (Login Email)" 
                            className="px-4 py-3 rounded-lg border border-slate-300 outline-none focus:border-indigo-500"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                        />
                        <input 
                            type="password" 
                            placeholder="كلمة المرور" 
                            className="px-4 py-3 rounded-lg border border-slate-300 outline-none focus:border-indigo-500"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
                        />
                    </div>
                    
                    <div className="pt-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">تخصيص الصلاحيات (Access Control):</label>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded border hover:bg-slate-50">
                                <input 
                                    type="checkbox" 
                                    checked={formData.permissions.canManageOrders}
                                    onChange={(e) => setFormData({...formData, permissions: {...formData.permissions, canManageOrders: e.target.checked}})}
                                    className="w-4 h-4 text-indigo-600 rounded"
                                />
                                <span className="text-sm">إدارة الطلبات</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded border hover:bg-slate-50">
                                <input 
                                    type="checkbox" 
                                    checked={formData.permissions.canManageWallet}
                                    onChange={(e) => setFormData({...formData, permissions: {...formData.permissions, canManageWallet: e.target.checked}})}
                                    className="w-4 h-4 text-indigo-600 rounded"
                                />
                                <span className="text-sm">إدارة الأرصدة (المحفظة)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded border hover:bg-slate-50">
                                <input 
                                    type="checkbox" 
                                    checked={formData.permissions.canManageSettings}
                                    onChange={(e) => setFormData({...formData, permissions: {...formData.permissions, canManageSettings: e.target.checked}})}
                                    className="w-4 h-4 text-indigo-600 rounded"
                                />
                                <span className="text-sm">إعدادات الموقع (بانر، تواصل، تطبيقات)</span>
                            </label>
                            {/* Manage Team is usually reserved for Owner, but can be delegated if logic permits. Here we keep it off by default */}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            إنشاء الحساب
                        </button>
                    </div>
                </form>
            </div>

            {/* Admins List */}
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                المشرفون الحاليون
            </h3>
            
            <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-slate-100 text-slate-600 text-sm border-b border-slate-200">
                            <th className="px-4 py-3 font-bold">المشرف</th>
                            <th className="px-4 py-3 font-bold">البريد</th>
                            <th className="px-4 py-3 font-bold text-center">الطلبات</th>
                            <th className="px-4 py-3 font-bold text-center">المحفظة</th>
                            <th className="px-4 py-3 font-bold text-center">الإعدادات</th>
                            <th className="px-4 py-3 font-bold text-center">الحالة</th>
                            <th className="px-4 py-3 font-bold text-center">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.map(admin => {
                            const isOwner = admin.email === 'admin@haneen.com'; // Identify Owner
                            return (
                                <tr key={admin.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 font-bold text-slate-800 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                                            {admin.username.charAt(0)}
                                        </div>
                                        {admin.username}
                                        {isOwner && <span className="bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded border border-yellow-200">المالك</span>}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-500 font-mono">{admin.email}</td>
                                    
                                    {/* Permissions Toggles */}
                                    <td className="px-4 py-3 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={isOwner || admin.permissions?.canManageOrders} 
                                            disabled={isOwner || admin.isBanned}
                                            onChange={() => handlePermissionChange(admin.id, 'canManageOrders')}
                                            className="w-4 h-4 cursor-pointer accent-indigo-600"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={isOwner || admin.permissions?.canManageWallet} 
                                            disabled={isOwner || admin.isBanned}
                                            onChange={() => handlePermissionChange(admin.id, 'canManageWallet')}
                                            className="w-4 h-4 cursor-pointer accent-indigo-600"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={isOwner || admin.permissions?.canManageSettings} 
                                            disabled={isOwner || admin.isBanned}
                                            onChange={() => handlePermissionChange(admin.id, 'canManageSettings')}
                                            className="w-4 h-4 cursor-pointer accent-indigo-600"
                                        />
                                    </td>

                                    <td className="px-4 py-3 text-center">
                                        {admin.isBanned ? (
                                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">محظور</span>
                                        ) : (
                                            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-bold">نشط</span>
                                        )}
                                    </td>

                                    <td className="px-4 py-3 text-center">
                                        {!isOwner && (
                                            <button 
                                                onClick={() => handleBan(admin.serialId)}
                                                className={`p-2 rounded hover:bg-slate-200 transition-colors ${admin.isBanned ? 'text-green-600' : 'text-red-600'}`}
                                                title={admin.isBanned ? 'رفع الحظر' : 'حظر الحساب'}
                                            >
                                                {admin.isBanned ? <CheckCircle2 className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                                            </button>
                                        )}
                                        {isOwner && <Lock className="w-4 h-4 text-slate-300 mx-auto" />}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
       </div>
    </div>
  );
};

export default AdminTeamManagement;
