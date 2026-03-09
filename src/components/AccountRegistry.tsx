import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Calendar, Shield, Eye, EyeOff, Download, Copy, Trash2, RefreshCw } from 'lucide-react';

interface RegistrationRecord {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  unitId: string | null;
  unitName: string | null;
  registeredAt: string;
  status: 'pending_verification' | 'verified' | 'active';
}

interface AccountRegistryProps {
  onBack: () => void;
}

const AccountRegistry: React.FC<AccountRegistryProps> = ({ onBack }) => {
  const [records, setRecords] = useState<RegistrationRecord[]>([]);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // 載入註冊記錄
  useEffect(() => {
    loadRegistrationRecords();
  }, []);

  const loadRegistrationRecords = () => {
    try {
      const savedRecords = JSON.parse(localStorage.getItem('registrationRecords') || '[]');
      setRecords(savedRecords.sort((a: RegistrationRecord, b: RegistrationRecord) => 
        new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
      ));
    } catch (err) {
      console.error('Failed to load registration records:', err);
      setRecords([]);
    }
  };

  // 切換密碼顯示
  const togglePasswordVisibility = (recordId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [recordId]: !prev[recordId]
    }));
  };

  // 複製到剪貼板
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${type}已複製到剪貼板！`);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('複製失敗，請手動選取複製');
    }
  };

  // 刪除記錄
  const deleteRecord = (recordId: string) => {
    if (confirm('確定要刪除此註冊記錄嗎？')) {
      const updatedRecords = records.filter(record => record.id !== recordId);
      setRecords(updatedRecords);
      localStorage.setItem('registrationRecords', JSON.stringify(updatedRecords));
    }
  };

  // 導出為CSV
  const exportToCSV = () => {
    const csvHeader = '註冊時間,姓名,Email,密碼,角色,單位代碼,單位名稱,狀態\n';
    const csvData = records.map(record => {
      const roleMap: Record<string, string> = {
        'MOC_ADMIN': '系統管理員',
        'COACH': '輔導老師',
        'UNIT_OPERATOR': '執行單位操作人員'
      };
      
      return [
        new Date(record.registeredAt).toLocaleString('zh-TW'),
        record.name,
        record.email,
        record.password,
        roleMap[record.role] || record.role,
        record.unitId || '',
        record.unitName || '',
        record.status === 'pending_verification' ? '等待驗證' : record.status
      ].map(field => `"${field}"`).join(',');
    }).join('\n');

    const csvContent = csvHeader + csvData;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `帳號註冊記錄_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 清空所有記錄
  const clearAllRecords = () => {
    if (confirm('⚠️ 確定要清空所有註冊記錄嗎？此操作無法復原！')) {
      setRecords([]);
      localStorage.removeItem('registrationRecords');
    }
  };

  // 篩選記錄
  const filteredRecords = records.filter(record => 
    record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.unitName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'MOC_ADMIN': '系統管理員',
      'COACH': '輔導老師', 
      'UNIT_OPERATOR': '執行單位操作人員'
    };
    return roleMap[role] || role;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* 標題列 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">帳號註冊記錄</h1>
                <p className="text-sm text-gray-600">管理所有透過註冊流程申請的測試帳號</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              返回
            </button>
          </div>

          {/* 工具列 */}
          <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="搜尋姓名、Email 或單位..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={exportToCSV}
              disabled={records.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              導出 CSV
            </button>

            <button
              onClick={loadRegistrationRecords}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重新載入
            </button>

            <button
              onClick={clearAllRecords}
              disabled={records.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清空記錄
            </button>
          </div>

          {/* 統計資訊 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{records.length}</div>
              <div className="text-sm text-blue-700">總註冊數</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {records.filter(r => r.role === 'MOC_ADMIN').length}
              </div>
              <div className="text-sm text-green-700">管理員</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                {records.filter(r => r.role === 'COACH').length}
              </div>
              <div className="text-sm text-purple-700">輔導老師</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">
                {records.filter(r => r.role === 'UNIT_OPERATOR').length}
              </div>
              <div className="text-sm text-orange-700">操作人員</div>
            </div>
          </div>

          {/* 記錄列表 */}
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {records.length === 0 ? '尚無註冊記錄' : '未找到符合條件的記錄'}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {records.length === 0 ? '客戶完成註冊流程後，帳密資訊將顯示在此處' : '請調整搜尋條件'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* 基本資訊 */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-800">{record.name}</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          record.role === 'MOC_ADMIN' ? 'bg-red-100 text-red-700' :
                          record.role === 'COACH' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {getRoleDisplay(record.role)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="font-mono text-sm">{record.email}</span>
                        <button
                          onClick={() => copyToClipboard(record.email, 'Email')}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="複製 Email"
                        >
                          <Copy className="w-3 h-3 text-gray-500" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-gray-500" />
                        <span className="font-mono text-sm">
                          {showPasswords[record.id] ? record.password : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(record.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title={showPasswords[record.id] ? '隱藏密碼' : '顯示密碼'}
                        >
                          {showPasswords[record.id] ? (
                            <EyeOff className="w-3 h-3 text-gray-500" />
                          ) : (
                            <Eye className="w-3 h-3 text-gray-500" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(record.password, '密碼')}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="複製密碼"
                        >
                          <Copy className="w-3 h-3 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    {/* 詳細資訊 */}
                    <div className="space-y-2 text-sm">
                      {record.unitName && (
                        <div>
                          <span className="text-gray-600">單位：</span>
                          <span className="text-gray-800">{record.unitName} ({record.unitId})</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">註冊時間：</span>
                        <span className="text-gray-800">
                          {new Date(record.registeredAt).toLocaleString('zh-TW')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 justify-between">
                        <div>
                          <span className="text-gray-600">狀態：</span>
                          <span className={`ml-1 px-2 py-1 rounded text-xs font-semibold ${
                            record.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-700' :
                            record.status === 'verified' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {record.status === 'pending_verification' ? '等待Email驗證' : 
                             record.status === 'verified' ? '已驗證' : '已啟用'}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => deleteRecord(record.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                          title="刪除記錄"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountRegistry;