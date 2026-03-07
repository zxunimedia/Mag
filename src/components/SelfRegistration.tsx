import React, { useState } from 'react';
import { UserPlus, Mail, Lock, User, Building, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { UserRole } from '../types';
import { supabase } from '../services/supabaseClient';

interface SelfRegistrationProps {
  onBack: () => void;
  onSuccess: () => void;
  embedded?: boolean; // 新增參數，表示是否嵌入在其他組件中
}

const SelfRegistration: React.FC<SelfRegistrationProps> = ({ onBack, onSuccess, embedded = false }) => {
  const [step, setStep] = useState<'FORM' | 'PENDING' | 'SUCCESS'>('FORM');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: UserRole.OPERATOR,
    unitId: '',
    unitName: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Component logic functions remain the same...
  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password) {
      return '請填寫姓名、信箱和密碼';
    }
    
    if (formData.password !== formData.confirmPassword) {
      return '密碼確認不匹配';
    }
    
    if (formData.password.length < 6) {
      return '密碼長度至少需要 6 個字元';
    }
    
    if (formData.role === UserRole.OPERATOR && (!formData.unitId || !formData.unitName)) {
      return '操作人員必須填寫單位代碼和單位名稱';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return '請輸入有效的 Email 地址';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    
    try {
      // 使用 Supabase Auth 註冊
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role,
            unitId: formData.role === UserRole.COACH ? 'MOC' : formData.unitId,
            unitName: formData.role === UserRole.COACH ? '文化部' : formData.unitName,
            reason: formData.reason,
            status: 'pending_approval' // 待審核狀態
          }
        }
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
          setError('此 Email 已經註冊過，請使用其他 Email 或聯繫管理員');
        } else if (authError.message.includes('rate limit')) {
          setError('註冊請求過於頻繁，請稍後再試（約 5-10 分鐘）');
        } else {
          setError(`註冊失敗：${authError.message}`);
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        // 創建 profile 記錄，包含待審核狀態
        const roleMap: Record<string, string> = {
          [UserRole.ADMIN]: 'MOC_ADMIN',
          [UserRole.COACH]: 'COACH', 
          [UserRole.OPERATOR]: 'UNIT_OPERATOR',
        };

        try {
          await supabase.from('profiles').upsert({
            id: authData.user.id,
            email: formData.email,
            name: formData.name,
            role: roleMap[formData.role] ?? 'UNIT_OPERATOR',
            unit_id: formData.role === UserRole.COACH ? 'MOC' : formData.unitId || null,
            unit_name: formData.role === UserRole.COACH ? '文化部' : formData.unitName || null,
            status: 'pending_approval',
            registration_reason: formData.reason,
            created_at: new Date().toISOString()
          });
        } catch (profileError) {
          console.error('Profile creation error:', profileError);
          // 繼續流程，因為 Auth 用戶已經創建
        }

        setStep('PENDING');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('註冊過程發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // 如果選擇輔導老師，自動清空單位資訊
      ...(field === 'role' && value === UserRole.COACH ? {
        unitId: '',
        unitName: ''
      } : {})
    }));
    setError(''); // 清除錯誤訊息
  };

  // Wrapper function to handle embedded vs full-screen layout
  const renderContent = (content: React.ReactNode) => {
    if (embedded) {
      return <div className="space-y-6">{content}</div>;
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          {content}
        </div>
      </div>
    );
  };

  if (step === 'PENDING') {
    return renderContent(
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">註冊申請已提交</h2>
        <div className="space-y-4 text-left">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-2">📧 確認信已發送</h3>
            <p className="text-sm text-blue-700">
              請檢查您的信箱 <strong>{formData.email}</strong> 並點擊確認連結啟用帳號。
            </p>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h3 className="font-bold text-amber-800 mb-2">⏳ 等待管理員審核</h3>
            <p className="text-sm text-amber-700">
              您的註冊申請已提交，管理員將會審核您的申請。審核通過後即可使用系統功能。
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-2">📞 聯繫資訊</h3>
            <p className="text-sm text-gray-700">
              如有問題，請聯繫系統管理員：
              <br />
              <strong>mag@atipd.tw</strong>
            </p>
          </div>
        </div>
        
        <button
          onClick={() => {
            setStep('SUCCESS');
            onSuccess();
          }}
          className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          返回登入頁面
        </button>
      </div>
    );
  }

  return renderContent(
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">申請新帳號</h1>
        <p className="text-gray-600 mt-2">填寫資料申請系統使用權限</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* 基本資訊 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              姓名 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="請輸入您的姓名"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="請輸入您的 Email"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-1" />
              密碼 *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="至少 6 個字元"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-1" />
              確認密碼 *
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="請再次輸入密碼"
            />
          </div>

          {/* 角色選擇 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">申請角色 *</label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value as UserRole)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={UserRole.OPERATOR}>執行單位操作人員</option>
              <option value={UserRole.COACH}>輔導老師</option>
              <option value={UserRole.ADMIN}>系統管理員</option>
            </select>
          </div>

          {/* 單位資訊 - 只有非輔導老師需要填寫 */}
          {formData.role !== UserRole.COACH && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-1" />
                  單位代碼 {formData.role === UserRole.OPERATOR ? '*' : ''}
                </label>
                <input
                  type="text"
                  value={formData.unitId}
                  onChange={(e) => handleInputChange('unitId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={formData.role === UserRole.ADMIN ? '選填' : '必填'}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-1" />
                  單位名稱 {formData.role === UserRole.OPERATOR ? '*' : ''}
                </label>
                <input
                  type="text"
                  value={formData.unitName}
                  onChange={(e) => handleInputChange('unitName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={formData.role === UserRole.ADMIN ? '選填' : '必填'}
                />
              </div>
            </>
          )}

          {/* 輔導老師說明 */}
          {formData.role === UserRole.COACH && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium">📋 輔導老師資訊</p>
              <p className="text-xs text-blue-700 mt-1">
                輔導老師為文化部委派的專業輔導人員，系統將自動歸屬於「文化部」單位。
              </p>
            </div>
          )}

          {/* 申請理由 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">申請理由（選填）</label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="請簡述您申請使用此系統的原因..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {loading ? '提交中...' : '提交申請'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            ⚠️ 申請提交後需要管理員審核，審核通過後方可使用系統功能
          </p>
        </div>
      </>
    );
};

export default SelfRegistration;