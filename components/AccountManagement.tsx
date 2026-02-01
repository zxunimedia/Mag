import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Users, Trash2, Search, Shield, UserCircle, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface AccountManagementProps {
  currentUser: User;
}

interface MockUser {
  id: string;
  email: string;
  role: UserRole;
  unitName: string;
  createdAt: string;
  lastLogin: string;
}

const AccountManagement: React.FC<AccountManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<MockUser[]>([
    { id: '1', email: 'mag@atipd.tw', role: UserRole.ADMIN, unitName: '文化部', createdAt: '2025-01-01', lastLogin: '2026-02-01' },
    { id: '2', email: 'wang@atipd.tw', role: UserRole.OPERATOR, unitName: '拔馬部落文化發展協會', createdAt: '2025-06-15', lastLogin: '2026-01-28' },
    { id: '3', email: 'test@example.com', role: UserRole.OPERATOR, unitName: '測試單位', createdAt: '2025-12-01', lastLogin: '2026-01-15' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.unitName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setDeleteConfirm(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl">
              <Users size={28} />
            </div>
            帳號管理
          </h2>
          <p className="text-slate-400 font-bold text-sm">管理系統使用者帳號與權限</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            type="text"
            placeholder="搜尋帳號或單位..."
            className="bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-3 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 w-72"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5 text-left">帳號</th>
              <th className="px-8 py-5 text-left">所屬單位</th>
              <th className="px-8 py-5 text-center">角色</th>
              <th className="px-8 py-5 text-center">最後登入</th>
              <th className="px-8 py-5 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${user.role === UserRole.ADMIN ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                      {user.role === UserRole.ADMIN ? <Shield size={18} /> : <UserCircle size={18} />}
                    </div>
                    <span className="font-black text-slate-800">{user.email}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-sm font-bold text-slate-600">{user.unitName}</td>
                <td className="px-8 py-5 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black ${
                    user.role === UserRole.ADMIN 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role === UserRole.ADMIN ? '系統管理員' : '執行單位'}
                  </span>
                </td>
                <td className="px-8 py-5 text-center text-sm font-bold text-slate-400">{user.lastLogin}</td>
                <td className="px-8 py-5 text-center">
                  {user.email !== currentUser.email ? (
                    deleteConfirm === user.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-black hover:bg-red-700 transition-all flex items-center gap-1"
                        >
                          <CheckCircle size={14} /> 確認刪除
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(user.id)}
                        className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    )
                  ) : (
                    <span className="text-xs font-bold text-slate-300">目前登入</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex items-start gap-4">
        <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
        <div className="space-y-1">
          <p className="font-black text-amber-800">注意事項</p>
          <p className="text-sm font-bold text-amber-700">刪除帳號後，該使用者將無法再登入系統。相關的計畫資料不會被刪除，但將無法再由該帳號存取。</p>
        </div>
      </div>
    </div>
  );
};

export default AccountManagement;
