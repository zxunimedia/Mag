import React, { useState, useEffect } from 'react';
import { User, UserRole, Project } from '../types';
import { supabase, adminCreateUser, resendConfirmation } from '../services/supabaseClient';
import { Plus, Trash2, Edit2, Save, X, Lock, Mail, Shield, ArrowLeft, ChevronDown, CheckCircle2 } from 'lucide-react';

interface PermissionManagementProps {
  projects: Project[];
  users: User[];
  onUsersChange: (users: User[]) => void;
  onBack: () => void;
}

interface UserWithProjects extends User {
  isEditing?: boolean;
}

const DEFAULT_USERS: User[] = [
  {
    id: 'admin-1',
    name: '管理員',
    email: 'admin@moc.gov.tw',
    role: UserRole.ADMIN,
    unitId: 'MOC',
    unitName: '文化部',
    assignedProjectIds: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'coach-1',
    name: '陳輔導',
    email: 'coach@moc.gov.tw',
    role: UserRole.COACH,
    unitId: 'MOC',
    unitName: '文化部',
    assignedProjectIds: ['1'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'operator-1',
    name: '王操作員',
    email: 'operator@moc.gov.tw',
    role: UserRole.OPERATOR,
    unitId: 'unit-101',
    unitName: '拔馬部落文化發展協會',
    assignedProjectIds: ['1'],
    createdAt: new Date().toISOString()
  }
];

const PermissionManagement: React.FC<PermissionManagementProps> = ({ projects, users: propsUsers, onUsersChange, onBack }) => {
  const [users, setUsers] = useState<UserWithProjects[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [pendingConfirmationEmails, setPendingConfirmationEmails] = useState<string[]>([]);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    password: '',
    role: UserRole.OPERATOR,
    unitId: '',
    unitName: '',
    assignedProjectIds: []
  });

  // 初始化用戶列表
  useEffect(() => {
    let userList: User[] = [];

    // 優先使用 props 中的用戶列表
    if (propsUsers && propsUsers.length > 0) {
      userList = propsUsers;
    } else {
      // 使用預設用戶（Supabase 版本從 profiles 表讀取，這裡作為 fallback）
      userList = DEFAULT_USERS;
    }

    // 確保至少有預設用戶
    if (userList.length === 0) {
      userList = DEFAULT_USERS;
    }

    setUsers(userList as UserWithProjects[]);
  }, [propsUsers]);

  // 保存用戶狀態並同步到 Supabase
  const saveUsers = async (updatedUsers: UserWithProjects[]) => {
    setUsers(updatedUsers);
    onUsersChange(updatedUsers);
    
    // 同步到 Supabase profiles 表
    try {
      const roleMap: Record<string, string> = {
        [UserRole.ADMIN]: 'MOC_ADMIN',
        [UserRole.COACH]: 'COACH',
        [UserRole.OPERATOR]: 'UNIT_OPERATOR',
      };
      
      // 只同步有 Supabase ID 的用戶（已經通過 Auth 創建的）
      const usersToSync = updatedUsers.filter(user => 
        user.id && !user.id.startsWith('local-')
      );
      
      for (const user of usersToSync) {
        const { error } = await supabase.from('profiles').upsert({
          id: user.id,
          name: user.name,
          role: roleMap[user.role] ?? 'UNIT_OPERATOR',
          unit_id: user.unitId || null,
          unit_name: user.unitName || null,
          created_at: user.createdAt,
          updated_at: new Date().toISOString()
        });
        
        if (error) {
          console.error(`Failed to sync user ${user.email}:`, error);
        }
      }
    } catch (err) {
      console.error('Error syncing users to Supabase:', err);
    }
  };

  // 添加新用戶（透過 Supabase Auth 建立帳號）
  const handleAddUser = async () => {
    // 基本欄位驗證
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('請填寫用戶名稱、信箱和密碼');
      return;
    }
    
    // 根據角色驗證單位資訊
    if (newUser.role === UserRole.OPERATOR) {
      if (!newUser.unitId || !newUser.unitName) {
        alert('操作人員必須填寫單位代碼和單位名稱');
        return;
      }
    }
    
    try {
      // 使用新的 adminCreateUser 函數
      const { data: authData, error: authError } = await adminCreateUser(
        newUser.email!,
        newUser.password!,
        {
          name: newUser.name!,
          role: getRoleMapping(newUser.role || UserRole.OPERATOR),
          unit_id: newUser.unitId || null,
          unit_name: newUser.unitName || null
        }
      );

      if (authError) {
        let errorMessage = '建立帳號失敗';
        
        if (authError.message?.includes('User already registered')) {
          errorMessage = '此 Email 已經註冊過，請使用其他 Email 地址';
        } else if (authError.message?.includes('Password should be at least')) {
          errorMessage = '密碼長度至少需要 6 個字符';
        } else if (authError.message?.includes('new row violates row-level security')) {
          errorMessage = '權限不足，請確認您有管理員權限';
        } else if (authError.message?.includes('duplicate key')) {
          errorMessage = '此 Email 已存在於系統中';
        } else {
          errorMessage = `建立帳號失敗：${authError.message}`;
        }
        
        alert(`❌ ${errorMessage}\n\n請檢查：\n1. Email 格式是否正確且未被使用\n2. 密碼是否符合安全要求\n3. 您是否有管理員權限`);
        return;
      }

      if (!authData?.user) {
        alert('建立帳號失敗：無法取得使用者資訊');
        return;
      }

      // 建立本地使用者物件
      const userId = authData.user.id;
      const user: UserWithProjects = {
        id: userId,
        name: newUser.name!,
        email: newUser.email!,
        role: newUser.role || UserRole.OPERATOR,
        unitId: newUser.unitId || '',
        unitName: newUser.unitName || '',
        assignedProjectIds: newUser.assignedProjectIds || [],
        createdAt: new Date().toISOString()
      };

      // 更新本地狀態
      const updated = [...users, user];
      await saveUsers(updated);
      
      // 清空表單
      setNewUser({ 
        name: '', 
        email: '', 
        password: '', 
        role: UserRole.OPERATOR, 
        unitId: '', 
        unitName: '', 
        assignedProjectIds: [] 
      });
      setIsAddingUser(false);
      
      // 顯示成功訊息
      if (authData.user && !authData.user.email_confirmed_at) {
        setPendingConfirmationEmails(prev => [...prev, authData.user!.email!]);
        alert(`✅ 帳號已成功建立！\n\n📧 確認信已發送至：${authData.user.email}\n\n⚠️ 請提醒使用者：\n1. 檢查收件匣和垃圾信件匣\n2. 點擊確認信中的連結啟用帳號\n3. 完成驗證後即可正常登入系統\n\n💡 如未收到確認信，可使用下方「重新發送」功能`);
      } else {
        alert(`✅ 帳號已建立並啟用！\n\n使用者現在可以直接登入系統。`);
      }

    } catch (err) {
      console.error('handleAddUser error:', err);
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('too_many_requests')) {
        alert('⚠️ 發送確認信過於頻繁，請稍後再試（約5-10分鐘）。\n\n這是 Supabase 的保護機制，帳號建立功能正常。');
      } else if (errorMessage.includes('User already registered')) {
        alert('❌ 此 Email 已經註冊過，請使用其他 Email 地址。');
      } else if (errorMessage.includes('Supabase 未正確配置')) {
        alert('❌ 系統配置錯誤，請聯繫系統管理員確認 Supabase 設定。');
      } else {
        alert(`❌ 建立帳號失敗：${errorMessage}\n\n請檢查：\n1. 網路連線是否正常\n2. 您是否有管理員權限\n3. Supabase 服務是否正常運作`);
      }
    }
  };

  // 角色映射函數
  const getRoleMapping = (role: UserRole): 'MOC_ADMIN' | 'COACH' | 'UNIT_OPERATOR' => {
    switch (role) {
      case UserRole.ADMIN:
        return 'MOC_ADMIN';
      case UserRole.COACH:
        return 'COACH';
      case UserRole.OPERATOR:
      default:
        return 'UNIT_OPERATOR';
    }
  };

  // 重新發送確認信
  const handleResendConfirmation = async (email: string) => {
    try {
      const { data, error } = await resendConfirmation(email);
      
      if (error) {
        if (error.message?.includes('rate limit') || error.message?.includes('too_many_requests')) {
          alert('⚠️ 重新發送確認信過於頻繁，請稍後再試（約5-10分鐘）。\n\n這是 Supabase 的保護機制，請耐心等候。');
        } else {
          alert(`❌ 重新發送失敗：${error.message}`);
        }
      } else {
        alert(`✅ 確認信已重新發送至：${email}\n\n請提醒使用者檢查收件匣和垃圾信件匣。`);
      }
    } catch (err) {
      console.error('Resend confirmation error:', err);
      alert('重新發送確認信時發生錯誤，請稍後再試。');
    }
  };

  // 編輯用戶
  const handleEditUser = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, isEditing: !u.isEditing } : u));
  };

  // 保存編輯
  const handleSaveEdit = async (id: string, updated: Partial<User>) => {
    const updatedUsers = users.map(u => 
      u.id === id ? { ...u, ...updated, isEditing: false } : u
    );
    await saveUsers(updatedUsers);
  };

  // 刪除用戶
  const handleDeleteUser = async (id: string) => {
    if (confirm('確定要刪除此用戶嗎？')) {
      // 先從 Supabase 刪除
      if (id && !id.startsWith('local-')) {
        try {
          const { error } = await supabase.from('profiles').delete().eq('id', id);
          if (error) {
            console.error('Failed to delete user from Supabase:', error);
            alert('刪除用戶失敗，請稍後再試');
            return;
          }
        } catch (err) {
          console.error('Error deleting user:', err);
          alert('刪除用戶時發生錯誤');
          return;
        }
      }
      
      const updated = users.filter(u => u.id !== id);
      await saveUsers(updated);
    }
  };

  // 切換計畫分配
  const handleToggleProjectAssignment = async (userId: string, projectId: string) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        const assigned = u.assignedProjectIds || [];
        const newAssigned = assigned.includes(projectId)
          ? assigned.filter(id => id !== projectId)
          : [...assigned, projectId];
        return { ...u, assignedProjectIds: newAssigned };
      }
      return u;
    });
    await saveUsers(updatedUsers);
  };

  // 新增用戶時切換計畫
  const handleToggleNewUserProject = (projectId: string) => {
    const assigned = newUser.assignedProjectIds || [];
    const newAssigned = assigned.includes(projectId)
      ? assigned.filter(id => id !== projectId)
      : [...assigned, projectId];
    setNewUser({ ...newUser, assignedProjectIds: newAssigned });
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return '管理員';
      case UserRole.COACH:
        return '輔導老師';
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
          <p className="text-gray-500">管理系統用戶、角色和計畫分配</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Shield className="text-blue-500" size={20} />
            用戶列表 ({users.length})
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                <label className="text-sm font-bold text-gray-600 mb-2 block">密碼 *</label>
                <input
                  type="password"
                  value={newUser.password || ''}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="form-input w-full"
                  placeholder="輸入密碼"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-600 mb-2 block">角色</label>
                <select
                  value={newUser.role || UserRole.OPERATOR}
                  onChange={(e) => {
                    const role = e.target.value as UserRole;
                    setNewUser({ 
                      ...newUser, 
                      role,
                      // 如果選擇輔導老師，自動設定為文化部
                      unitId: role === UserRole.COACH ? 'MOC' : newUser.unitId,
                      unitName: role === UserRole.COACH ? '文化部' : newUser.unitName
                    });
                  }}
                  className="form-input w-full"
                >
                  <option value={UserRole.OPERATOR}>操作人員</option>
                  <option value={UserRole.COACH}>輔導老師</option>
                  <option value={UserRole.ADMIN}>管理員</option>
                </select>
              </div>
              
              {/* 只有非輔導老師角色才顯示單位欄位 */}
              {newUser.role !== UserRole.COACH && (
                <>
                  <div>
                    <label className="text-sm font-bold text-gray-600 mb-2 block">
                      單位代碼 {newUser.role === UserRole.OPERATOR ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      value={newUser.unitId || ''}
                      onChange={(e) => setNewUser({ ...newUser, unitId: e.target.value })}
                      className="form-input w-full"
                      placeholder={newUser.role === UserRole.ADMIN ? '輸入單位代碼（選填）' : '輸入單位代碼'}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-600 mb-2 block">
                      單位名稱 {newUser.role === UserRole.OPERATOR ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      value={newUser.unitName || ''}
                      onChange={(e) => setNewUser({ ...newUser, unitName: e.target.value })}
                      className="form-input w-full"
                      placeholder={newUser.role === UserRole.ADMIN ? '輸入單位名稱（選填）' : '輸入單位名稱'}
                    />
                  </div>
                </>
              )}
              
              {/* 輔導老師角色的說明 */}
              {newUser.role === UserRole.COACH && (
                <div className="col-span-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium">📋 輔導老師資訊</p>
                  <p className="text-xs text-blue-700 mt-1">
                    輔導老師為文化部委派的專業輔導人員，無需填寫執行單位資訊。
                    系統將自動歸屬於「文化部」單位。
                  </p>
                </div>
              )}
            </div>

            {/* 計畫分配 */}
            <div className="mb-4">
              <label className="text-sm font-bold text-gray-600 mb-2 block">分配計畫</label>
              <div className="bg-white p-3 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                {projects.length === 0 ? (
                  <p className="text-gray-500 text-sm">暫無計畫</p>
                ) : (
                  projects.map(project => (
                    <label key={project.id} className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={(newUser.assignedProjectIds || []).includes(project.id)}
                        onChange={() => handleToggleNewUserProject(project.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {project.name} ({project.unitName})
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2">
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

        {/* 待確認 Email 列表 */}
        {pendingConfirmationEmails.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
              <Mail className="text-amber-600" size={16} />
              待確認 Email ({pendingConfirmationEmails.length})
            </h4>
            <p className="text-sm text-amber-700 mb-4">
              以下用戶需要確認 Email 才能登入系統：
            </p>
            <div className="space-y-2">
              {pendingConfirmationEmails.map((email, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded border border-amber-300">
                  <div>
                    <span className="font-medium text-gray-800">{email}</span>
                    <p className="text-xs text-gray-500">等待 Email 確認</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResendConfirmation(email)}
                      className="px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700 flex items-center gap-1"
                    >
                      <Mail size={12} />
                      重新發送
                    </button>
                    <button
                      onClick={() => setPendingConfirmationEmails(prev => prev.filter(e => e !== email))}
                      className="px-3 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500"
                    >
                      移除
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-amber-100 rounded text-xs text-amber-800">
              <strong>💡 提醒：</strong> 請通知用戶檢查收件匣和垃圾信件匣，並點擊確認連結啟用帳號。
            </div>
          </div>
        )}

        {/* 用戶列表 */}
        <div className="space-y-3">
          {users && users.length > 0 ? (
            users.map((user) => (
              <div key={user.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* 用戶基本信息 */}
                <div className="bg-gray-50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <button
                      onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <ChevronDown 
                        size={20} 
                        className={`transition-transform ${expandedUserId === user.id ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{user.name}</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail size={14} className="text-gray-400" />
                        {user.email}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditUser(user.id)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* 展開詳情 */}
                {expandedUserId === user.id && (
                  <div className="p-4 border-t border-gray-200 bg-white">
                    {user.isEditing ? (
                      // 編輯模式
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-bold text-gray-600 mb-2 block">用戶名稱</label>
                            <input
                              type="text"
                              value={user.name || ''}
                              onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, name: e.target.value } : u))}
                              className="form-input w-full"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-bold text-gray-600 mb-2 block">信箱</label>
                            <input
                              type="email"
                              value={user.email}
                              onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, email: e.target.value } : u))}
                              className="form-input w-full"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-bold text-gray-600 mb-2 block">角色</label>
                            <select
                              value={user.role}
                              onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, role: e.target.value as UserRole } : u))}
                              className="form-input w-full"
                            >
                              <option value={UserRole.OPERATOR}>操作人員</option>
                              <option value={UserRole.COACH}>輔導老師</option>
                              <option value={UserRole.ADMIN}>管理員</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-bold text-gray-600 mb-2 block">單位名稱</label>
                            <input
                              type="text"
                              value={user.unitName || ''}
                              onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, unitName: e.target.value } : u))}
                              className="form-input w-full"
                            />
                          </div>
                        </div>

                        {/* 計畫分配編輯 */}
                        <div>
                          <label className="text-sm font-bold text-gray-600 mb-2 block">分配計畫</label>
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                            {projects.length === 0 ? (
                              <p className="text-gray-500 text-sm">暫無計畫</p>
                            ) : (
                              projects.map(project => (
                                <label key={project.id} className="flex items-center gap-2 py-2 cursor-pointer hover:bg-white px-2 rounded">
                                  <input
                                    type="checkbox"
                                    checked={(user.assignedProjectIds || []).includes(project.id)}
                                    onChange={() => handleToggleProjectAssignment(user.id, project.id)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                  />
                                  <span className="text-sm text-gray-700">
                                    {project.name} ({project.unitName})
                                  </span>
                                </label>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(user.id, user)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                          >
                            <Save size={16} /> 保存
                          </button>
                          <button
                            onClick={() => handleEditUser(user.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400"
                          >
                            <X size={16} /> 取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 查看模式
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">單位：<span className="font-bold text-gray-800">{user.unitName || '—'}</span></p>
                          <p className="text-sm text-gray-600">創建時間：<span className="font-bold text-gray-800">{user.createdAt ? new Date(user.createdAt).toLocaleString('zh-TW') : '—'}</span></p>
                          <p className="text-sm text-gray-600">最後登錄：<span className="font-bold text-gray-800">{user.lastLogin ? new Date(user.lastLogin).toLocaleString('zh-TW') : '未登錄'}</span></p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-600 mb-2">分配計畫：</p>
                          {(user.assignedProjectIds || []).length === 0 ? (
                            <p className="text-sm text-gray-500">未分配任何計畫</p>
                          ) : (
                            <div className="space-y-1">
                              {(user.assignedProjectIds || []).map(projectId => {
                                const project = projects.find(p => p.id === projectId);
                                return project ? (
                                  <div key={projectId} className="flex items-center gap-2 text-sm text-gray-700 bg-blue-50 p-2 rounded">
                                    <CheckCircle2 size={14} className="text-blue-600" />
                                    {project.name}
                                  </div>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Lock className="mx-auto text-gray-300 mb-2" size={32} />
              <p className="text-gray-500">暫無用戶</p>
            </div>
          )}
        </div>

        {/* 權限說明 */}
        <div className="mt-6 bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h3 className="font-bold text-gray-800 mb-4">角色權限說明</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-bold text-red-700 mb-2">👨‍💼 管理員</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ 查看所有計畫</li>
                <li>✓ 管理用戶權限</li>
                <li>✓ 分配計畫給用戶</li>
                <li>✓ 系統設置</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-bold text-blue-700 mb-2">👨‍🏫 輔導老師</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ 查看分配計畫</li>
                <li>✓ 填寫輔導紀錄</li>
                <li>✓ 查看月報</li>
                <li>✓ 產製結案報告</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-bold text-green-700 mb-2">👨‍💻 操作人員</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ 查看分配計畫</li>
                <li>✓ 填寫月報</li>
                <li>✓ 查看撥付進度</li>
                <li>✓ 管理計畫資料</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionManagement;
