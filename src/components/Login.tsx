
import React, { useState } from 'react';
import { Mountain, Mail, Lock, Loader2, ArrowRight, UserPlus, ShieldCheck } from 'lucide-react';
import { User, UserRole } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'VERIFY' | 'FORGOT'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [name, setName] = useState('');
  const [unitName, setUnitName] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    setTimeout(() => {
      // 從 localStorage 讀取用戶數據（統一使用 mag_users）
      const savedUsers = localStorage.getItem('mag_users');
      let registeredUsers: User[] = [];
      
      if (savedUsers) {
        try {
          registeredUsers = JSON.parse(savedUsers);
        } catch (e) {
          console.error('Failed to parse registered users:', e);
        }
      }
      
      // 查找匹配的用戶
      const user = registeredUsers.find(u => u.email === email);
      
      if (user) {
        // 檢查密碼（實際系統應使用加密比對）
        if (user.password === password) {
          // 登入成功，不返回密碼
          const { password: _, ...userWithoutPassword } = user;
          onLogin(userWithoutPassword);
        } else {
          setMsg('密碼錯誤。');
        }
      } else {
        // 未找到用戶，檢查是否為硬編碼的測試帳號
        if ((email === 'mag@atipd.tw' && password === 'chin286') || (email === 'admin@moc.gov.tw' && password === 'admin123')) {
          onLogin({ id: 'admin', email, role: UserRole.ADMIN });
        } else if (email === 'coach@moc.gov.tw' && password === 'coach123') {
          onLogin({ id: 'coach-1', email, role: UserRole.COACH });
        } else if (email === 'operator@test.com' && password === 'test123') {
          onLogin({ id: 'op-test', email, role: UserRole.OPERATOR, unitId: 'unit-101' });
        } else {
          setMsg('帳號不存在，請聯繫管理員開通帳號。');
        }
      }
      setLoading(false);
    }, 1000);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    
    setTimeout(() => {
      // 檢查 email 是否已經註冊（統一使用 mag_users）
      const savedUsers = localStorage.getItem('mag_users');
      let registeredUsers: User[] = [];
      
      if (savedUsers) {
        try {
          registeredUsers = JSON.parse(savedUsers);
        } catch (e) {
          console.error('Failed to parse registered users:', e);
        }
      }
      
      const existingUser = registeredUsers.find(u => u.email === email);
      if (existingUser) {
        setMsg('此 Email 已經註冊，請直接登入。');
        setLoading(false);
        return;
      }
      
      // 生成一個 6 位數的隨機驗證碼
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setVerificationCode(code);
      
      setMsg(`驗證碼：${code}（請記下此驗證碼）`);
      setLoading(false);
      setView('VERIFY');
    }, 1500);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    
    setTimeout(() => {
      if (code === verificationCode) {
        // 驗證成功，創建新用戶
        const newUser: User = {
          id: 'op-' + Date.now(),
          name: name || '操作人員',
          email: email,
          password: password,
          role: UserRole.OPERATOR,
          unitId: 'unit-' + Date.now(),
          unitName: unitName || '未設定單位',
          assignedProjectIds: [],
          createdAt: new Date().toISOString().split('T')[0],
          lastLogin: new Date().toISOString().split('T')[0]
        };
        
        // 儲存到 localStorage（統一使用 mag_users）
        const savedUsers = localStorage.getItem('mag_users');
        let registeredUsers: User[] = [];
        
        if (savedUsers) {
          try {
            registeredUsers = JSON.parse(savedUsers);
          } catch (e) {
            console.error('Failed to parse registered users:', e);
          }
        }
        
        registeredUsers.push(newUser);
        localStorage.setItem('mag_users', JSON.stringify(registeredUsers));
        
        // 自動登入
        const { password: _, ...userWithoutPassword } = newUser;
        onLogin(userWithoutPassword);
      } else {
        setMsg('驗證碼不正確，請重新輸入。');
      }
      setLoading(false);
    }, 1000);
  };


  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col p-10 space-y-8 animate-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 flex items-center justify-center shadow-xl shadow-slate-200">
            <img src="/logo.png" alt="文化部原村計畫" className="w-20 h-20 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">文化部原村計畫管考系統</h1>
            <p className="text-gray-400 text-sm font-bold mt-1">Indigenous Village Project Management</p>
          </div>
        </div>

        {view === 'LOGIN' && (
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="email" required placeholder="電子郵件" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="password" required placeholder="登入密碼" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {msg && <p className="text-xs font-black text-red-500 text-center">{msg}</p>}

            <button 
              disabled={loading}
              className="w-full py-4 bg-[#2D3E50] text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-700 transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />}
              系統登入
            </button>

            <div className="flex justify-between items-center px-2">
              <button type="button" onClick={() => setView('FORGOT')} className="text-xs font-bold text-gray-400 hover:text-gray-600">忘記密碼？</button>
              <button type="button" onClick={() => setView('REGISTER')} className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1">
                <UserPlus size={14} /> 註冊新帳號
              </button>
            </div>

          </form>
        )}

        {view === 'REGISTER' && (
          <form className="space-y-6" onSubmit={handleRegister}>
             <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="email" required placeholder="電子郵件" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="password" required placeholder="設定密碼 (至少6碼)" 
                  minLength={6}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <input 
                type="text" placeholder="姓名（選填）" 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
                value={name} onChange={(e) => setName(e.target.value)}
              />
              <input 
                type="text" placeholder="單位名稱（選填）" 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
                value={unitName} onChange={(e) => setUnitName(e.target.value)}
              />
            </div>
            {msg && <p className="text-xs font-black text-center text-amber-600">{msg}</p>}
            <button 
              disabled={loading}
              className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-amber-700 transition-all shadow-xl"
            >
              {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
              下一步：發送驗證碼
            </button>
            <button type="button" onClick={() => setView('LOGIN')} className="w-full text-center text-sm font-bold text-gray-400">返回登入</button>
          </form>
        )}

        {view === 'VERIFY' && (
          <form className="space-y-6" onSubmit={handleVerify}>
            <div className="text-center space-y-2">
               <ShieldCheck size={48} className="mx-auto text-amber-500" />
               <h3 className="text-lg font-black text-slate-800">輸入驗證碼</h3>
               <p className="text-xs font-bold text-slate-400">已發送 6 位數代碼至 {email}</p>
               <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                 <p className="text-xs font-bold text-amber-700">您的驗證碼：<span className="text-lg font-black text-amber-900">{verificationCode}</span></p>
                 <p className="text-xs text-amber-600 mt-1">（請將此驗證碼輸入下方欄位）</p>
               </div>
            </div>
            <input 
              type="text" required maxLength={6} placeholder="驗證碼" 
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-2xl font-black text-center tracking-[0.5em] outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
              value={code} onChange={(e) => setCode(e.target.value)}
            />
            {msg && <p className="text-xs font-black text-red-500 text-center">{msg}</p>}
            <button 
              disabled={loading}
              className="w-full py-4 bg-[#2D3E50] text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-700 transition-all shadow-xl"
            >
              {loading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />}
              驗證並註冊
            </button>
            <button type="button" onClick={() => setView('REGISTER')} className="w-full text-center text-sm font-bold text-gray-400">重新輸入信箱</button>
          </form>
        )}

        {view === 'FORGOT' && (
          <div className="space-y-6">
            <p className="text-sm text-center text-gray-500 font-medium">請輸入您的註冊郵件，我們將發送重設密碼連結。</p>
            <input 
              type="email" required placeholder="電子郵件" 
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
            />
            <button className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black">發送重設連結</button>
            <button type="button" onClick={() => setView('LOGIN')} className="w-full text-center text-sm font-bold text-gray-400">返回登入</button>
          </div>
        )}

        <div className="text-center">
           <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">© 2026 MOC Indigenous Affairs Management</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
