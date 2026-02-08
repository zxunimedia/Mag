import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Plus, Trash2, Edit2, Save, X, Lock, Mail, Shield, ArrowLeft } from 'lucide-react';

interface PermissionManagementProps {
  onBack: () => void;
}

interface UserPermission extends User {
  isEditing?: boolean;
}

const PermissionManagement: React.FC<PermissionManagementProps> = ({ onBack }) => {
  const [users, setUsers] = useState<UserPermission[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    role: UserRole.OPERATOR,
    unitId: '',
    unitName: ''
  });

  // 從 localStorage 加載用戶列表
  useEffect(() => {
    const stored = localStorage.getItem('mag_users');
    if (stored) {
      setUsers(JSON.parse(stored));
    } else {
      // 預設用戶
      const defaultUsers: UserPermission[] = [
        {
          id: 'admin-1',
          name: '管理員',
          email: 'admin@moc.gov.tw',
          role: UserRole.ADMIN,
          unitId: 'MOC',
          unitName: '文化部'
        },
        {
          id: 'coach-1',
          name: '陳輔導',
          email: 'coach@moc.gov.tw',
          role: UserRole.COACH,
          unitId: 'MOC',
          unitName: '文化部'
        },
        {
          id: 'operator-1',
          name: '王操作員',
          email: 'operator@moc.gov.tw',
          role: UserRole.OPERATOR,
          unitId: 'unit-101',
          unitName: '拔馬部落文化發展協會'
        }
      ];
      setUsers(defaultUsers);
      localStorage.setItem('mag_users', JSON.stringify(defaultUsers));
    }
  }, []);

  // 保存用戶到 localStorage
  const saveUsers = (updatedUsers: UserPermission[]) => {
    localStorage.setItem('mag_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  // 添加新用戶
  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      alert('請填寫用戶名稱和信箱');
      return;
    }

    const user: UserPermission = {
      id: `user-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role || UserRole.OPERATOR,
      unitId: newUser.unitId || '',
      unitName: newUser.unitName || ''
    };

    const updated = [...users, user];
    saveUsers(updated);
    setNewUser({ name: '', email: '', role: UserRole.OPERATOR, unitId: '', unitName: '' });
    setIsAddingUser(false);
  };

  // 編輯用戶
  const handleEditUser = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, isEditing: !u.isEditing } : u));
  };

  // 保存編輯
  const handleSaveEdit = (id: string, updated: Partial<User>) => {
    const updatedUsers = users.map(u => 
      u.id === id ? { ...u, ...updated, isEditing: false } : u
    );
    saveUsers(updatedUsers);
  };

  // 刪除用戶
  const handleDeleteUser = (id: string) => {
    if (confirm('確定要刪除此用戶嗎？')) {
      const updated = users.filter(u => u.id !== id);
      saveUsers(updated);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return '管理員';
      case UserRole.COACH:
        return '輔導委員';
      case UserRole.OPERATOR:
        return '操作人員';
      default:
        return '未知';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-red-100 text-red-700';
      case UserRole.COACH:
        return 'bg-blue-100 text-blue-700';
      case UserRole.OPERATOR:
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">權限管理</h2>
          <p className="text-gray-500">管理系統用戶和權限設置</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Shield className="text-blue-500" size={20} />
            用戶列表
          </h3>
          <button
            onClick={() => setIsAddingUser(!isAddingUser)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100"
          >
            <Plus size={16} /> 新增用戶
          </button>
        </div>

        {/* 新增用戶表單 */}
        {isAddingUser && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-bold text-gray-800 mb-4">新增用戶</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-600 mb-2 block">用戶名稱 *</label>
                <input
                  type="text"
                  value={newUser.name || ''}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="form-input w-full"
                  placeholder="輸入用戶名稱"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-600 mb-2 block">信箱 *</label>
                <input
                  type="email"
                  value={newUser.email || ''}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="form-input w-full"
                  placeholder="輸入信箱"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-600 mb-2 block">角色</label>
                <select
                  value={newUser.role || UserRole.OPERATOR}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="form-input w-full"
                >
                  <option value={UserRole.OPERATOR}>操作人員</option>
                  <option value={UserRole.COACH}>輔導委員</option>
                  <option value={UserRole.ADMIN}>管理員</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-600 mb-2 block">單位代碼</label>
                <input
                  type="text"
                  value={newUser.unitId || ''}
                  onChange={(e) => setNewUser({ ...newUser, unitId: e.target.value })}
                  className="form-input w-full"
                  placeholder="輸入單位代碼"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-gray-600 mb-2 block">單位名稱</label>
                <input
                  type="text"
                  value={newUser.unitName || ''}
                  onChange={(e) => setNewUser({ ...newUser, unitName: e.target.value })}
                  className="form-input w-full"
                  placeholder="輸入單位名稱"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddUser}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
              >
                <Save size={16} /> 保存
              </button>
              <button
                onClick={() => setIsAddingUser(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400"
              >
                <X size={16} /> 取消
              </button>
            </div>
          </div>
        )}

        {/* 用戶表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-gray-600">用戶名稱</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600">信箱</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600">角色</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600">單位</th>
                <th className="px-4 py-3 text-center font-bold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  {user.isEditing ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={user.name}
                          onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, name: e.target.value } : u))}
                          className="form-input w-full text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="email"
                          value={user.email}
                          onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, email: e.target.value } : u))}
                          className="form-input w-full text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, role: e.target.value as UserRole } : u))}
                          className="form-input w-full text-sm"
                        >
                          <option value={UserRole.OPERATOR}>操作人員</option>
                          <option value={UserRole.COACH}>輔導委員</option>
                          <option value={UserRole.ADMIN}>管理員</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={user.unitName || ''}
                          onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, unitName: e.target.value } : u))}
                          className="form-input w-full text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleSaveEdit(user.id, user)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded font-bold hover:bg-green-200 mr-2"
                        >
                          <Save size={14} /> 保存
                        </button>
                        <button
                          onClick={() => handleEditUser(user.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded font-bold hover:bg-gray-300"
                        >
                          <X size={14} /> 取消
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                      <td className="px-4 py-3 text-gray-600 flex items-center gap-1">
                        <Mail size={14} className="text-gray-400" />
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.unitName || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleEditUser(user.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded font-bold hover:bg-blue-200 mr-2"
                        >
                          <Edit2 size={14} /> 編輯
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded font-bold hover:bg-red-200"
                        >
                          <Trash2 size={14} /> 刪除
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-8">
            <Lock className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-gray-500">暫無用戶</p>
          </div>
        )}
      </div>

      {/* 權限說明 */}
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
        <h3 className="font-bold text-gray-800 mb-4">角色權限說明</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-bold text-red-700 mb-2">👨‍💼 管理員</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ 查看所有計畫</li>
              <li>✓ 管理用戶權限</li>
              <li>✓ 查看所有報告</li>
              <li>✓ 系統設置</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-bold text-blue-700 mb-2">👨‍🏫 輔導委員</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ 查看指派計畫</li>
              <li>✓ 填寫輔導紀錄</li>
              <li>✓ 查看月報</li>
              <li>✓ 產製結案報告</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-bold text-green-700 mb-2">👨‍💻 操作人員</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ 查看單位計畫</li>
              <li>✓ 填寫月報</li>
              <li>✓ 查看撥付進度</li>
              <li>✓ 管理計畫資料</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionManagement;
