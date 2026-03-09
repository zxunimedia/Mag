import React, { useState } from 'react';
import { UserPlus, CheckCircle2, AlertCircle, Loader2, Copy } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface TestAccount {
  name: string;
  email: string;
  password: string;
  role: 'MOC_ADMIN' | 'COACH' | 'UNIT_OPERATOR';
  unitId: string;
  unitName: string;
}

const defaultTestAccounts: TestAccount[] = [
  {
    name: '系統管理員',
    email: 'admin-test@mocwork.com',
    password: 'admin123456',
    role: 'MOC_ADMIN',
    unitId: 'MOC',
    unitName: '文化部'
  },
  {
    name: '輔導老師',
    email: 'coach-test@mocwork.com',
    password: 'coach123456', 
    role: 'COACH',
    unitId: 'MOC',
    unitName: '文化部'
  },
  {
    name: '操作人員',
    email: 'operator-test@mocwork.com',
    password: 'operator123456',
    role: 'UNIT_OPERATOR',
    unitId: 'TEST001',
    unitName: '測試執行單位'
  }
];

const TestAccountCreator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [createdAccounts, setCreatedAccounts] = useState<TestAccount[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const createTestAccounts = async () => {
    setLoading(true);
    setErrors([]);
    setCreatedAccounts([]);
    setSuccess(false);

    const created: TestAccount[] = [];
    const errorMessages: string[] = [];

    for (const account of defaultTestAccounts) {
      try {
        console.log(`創建帳號: ${account.email}`);
        
        // 1. 註冊 Auth 用戶
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: account.email,
          password: account.password,
          options: {
            data: {
              name: account.name,
              role: account.role
            }
          }
        });

        if (authError) {
          if (authError.message?.includes('User already registered')) {
            console.log(`帳號已存在: ${account.email}`);
            created.push(account); // 仍然加入成功清單
          } else {
            errorMessages.push(`${account.email}: ${authError.message}`);
            continue;
          }
        } else if (authData.user) {
          // 2. 創建 profile 記錄
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              name: account.name,
              email: account.email,
              role: account.role,
              unit_id: account.unitId,
              unit_name: account.unitName,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.warn(`Profile 創建警告: ${profileError.message}`);
            // 不視為錯誤，因為可能有 trigger 自動創建
          }

          created.push(account);
          
          // 3. 保存到 localStorage
          try {
            const registrationRecord = {
              id: authData.user.id,
              email: account.email,
              password: account.password,
              name: account.name,
              role: account.role,
              unitId: account.unitId,
              unitName: account.unitName,
              registeredAt: new Date().toISOString(),
              status: 'pending_verification'
            };

            const existingRecords = JSON.parse(localStorage.getItem('registrationRecords') || '[]');
            // 檢查是否已存在
            if (!existingRecords.find((r: any) => r.email === account.email)) {
              existingRecords.push(registrationRecord);
              localStorage.setItem('registrationRecords', JSON.stringify(existingRecords));
            }
          } catch (storageError) {
            console.warn('localStorage 保存失敗:', storageError);
          }
        }

        // 避免過於頻繁的請求
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知錯誤';
        errorMessages.push(`${account.email}: ${errorMessage}`);
      }
    }

    setCreatedAccounts(created);
    setErrors(errorMessages);
    setSuccess(created.length > 0);
    setLoading(false);
  };

  const copyAccountInfo = (account: TestAccount) => {
    const info = `Email: ${account.email}\n密碼: ${account.password}\n角色: ${getRoleDisplay(account.role)}`;
    navigator.clipboard.writeText(info).then(() => {
      alert('帳號資訊已複製到剪貼板！');
    }).catch(() => {
      alert('複製失敗，請手動選取複製');
    });
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'MOC_ADMIN': '系統管理員',
      'COACH': '輔導老師',
      'UNIT_OPERATOR': '操作人員'
    };
    return roleMap[role] || role;
  };

  const copyAllAccounts = () => {
    const allAccountsInfo = createdAccounts.map((account, index) => 
      `${index + 1}. ${getRoleDisplay(account.role)}帳號\nEmail: ${account.email}\n密碼: ${account.password}\n角色: ${getRoleDisplay(account.role)}\n單位: ${account.unitName}\n`
    ).join('\n');

    navigator.clipboard.writeText(allAccountsInfo).then(() => {
      alert('所有帳號資訊已複製到剪貼板！');
    }).catch(() => {
      alert('複製失敗，請手動選取複製');
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">測試帳號快速創建</h1>
          <p className="text-gray-600">為客戶創建預設的測試帳號</p>
        </div>

        {!success && !loading && (
          <div className="text-center mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
              <h3 className="font-bold text-blue-800 mb-2">即將創建的測試帳號：</h3>
              <div className="space-y-2 text-sm text-blue-700">
                {defaultTestAccounts.map((account, index) => (
                  <div key={account.email} className="flex justify-between items-center">
                    <span>{index + 1}. {account.email}</span>
                    <span className="font-mono text-xs">{account.password}</span>
                    <span className="text-xs bg-blue-200 px-2 py-1 rounded">
                      {getRoleDisplay(account.role)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={createTestAccounts}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              立即創建測試帳號
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">正在創建測試帳號，請稍候...</p>
          </div>
        )}

        {success && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-800 mb-2">測試帳號創建成功！</h2>
              <p className="text-gray-600">以下帳號可提供給客戶使用</p>
            </div>

            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-green-800">客戶測試帳號清單</h3>
                <button
                  onClick={copyAllAccounts}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Copy className="w-4 h-4" />
                  複製全部
                </button>
              </div>

              <div className="space-y-4">
                {createdAccounts.map((account, index) => (
                  <div key={account.email} className="bg-white p-4 rounded-lg border border-green-300">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-bold text-gray-800">
                          {index + 1}. {getRoleDisplay(account.role)}帳號
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <div><strong>Email:</strong> {account.email}</div>
                          <div><strong>密碼:</strong> <span className="font-mono bg-yellow-100 px-2 py-1 rounded">{account.password}</span></div>
                          <div><strong>角色:</strong> {getRoleDisplay(account.role)}</div>
                          <div><strong>單位:</strong> {account.unitName} ({account.unitId})</div>
                        </div>
                      </div>
                      <button
                        onClick={() => copyAccountInfo(account)}
                        className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                        title="複製帳號資訊"
                      >
                        <Copy className="w-4 h-4 text-green-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-bold text-yellow-800 mb-2">⚠️ 重要提醒給客戶：</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>1. 這些帳號需要完成 Email 驗證才能登入</li>
                <li>2. 請檢查信箱並點擊驗證連結啟用帳號</li>
                <li>3. 如果沒收到驗證信，請聯繫技術支援</li>
                <li>4. 驗證完成後即可使用上述帳密登入測試</li>
              </ul>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h4 className="font-bold text-red-800">創建過程中的錯誤：</h4>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestAccountCreator;