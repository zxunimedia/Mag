
import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileText, 
  TrendingUp, 
  Settings,
  Mountain,
  PlusCircle,
  DollarSign,
  ClipboardCheck,
  Users,
  FileSpreadsheet,
  FileCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole }) => {
  const isAdmin = userRole === 'MOC_ADMIN';
  const isCoach = userRole === 'COACH';
  
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: '儀表板總覽' },
    { id: 'projects', icon: FolderKanban, label: '計畫清單' },
    ...(isAdmin ? [{ id: 'submission', icon: PlusCircle, label: '新案提案申請' }] : []),
    ...(!isCoach ? [{ id: 'reports', icon: FileText, label: '月報填報' }] : []),
    ...(!isCoach ? [{ id: 'grants', icon: DollarSign, label: '撥付進度' }] : []),
    { id: 'coaching', icon: ClipboardCheck, label: '輔導紀錄' },
    ...((isAdmin || isCoach) ? [{ id: 'finalReport', icon: FileCheck, label: '輔導結案報告' }] : []),
    ...(isAdmin ? [{ id: 'accounts', icon: Users, label: '帳號管理' }] : []),
  ];

  return (
    <div className="w-64 bg-[#2D3E50] text-white min-h-screen flex flex-col shadow-xl">
      <div className="p-6 flex items-center gap-3 border-b border-[#3E4E5E]">
        <Mountain className="text-amber-400 w-8 h-8" />
        <h1 className="font-bold text-lg leading-tight">文化部原村計畫<br/><span className="text-amber-400 text-sm">管考系統</span></h1>
      </div>
      
      <nav className="flex-1 mt-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-6 py-4 transition-all ${
              activeTab === item.id 
                ? 'bg-amber-600 text-white border-r-4 border-amber-300' 
                : 'text-gray-300 hover:bg-[#3E4E5E] hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[#3E4E5E]">
        <button className="flex items-center gap-3 px-2 py-2 text-gray-400 hover:text-white transition-colors w-full">
          <Settings size={20} />
          <span>系統設定</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
