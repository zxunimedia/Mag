import React, { useState } from 'react';
import { Mountain, Mail, Lock, Loader2, ArrowRight, ShieldCheck, Info, UserPlus } from 'lucide-react';
import { User, UserRole } from '../types';
import { supabase, getCurrentProfile, supabaseConfigured } from '../services/supabaseClient';
import SelfRegistration from './SelfRegistration';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [view, setView] = useState<'LOGIN' | 'CONTACT' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    // 先檢查環境變數是否正確載入
    if (!supabaseConfigured) {
      setMsg('系統設定錯誤：後端服務未正確連線，請聯繫系統管理員確認 Vercel 環境變數設定。');
      setLoading(false);
      return;
    }

    try {
      // 使用 Supabase Auth 登入
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setMsg('帳號或密碼錯誤，請重新輸入或聯繫管理員（mag@atipd.tw）重設密碼。');
        } else if (error.message.includes('Email not confirmed')) {
          setMsg('帳號尚未驗證，請聯繫管理員（mag@atipd.tw）確認帳號狀態。');
        } else {
          setMsg(`登入失敗：${error.message}`);
        }
        setLoading(false);
        return;
      }

      if (!data.user) {
        setMsg('登入失敗，請稍後再試。');
        setLoading(false);
        return;
      }

      // 取得用戶 profile（角色資訊）
      const profile = await getCurrentProfile();

      if (!profile) {
        setMsg('無法取得帳號資訊，請聯繫管理員（mag@atipd.tw）。');
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
      setMsg('系統錯誤，請稍後再試或聯繫管理員。');
    } finally {
      setLoading(false);
    }
  };

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
                  type="password"
                  required
                  placeholder="登入密碼"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {msg && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <Info size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-bold text-red-600">{msg}</p>
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
                onClick={() => setView('CONTACT')}
                className="text-xs font-bold text-gray-400 hover:text-gray-600"
              >
                忘記密碼？
              </button>
              <button
                type="button"
                onClick={() => setView('REGISTER')}
                className="text-xs font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1"
              >
                <UserPlus size={12} />
                申請新帳號
              </button>
            </div>
          </form>
        )}

        {/* 聯繫管理員說明頁 */}
        {view === 'CONTACT' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
                <ShieldCheck size={32} className="text-amber-500" />
              </div>
              <h3 className="text-lg font-black text-slate-800">帳號申請 / 密碼重設</h3>
            </div>

            <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-600">
              <p className="font-black text-slate-700">如需密碼重設或其他帳號問題，請聯繫管理員：</p>
              <ul className="space-y-2 pl-4">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0"></span>
                  重設登入密碼
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0"></span>
                  帳號權限調整
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0"></span>
                  帳號狀態確認
                </li>
              </ul>
              <div className="mt-4 p-4 bg-white rounded-xl border border-amber-100">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">管理員聯絡信箱</p>
                <p className="text-amber-700 font-black text-base">mag@atipd.tw</p>
              </div>
              
              <div className="border-t border-slate-200 pt-4">
                <p className="text-slate-700 font-bold mb-2">💡 新用戶申請</p>
                <p className="text-xs text-slate-500 mb-3">
                  現在支援線上自助申請！您可以直接填寫申請表單，無需聯繫管理員。
                </p>
                <button
                  onClick={() => setView('REGISTER')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                >
                  <UserPlus size={16} />
                  立即申請新帳號
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setView('LOGIN')}
              className="w-full text-center text-sm font-bold text-gray-400 hover:text-gray-600 py-2"
            >
              ← 返回登入
            </button>
          </div>
        )}

        {/* 自助註冊頁面 */}
        {view === 'REGISTER' && (
          <SelfRegistration 
            onBack={() => setView('LOGIN')} 
            onSuccess={() => setView('LOGIN')}
            embedded={true}
          />
        )}

        {view !== 'REGISTER' && (
          <div className="text-center">
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">© 2026 MOC Indigenous Affairs Management</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
