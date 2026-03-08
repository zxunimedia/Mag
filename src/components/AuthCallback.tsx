import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase, updatePassword, getSession } from '../services/supabaseClient';

interface AuthCallbackProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess, onError }) => {
  const [status, setStatus] = useState<'loading' | 'email_confirmed' | 'password_reset' | 'error' | 'success'>('loading');
  const [message, setMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // 檢查 URL 中是否有 error 參數
      const urlParams = new URLSearchParams(window.location.search);
      const errorParam = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      
      if (errorParam) {
        let errorMessage = '驗證失敗';
        
        switch (errorParam) {
          case 'access_denied':
            errorMessage = '存取被拒絕，可能是驗證連結已過期或無效';
            break;
          case 'invalid_request':
            errorMessage = '無效的請求，請重新發送驗證信';
            break;
          case 'unauthorized_client':
            errorMessage = '未授權的客戶端';
            break;
          default:
            errorMessage = errorDescription || `驗證失敗：${errorParam}`;
        }
        
        setStatus('error');
        setMessage(errorMessage);
        return;
      }

      // 檢查 Supabase Auth 會話
      const { data: { session }, error: sessionError } = await getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setStatus('error');
        setMessage('無法取得會話資訊，請重新登入');
        return;
      }

      if (!session) {
        setStatus('error');
        setMessage('未找到有效的會話，請重新登入');
        return;
      }

      // 檢查是否為密碼重設流程
      const isPasswordRecovery = urlParams.get('type') === 'recovery';
      
      if (isPasswordRecovery) {
        setStatus('password_reset');
        setMessage('請設定您的新密碼');
      } else {
        // Email 驗證成功
        setStatus('email_confirmed');
        setMessage('您的 Email 已成功驗證！');
        
        // 3 秒後自動跳轉
        setTimeout(() => {
          setStatus('success');
          onSuccess();
        }, 3000);
      }

    } catch (error) {
      console.error('Auth callback error:', error);
      setStatus('error');
      setMessage('處理驗證時發生錯誤，請稍後再試');
    }
  };

  // 密碼強度驗證
  const validatePassword = (pwd: string) => {
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    return { checks, score, isValid: score >= 4 };
  };

  // 更新密碼
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setMessage('密碼強度不符合要求，請檢查密碼要求');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('密碼確認不一致');
      return;
    }

    setIsUpdatingPassword(true);
    setMessage('');

    try {
      const { data, error } = await updatePassword(newPassword);

      if (error) {
        setMessage(`密碼更新失敗：${error.message}`);
        setIsUpdatingPassword(false);
        return;
      }

      setStatus('success');
      setMessage('密碼已成功更新！正在為您登入...');
      
      // 2 秒後跳轉
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err) {
      console.error('Update password error:', err);
      setMessage('密碼更新時發生錯誤，請稍後再試');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const passwordValidation = validatePassword(newPassword);

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col p-10 space-y-8 animate-in zoom-in-95 duration-500">

        {/* Logo & 標題 */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 flex items-center justify-center shadow-xl shadow-slate-200">
            <img src="/logo.png" alt="文化部原村計畫" className="w-20 h-20 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">文化部原村計畫管考系統</h1>
            <p className="text-gray-400 text-sm font-bold mt-1">Indigenous Village Project Management</p>
          </div>
        </div>

        {/* 載入中 */}
        {status === 'loading' && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Loader2 size={40} className="text-blue-600 animate-spin" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">處理驗證中...</h2>
              <p className="text-sm text-gray-600">請稍候，我們正在驗證您的資訊</p>
            </div>
          </div>
        )}

        {/* Email 驗證成功 */}
        {status === 'email_confirmed' && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">✅ 驗證成功！</h2>
              <p className="text-sm text-gray-600 mb-4">{message}</p>
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
                <p><strong>🎉 歡迎加入！</strong></p>
                <p>您的帳號已成功啟用，現在可以使用所有功能了。</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">頁面將在 3 秒後自動跳轉...</p>
          </div>
        )}

        {/* 密碼重設表單 */}
        {status === 'password_reset' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} className="text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">設定新密碼</h2>
              <p className="text-sm text-gray-500 mt-1">{message}</p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="新密碼"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-12 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* 密碼強度指示器 */}
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-600">密碼強度:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordValidation.score < 2 ? 'bg-red-400 w-1/4' :
                          passwordValidation.score < 3 ? 'bg-yellow-400 w-2/4' :
                          passwordValidation.score < 4 ? 'bg-blue-400 w-3/4' :
                          'bg-green-400 w-full'
                        }`}
                      />
                    </div>
                    <span className={`font-bold ${
                      passwordValidation.score < 2 ? 'text-red-600' :
                      passwordValidation.score < 3 ? 'text-yellow-600' :
                      passwordValidation.score < 4 ? 'text-blue-600' :
                      'text-green-600'
                    }`}>
                      {passwordValidation.score < 2 ? '弱' :
                       passwordValidation.score < 3 ? '普通' :
                       passwordValidation.score < 4 ? '良好' :
                       '強'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {[
                      { key: 'length', label: '8位以上', passed: passwordValidation.checks.length },
                      { key: 'uppercase', label: '大寫字母', passed: passwordValidation.checks.uppercase },
                      { key: 'lowercase', label: '小寫字母', passed: passwordValidation.checks.lowercase },
                      { key: 'number', label: '數字', passed: passwordValidation.checks.number },
                      { key: 'special', label: '特殊字符', passed: passwordValidation.checks.special }
                    ].map(item => (
                      <div key={item.key} className={`flex items-center gap-1 ${item.passed ? 'text-green-600' : 'text-gray-400'}`}>
                        {item.passed ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="確認新密碼"
                  className={`w-full bg-gray-50 border rounded-2xl pl-12 pr-12 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all ${
                    confirmPassword && newPassword !== confirmPassword ? 'border-red-300' : 'border-gray-100'
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {confirmPassword && newPassword !== confirmPassword && (
                <div className="flex items-center gap-2 text-red-600 text-xs">
                  <AlertCircle size={12} />
                  <span>密碼確認不一致</span>
                </div>
              )}

              {message && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-bold text-red-700">{message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdatingPassword || !passwordValidation.isValid || newPassword !== confirmPassword}
                className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-amber-700 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingPassword ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />}
                {isUpdatingPassword ? '更新中...' : '更新密碼'}
              </button>
            </form>
          </div>
        )}

        {/* 錯誤狀態 */}
        {status === 'error' && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle size={40} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">❌ 驗證失敗</h2>
              <p className="text-sm text-gray-600 mb-4">{message}</p>
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
                <p><strong>可能的原因：</strong></p>
                <ul className="mt-2 space-y-1 text-left">
                  <li>• 驗證連結已過期（超過 24 小時）</li>
                  <li>• 驗證連結格式不正確</li>
                  <li>• 此帳號已經完成驗證</li>
                  <li>• 網路連接問題</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all"
            >
              返回首頁
            </button>
          </div>
        )}

        {/* 成功完成 */}
        {status === 'success' && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">🎉 操作成功！</h2>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">© 2026 MOC Indigenous Affairs Management</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;