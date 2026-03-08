import React, { useState } from 'react';
import { Mountain, Mail, Lock, Loader2, ArrowRight, ShieldCheck, Info, UserPlus, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { User, UserRole } from '../types';
import { 
  getCurrentProfile, 
  supabaseConfigured,
  signInUser,
  signUpUser,
  resetPassword
} from '../services/supabaseClient';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'SUCCESS'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'error' | 'success' | 'info'>('error');

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

  // Email 格式驗證
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 設定訊息
  const setMessage = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setMsg(message);
    setMsgType(type);
  };

  // 登入處理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    // 先檢查環境變數是否正確載入
    if (!supabaseConfigured) {
      setMessage('系統設定錯誤：後端服務未正確連線，請聯繫系統管理員確認 Vercel 環境變數設定。');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await signInUser(email, password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setMessage('帳號或密碼錯誤，請重新輸入或使用忘記密碼功能。');
        } else if (error.message.includes('Email not confirmed')) {
          setMessage('帳號尚未驗證，請檢查您的信箱並點擊驗證連結。如需重新發送驗證信，請使用註冊功能。');
        } else {
          setMessage(`登入失敗：${error.message}`);
        }
        setLoading(false);
        return;
      }

      if (!data.user) {
        setMessage('登入失敗，請稍後再試。');
        setLoading(false);
        return;
      }

      // 取得用戶 profile（角色資訊）
      const profile = await getCurrentProfile();

      if (!profile) {
        setMessage('無法取得帳號資訊，請聯繫管理員（mag@atipd.tw）。');
        setLoading(false);
        return;
      }

      // 組合 User 物件傳給 App
      const user: User = {
        id: data.user.id,
        email: data.user.email ?? email,
        name: profile.name ?? undefined,
        role: profile.role as UserRole,
        unitId: profile.unit_id ?? undefined,
        unitName: profile.unit_name ?? undefined,
        assignedProjectIds: [],
        lastLogin: new Date().toISOString(),
      };

      onLogin(user);
    } catch (err) {
      console.error('Login error:', err);
      setMessage('系統錯誤，請稍後再試或聯繫管理員。');
    } finally {
      setLoading(false);
    }
  };

  // 註冊處理
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    // 驗證欄位
    if (!name.trim()) {
      setMessage('請輸入您的姓名');
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setMessage('請輸入有效的 Email 地址');
      setLoading(false);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setMessage('密碼強度不符合要求，請檢查密碼要求');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage('密碼確認不一致');
      setLoading(false);
      return;
    }

    if (!supabaseConfigured) {
      setMessage('系統設定錯誤：後端服務未正確連線，請聯繫系統管理員。');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await signUpUser(email, password, { 
        name: name.trim(),
        role: 'UNIT_OPERATOR' // 預設為操作人員角色
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setMessage('此 Email 已經註冊過了，請直接登入或使用忘記密碼功能。');
        } else if (error.message.includes('Password should be at least')) {
          setMessage('密碼長度至少需要 6 個字符');
        } else {
          setMessage(`註冊失敗：${error.message}`);
        }
        setLoading(false);
        return;
      }

      // 註冊成功
      setView('SUCCESS');
      setMessage('註冊成功！我們已經發送驗證信到您的信箱。', 'success');
      
      // 清空表單
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');

    } catch (err) {
      console.error('Register error:', err);
      setMessage('註冊時發生錯誤，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  // 忘記密碼處理
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    if (!validateEmail(email)) {
      setMessage('請輸入有效的 Email 地址');
      setLoading(false);
      return;
    }

    if (!supabaseConfigured) {
      setMessage('系統設定錯誤：後端服務未正確連線，請聯繫系統管理員。');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await resetPassword(email);

      if (error) {
        setMessage(`發送重設信失敗：${error.message}`);
        setLoading(false);
        return;
      }

      setView('SUCCESS');
      setMessage('密碼重設信已發送！請檢查您的信箱並按照指示重設密碼。', 'success');

    } catch (err) {
      console.error('Reset password error:', err);
      setMessage('發送重設信時發生錯誤，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = validatePassword(password);

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

        {/* 登入表單 */}
        {view === 'LOGIN' && (
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input
                  type="email"
                  required
                  placeholder="電子郵件"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="登入密碼"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-12 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {msg && (
              <div className={`flex items-start gap-2 p-3 rounded-xl border ${
                msgType === 'success' ? 'bg-green-50 border-green-200' :
                msgType === 'info' ? 'bg-blue-50 border-blue-200' :
                'bg-red-50 border-red-200'
              }`}>
                {msgType === 'success' ? <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" /> :
                 msgType === 'info' ? <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" /> :
                 <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />}
                <p className={`text-xs font-bold ${
                  msgType === 'success' ? 'text-green-700' :
                  msgType === 'info' ? 'text-blue-700' :
                  'text-red-700'
                }`}>{msg}</p>
              </div>
            )}

            <button
              disabled={loading}
              className="w-full py-4 bg-[#2D3E50] text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-700 transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />}
              系統登入
            </button>

            <div className="flex justify-between items-center px-2">
              <button
                type="button"
                onClick={() => { setView('FORGOT_PASSWORD'); setMsg(''); }}
                className="text-xs font-bold text-gray-400 hover:text-gray-600"
              >
                忘記密碼？
              </button>
              <button
                type="button"
                onClick={() => { setView('REGISTER'); setMsg(''); }}
                className="text-xs font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1"
              >
                <UserPlus size={12} />
                註冊新帳號
              </button>
            </div>
          </form>
        )}

        {/* 註冊表單 */}
        {view === 'REGISTER' && (
          <form className="space-y-6" onSubmit={handleRegister}>
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">建立新帳號</h2>
              <p className="text-sm text-gray-500 mt-1">請填寫以下資訊來建立您的帳號</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input
                  type="text"
                  required
                  placeholder="姓名"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input
                  type="email"
                  required
                  placeholder="電子郵件"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="設定密碼"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-12 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {password && (
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
                  placeholder="確認密碼"
                  className={`w-full bg-gray-50 border rounded-2xl pl-12 pr-12 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all ${
                    confirmPassword && password !== confirmPassword ? 'border-red-300' : 'border-gray-100'
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

              {confirmPassword && password !== confirmPassword && (
                <div className="flex items-center gap-2 text-red-600 text-xs">
                  <AlertCircle size={12} />
                  <span>密碼確認不一致</span>
                </div>
              )}
            </div>

            {msg && (
              <div className={`flex items-start gap-2 p-3 rounded-xl border ${
                msgType === 'success' ? 'bg-green-50 border-green-200' :
                msgType === 'info' ? 'bg-blue-50 border-blue-200' :
                'bg-red-50 border-red-200'
              }`}>
                {msgType === 'success' ? <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" /> :
                 msgType === 'info' ? <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" /> :
                 <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />}
                <p className={`text-xs font-bold ${
                  msgType === 'success' ? 'text-green-700' :
                  msgType === 'info' ? 'text-blue-700' :
                  'text-red-700'
                }`}>{msg}</p>
              </div>
            )}

            <button
              disabled={loading || !passwordValidation.isValid || password !== confirmPassword || !name.trim() || !validateEmail(email)}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
              建立帳號
            </button>

            <button
              type="button"
              onClick={() => { setView('LOGIN'); setMsg(''); }}
              className="w-full text-center text-sm font-bold text-gray-400 hover:text-gray-600 py-2"
            >
              ← 返回登入
            </button>
          </form>
        )}

        {/* 忘記密碼表單 */}
        {view === 'FORGOT_PASSWORD' && (
          <form className="space-y-6" onSubmit={handleForgotPassword}>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={32} className="text-amber-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">重設密碼</h2>
              <p className="text-sm text-gray-500 mt-1">請輸入您的 Email 地址，我們將發送重設連結</p>
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="email"
                required
                placeholder="電子郵件"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {msg && (
              <div className={`flex items-start gap-2 p-3 rounded-xl border ${
                msgType === 'success' ? 'bg-green-50 border-green-200' :
                msgType === 'info' ? 'bg-blue-50 border-blue-200' :
                'bg-red-50 border-red-200'
              }`}>
                {msgType === 'success' ? <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" /> :
                 msgType === 'info' ? <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" /> :
                 <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />}
                <p className={`text-xs font-bold ${
                  msgType === 'success' ? 'text-green-700' :
                  msgType === 'info' ? 'text-blue-700' :
                  'text-red-700'
                }`}>{msg}</p>
              </div>
            )}

            <button
              disabled={loading || !validateEmail(email)}
              className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-amber-700 transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Mail size={20} />}
              發送重設連結
            </button>

            <button
              type="button"
              onClick={() => { setView('LOGIN'); setMsg(''); }}
              className="w-full text-center text-sm font-bold text-gray-400 hover:text-gray-600 py-2"
            >
              ← 返回登入
            </button>
          </form>
        )}

        {/* 成功頁面 */}
        {view === 'SUCCESS' && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            
            {msg && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-green-800 font-bold text-sm">{msg}</p>
              </div>
            )}

            <div className="space-y-3">
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>📧 請檢查您的信箱</strong></p>
                <p>• 查看收件匣和垃圾郵件資料夾</p>
                <p>• 點擊郵件中的連結完成驗證</p>
                <p>• 驗證後即可正常登入系統</p>
              </div>
            </div>

            <button
              onClick={() => { setView('LOGIN'); setMsg(''); }}
              className="w-full py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all"
            >
              返回登入頁面
            </button>
          </div>
        )}

        {view !== 'SUCCESS' && (
          <div className="text-center">
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">© 2026 MOC Indigenous Affairs Management</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
