
import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileText, 
  TrendingUp, 
  Settings,
  Mountain,
  PlusCircle,
  Calculator,
  CheckCircle,
  MessageSquare,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole }) => {
  const isAdmin = userRole === UserRole.ADMIN;
  const isCoach = userRole === UserRole.COACH;

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: '儀表板總覽' },
    { id: 'projects', icon: FolderKanban, label: '1. 計畫資料' },
    { id: 'reports', icon: FileText, label: '2. 月報填報' },
    { id: 'coaching', icon: MessageSquare, label: '3. 輔導紀錄' },
    { id: 'grants', icon: CheckCircle, label: '4. 撥付進度' },
    // 管理員和輔導老師可以看到輔導委員結案報告產製
    ...((isAdmin || isCoach) ? [{ id: 'finalReport', icon: FileCheck, label: '輔導委員結案報告產製' }] : []),
    // 只有管理員可以看到新案提案
    ...(isAdmin ? [{ id: 'submission', icon: PlusCircle, label: '新案提案申請' }] : []),
  ];

  const handleForceRefresh = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('t', Date.now().toString());
    window.location.href = url.toString();
  };

  return (
    <div className="w-64 bg-[#2D3E50] text-white min-h-screen flex flex-col shadow-xl">
      <div className="p-6 flex items-center gap-3 border-b border-[#3E4E5E]">
        <div className="bg-amber-400 p-1.5 rounded-lg">
          <Mountain className="text-[#2D3E50] w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <h1 className="font-black text-lg leading-tight tracking-tighter">文化部原村計畫</h1>
          <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest">Management System</span>
        </div>
      </div>
      
      <nav className="flex-1 mt-6 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-6 py-4 transition-all group ${
              activeTab === item.id 
                ? 'bg-amber-600 text-white border-r-4 border-amber-300' 
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <item.icon size={20} className={`${activeTab === item.id ? 'text-white' : 'group-hover:text-amber-400'}`} />
            <span className="font-black text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-[#3E4E5E] space-y-4">
        <button 
          onClick={handleForceRefresh}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-600 border border-slate-600 rounded-2xl text-xs font-black text-amber-400 transition-all active:scale-95"
        >
          <RefreshCw size={14} /> 強制重新整理
        </button>
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">系統版本</p>
           <p className="text-xs font-bold text-amber-500">v1.3.5 Stable</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
