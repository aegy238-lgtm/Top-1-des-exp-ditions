import React, { useState, useEffect } from 'react';
import { Gamepad2, Plus, Trash2, Save, Edit2, Coins, CheckCircle2 } from 'lucide-react';
import { getAppConfigs, saveAppConfigs, addAppConfig } from '../services/storageService';
import { AppConfig } from '../types';

const AdminAppsSettings: React.FC = () => {
  const [apps, setApps] = useState<AppConfig[]>([]);
  const [newAppName, setNewAppName] = useState('');
  const [newAppRate, setNewAppRate] = useState('');
  const [editModeId, setEditModeId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', exchangeRate: 0 });

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = () => {
      setApps(getAppConfigs());
  };

  const handleAddApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAppName && newAppRate) {
        addAppConfig(newAppName, parseFloat(newAppRate));
        loadApps();
        setNewAppName('');
        setNewAppRate('');
        alert('تم إضافة التطبيق بنجاح');
    }
  };

  const handleDeleteApp = (id: string) => {
      // Use a confirm dialog
      if (window.confirm('هل أنت متأكد من حذف هذا التطبيق نهائياً؟')) {
          // Get latest configs directly from storage to ensure we have the most up-to-date list
          const currentApps = getAppConfigs();
          const updatedApps = currentApps.filter(a => a.id !== id);
          saveAppConfigs(updatedApps);
          setApps(updatedApps); // Update state immediately
      }
  };

  const startEdit = (app: AppConfig) => {
      setEditModeId(app.id);
      setEditFormData({ name: app.name, exchangeRate: app.exchangeRate });
  };

  const saveEdit = () => {
      if (editModeId) {
          const currentApps = getAppConfigs();
          const updatedApps = currentApps.map(app => {
              if (app.id === editModeId) {
                  return { ...app, name: editFormData.name, exchangeRate: editFormData.exchangeRate };
              }
              return app;
          });
          saveAppConfigs(updatedApps);
          setApps(updatedApps);
          setEditModeId(null);
      }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
        <Gamepad2 className="w-6 h-6 text-purple-600" />
        <h3 className="text-lg font-bold text-slate-800">إدارة التطبيقات وأسعار الكوينزات</h3>
      </div>

      {/* Add New App Form */}
      <form onSubmit={handleAddApp} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8">
          <h4 className="font-bold text-slate-700 mb-4 text-sm">إضافة تطبيق جديد</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input 
                  type="text" 
                  placeholder="اسم التطبيق (مثال: كوكو لايف)" 
                  className="px-4 py-2 rounded-lg border border-slate-300 outline-none focus:border-purple-500"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  required
              />
              <div className="relative">
                  <input 
                      type="number" 
                      placeholder="كم كوينز مقابل 1 دولار؟" 
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:border-purple-500"
                      value={newAppRate}
                      onChange={(e) => setNewAppRate(e.target.value)}
                      required
                  />
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">Coins/1$</span>
              </div>
              <button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                  <Plus className="w-5 h-5" />
                  إضافة للقائمة
              </button>
          </div>
      </form>

      {/* Apps List */}
      <div className="overflow-x-auto">
          <table className="w-full text-right">
              <thead className="bg-slate-100 text-slate-600 text-sm">
                  <tr>
                      <th className="px-4 py-3 rounded-r-lg">اسم التطبيق</th>
                      <th className="px-4 py-3">سعر الصرف (1$ = ؟ كوينز)</th>
                      <th className="px-4 py-3 rounded-l-lg text-center">تحكم</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {apps.map(app => (
                      <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium">
                              {editModeId === app.id ? (
                                  <input 
                                      className="border border-slate-300 rounded px-2 py-1 w-full"
                                      value={editFormData.name}
                                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                                  />
                              ) : (
                                  <div className="flex items-center gap-2">
                                      <Gamepad2 className="w-4 h-4 text-slate-400" />
                                      {app.name}
                                  </div>
                              )}
                          </td>
                          <td className="px-4 py-3">
                               {editModeId === app.id ? (
                                  <input 
                                      type="number"
                                      className="border border-slate-300 rounded px-2 py-1 w-32"
                                      value={editFormData.exchangeRate}
                                      onChange={(e) => setEditFormData({...editFormData, exchangeRate: parseFloat(e.target.value)})}
                                  />
                              ) : (
                                  <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full w-fit">
                                      <Coins className="w-4 h-4" />
                                      {app.exchangeRate}
                                  </div>
                              )}
                          </td>
                          <td className="px-4 py-3 text-center flex justify-center gap-2">
                              {editModeId === app.id ? (
                                  <button 
                                      type="button" 
                                      onClick={saveEdit} 
                                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                                      title="حفظ"
                                  >
                                      <CheckCircle2 className="w-5 h-5" />
                                  </button>
                              ) : (
                                  <button 
                                      type="button" 
                                      onClick={() => startEdit(app)} 
                                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                                      title="تعديل"
                                  >
                                      <Edit2 className="w-5 h-5" />
                                  </button>
                              )}
                              <button 
                                  type="button" 
                                  onClick={() => handleDeleteApp(app.id)} 
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                                  title="حذف"
                              >
                                  <Trash2 className="w-5 h-5" />
                              </button>
                          </td>
                      </tr>
                  ))}
                  {apps.length === 0 && (
                      <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-slate-400">لا توجد تطبيقات مضافة حالياً.</td>
                      </tr>
                  )}
              </tbody>
          </table>
      </div>
    </div>
  );
};

export default AdminAppsSettings;