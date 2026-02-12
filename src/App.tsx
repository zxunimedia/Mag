
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import ProjectForm from './components/ProjectForm';
import ProjectExecutionControl from './components/ProjectExecutionControl';
import CoachingRecords from './components/CoachingRecords';
import CoachingFinalReport from './components/CoachingFinalReport';
import GrantProgress from './components/GrantProgress';
import DataMigration from './components/DataMigration';
import Login from './components/Login';
import AccountManagement from './components/AccountManagement';
import PermissionManagement from './components/PermissionManagement';
import { Project, ProjectStatus, KRStatus, Report, MonthlyReport, CoachingRecord, User, UserRole, BudgetCategory, MOCCheckStatus, GrantDocStatus } from './types';
import { UserCircle, TrendingUp, Target, FileText, Mountain, Pencil, Trash2, LogOut, Plus, FileDown, CheckSquare, Square } from 'lucide-react';

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    projectCode: '114-原鄉-001',  // 計畫編號
    unitId: 'unit-101',
    unitName: '拔馬部落文化發展協會',
    assignedCoaches: ['coach@moc.gov.tw'],  // 指派給輔導老師
    assignedOperators: ['operator@example.com'],  // 指派給操作人員
    name: '從庫房到衣著,拔馬部落衣飾復刻及日常化計畫',
    executingUnit: '拔馬部落文化發展協會',
    year: '114年度',
    period: '114年12月26日至115年12月5日',
    category: '原鄉文化行動',
    representative: { name: '胡天國', title: '理事長', email: 'bunun@example.com' },
    liaison: { name: '胡曉秘', title: '秘書', email: 'wang@atipd.tw' },
    legalAddress: '南投縣信義鄉...',
    contactAddress: '南投縣信義鄉...',
    siteTypes: ['原鄉'],
    village: '拔馬部落',
    sites: ['部落集會所'],
    appliedAmount: 934915,
    approvedAmount: 850000,
    commissioner: { name: '陳專家', title: '輔導老師', email: 'chen@moc.gov.tw' },
    chiefStaff: { name: '林專員', title: '文化部主責', email: 'lin@moc.gov.tw' },
    visionText: '從庫房到衣著,拔馬部落衣飾復刻及日常化計畫',
    description: '建構部落傳統衣飾之復刻、日常化推廣之脈絡。',
    visions: [
      {
        id: 'vision-1',
        title: '建構部落傳統衣飾之復刻、日常化推廣之脈絡',
        description: '透過系統性的調查與復刻，讓部落傳統衣飾重新回到日常生活中',
        objectives: [
          {
            id: 'obj-1',
            title: '建構拔馬部落衣飾復刻之脈絡',
            weight: 10,
            keyResults: [
              { id: 'kr-1-1', description: '辦理計畫說明枃1場次', targetValue: 1, expectedDate: '2026-04-30' }
            ]
          }
        ]
      }
    ],
    budgetItems: [
      { id: 'bi-1', category: BudgetCategory.PERSONNEL, name: '專案人員', quantity: 1, unit: '人', unitPrice: 380000, totalPrice: 380000, description: '全年度執行' }
    ], 
    grants: [
      { 
        stage: '第 1 期撥款', 
        documents: [
          { name: '公文', status: '—' as GrantDocStatus, checked: false },
          { name: '補助契約書（一式四份，需用印）', status: '—' as GrantDocStatus, checked: false },
          { name: '切結書', status: '已完成' as GrantDocStatus, checked: true },
          { name: '第一期款收據', status: '已完成' as GrantDocStatus, checked: true }
        ], 
        submissionDate: '115年1月31日', 
        deadline: '115年2月15日', 
        mocFinalCheck: '符合' as MOCCheckStatus 
      }
    ],
    coachingRecords: [],
    status: ProjectStatus.ONGOING,
    progress: 45,
    startDate: '2025-12-26',
    endDate: '2026-12-05',
    spent: 380000,
    budget: 850000
  }
];

// localStorage 資料持久化工具函數
const STORAGE_KEYS = {
  PROJECTS: 'mag_projects',
  MONTHLY_REPORTS: 'mag_monthly_reports',
  COACHING_RECORDS: 'mag_coaching_records',
  USERS: 'mag_users'
};

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error(`Failed to load ${key} from localStorage:`, e);
  }
  return defaultValue;
};

const saveToStorage = <T,>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e);
  }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
  const [editMode, setEditMode] = useState<'NONE' | 'BASIC' | 'CONTROL'>('NONE');
  
  // 從 localStorage 讀取資料，如果沒有則使用預設資料
  const [projects, setProjects] = useState<Project[]>(() => 
    loadFromStorage(STORAGE_KEYS.PROJECTS, MOCK_PROJECTS)
  );
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>(() => 
    loadFromStorage(STORAGE_KEYS.MONTHLY_REPORTS, [])
  );
  const [coachingRecords, setCoachingRecords] = useState<CoachingRecord[]>(() => 
    loadFromStorage(STORAGE_KEYS.COACHING_RECORDS, [])
  );
  const [reports] = useState<Report[]>([]);
  // 月報批次選擇狀態
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);

  // 當資料變更時自動儲存到 localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PROJECTS, projects);
  }, [projects]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.MONTHLY_REPORTS, monthlyReports);
  }, [monthlyReports]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.COACHING_RECORDS, coachingRecords);
  }, [coachingRecords]);

  // 處理用戶登錄，保存新用戶到 localStorage
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    
    // 從 localStorage 讀取現有用戶列表
    const existingUsers = loadFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    
    // 檢查用戶是否已存在
    const userExists = existingUsers.some(u => u.email === user.email);
    
    if (!userExists) {
      // 新用戶，添加到列表
      const newUser: User = {
        ...user,
        createdAt: new Date().toISOString(),
        assignedProjectIds: []
      };
      const updatedUsers = [...existingUsers, newUser];
      saveToStorage(STORAGE_KEYS.USERS, updatedUsers);
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isCoach = currentUser.role === UserRole.COACH;
  const isOperator = currentUser.role === UserRole.OPERATOR;

  // 計畫指派功能：
  // - 管理員：可以看到所有計畫
  // - 輔導老師：只能看到被指派的計畫（根據 commissioner.email 或 assignedCoaches）
  // - 操作人員：只能看到被指派的計畫（根據 unitId 或 assignedOperators）
  const visibleProjects = isAdmin 
    ? projects 
    : isCoach
      ? projects.filter(p => 
          p.commissioner?.email === currentUser.email || 
          p.assignedCoaches?.includes(currentUser.id) ||
          p.assignedCoaches?.includes(currentUser.email)
        )
      : projects.filter(p => 
          p.unitId === currentUser.unitId || 
          p.liaison?.email === currentUser.email ||
          p.assignedOperators?.includes(currentUser.id) ||
          p.assignedOperators?.includes(currentUser.email)
        );

  // 儲存/更新計畫 (包含預算編列)
  const handleUpdateProject = (updated: Project) => {
    setProjects(prev => {
      const exists = prev.find(p => p.id === updated.id);
      if (exists) {
        return prev.map(p => p.id === updated.id ? updated : p);
      }
      return [...prev, updated];
    });
  };

  // 儲存月報 (包含支出明細與進度更新)
  const handleSaveMonthlyReport = (report: MonthlyReport) => {
    let newReports: MonthlyReport[] = [];
    if (report.id) {
      newReports = monthlyReports.map(r => r.id === report.id ? { ...report, submittedAt: new Date().toISOString() } : r);
    } else {
      const projReports = monthlyReports.filter(r => r.projectId === report.projectId);
      const seq = (projReports.length + 1).toString().padStart(2, '0');
      const newId = `${report.projectId}-MR-${seq}`;
      newReports = [...monthlyReports, { ...report, id: newId, submittedAt: new Date().toISOString() }];
    }
    setMonthlyReports(newReports);

    // 同步更新計畫的已執行經費
    const targetProject = projects.find(p => p.id === report.projectId);
    if (targetProject) {
      const allExpenditures = newReports
        .filter(mr => mr.projectId === report.projectId)
        .flatMap(mr => mr.expenditures)
        .reduce((sum, exp) => sum + (exp.amount || 0), 0);
      
      handleUpdateProject({ ...targetProject, spent: allExpenditures });
    }

    setEditMode('NONE');
    setSelectedReport(null);
    setActiveTab('reports');
  };

  const handleSaveCoachingRecord = (record: CoachingRecord) => {
    setCoachingRecords(prev => {
      const exists = prev.find(r => r.id === record.id);
      if (exists) return prev.map(r => r.id === record.id ? record : r);
      return [...prev, record];
    });
  };

  // 刪除輔導紀錄
  const handleDeleteCoachingRecord = (recordId: string) => {
    setCoachingRecords(prev => prev.filter(r => r.id !== recordId));
  };

  // 刪除月報
  const handleDeleteMonthlyReport = (reportId: string) => {
    if (!window.confirm('確定要刪除這份月報嗎？')) return;
    setMonthlyReports(prev => prev.filter(r => r.id !== reportId));
  };

  // 切換單個月報的選擇狀態
  const toggleReportSelection = (reportId: string) => {
    setSelectedReportIds(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  // 全選/取消全選
  const toggleSelectAll = () => {
    const visibleReportIds = monthlyReports
      .filter(mr => visibleProjects.some(p => p.id === mr.projectId))
      .map(mr => mr.id!)
      .filter(Boolean);
    
    if (selectedReportIds.length === visibleReportIds.length) {
      setSelectedReportIds([]);
    } else {
      setSelectedReportIds(visibleReportIds);
    }
  };

  // 批次匯出月報為 Word
  const exportSelectedReportsToWord = () => {
    if (selectedReportIds.length === 0) {
      alert('請先勾選要匯出的月報');
      return;
    }

    const selectedReports = monthlyReports.filter(mr => selectedReportIds.includes(mr.id!));
    
    // 建立合併的 Word 文件內容
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>月報表批次匯出</title>
        <style>
          body { font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; padding: 40px; }
          h1 { text-align: center; color: #1e40af; margin-bottom: 30px; }
          h2 { color: #334155; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 30px; }
          h3 { color: #1e40af; margin-top: 50px; padding: 20px; background: #f1f5f9; border-left: 4px solid #1e40af; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #f1f5f9; border: 1px solid #000; padding: 10px; text-align: left; }
          td { border: 1px solid #000; padding: 8px; }
          .info-section { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .info-row { display: flex; margin-bottom: 10px; }
          .info-label { font-weight: bold; width: 120px; }
          .total { font-size: 18px; font-weight: bold; color: #059669; text-align: right; margin-top: 10px; }
          .page-break { page-break-after: always; }
        </style>
      </head>
      <body>
        <h1>文化部原村計畫 月報表批次匯出</h1>
        <p style="text-align: center; color: #64748b;">匯出時間：${new Date().toLocaleString('zh-TW')} | 共 ${selectedReports.length} 份月報</p>
    `;

    selectedReports.forEach((report, index) => {
      const proj = projects.find(p => p.id === report.projectId);
      const totalSpent = report.expenditures?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

      const workItemsHtml = report.workItems?.map((item, idx) => {
        return `
          <tr>
            <td style="width: 50px;">${idx + 1}</td>
            <td>${item.executionNote || ''}</td>
            <td style="width: 100px;">${item.achievedValue || 0}</td>
          </tr>
        `;
      }).join('') || '';

      const expendituresHtml = report.expenditures?.map((exp, idx) => {
        const budgetItem = proj?.budgetItems?.find(b => b.id === exp.budgetItemId);
        return `
          <tr>
            <td style="width: 50px;">${idx + 1}</td>
            <td>${budgetItem?.name || '未指定'}</td>
            <td style="width: 100px;">${exp.fundingSource === 'SUBSIDY' ? '補助款' : '自籌款'}</td>
            <td style="width: 120px;">$${exp.amount?.toLocaleString() || 0}</td>
            <td>${exp.description || ''}</td>
          </tr>
        `;
      }).join('') || '';

      htmlContent += `
        <h3>${index + 1}. ${proj?.name || '未知計畫'} - ${report.month}</h3>
        
        <div class="info-section">
          <div class="info-row"><span class="info-label">計畫名稱：</span><span>${proj?.name || ''}</span></div>
          <div class="info-row"><span class="info-label">報告月份：</span><span>${report.month}</span></div>
          <div class="info-row"><span class="info-label">提交時間：</span><span>${report.submittedAt ? new Date(report.submittedAt).toLocaleString('zh-TW') : '未提交'}</span></div>
        </div>

        <h4>工作事項執行情形</h4>
        <table>
          <thead>
            <tr>
              <th>序號</th>
              <th>執行說明</th>
              <th>達成比例</th>
            </tr>
          </thead>
          <tbody>
            ${workItemsHtml || '<tr><td colspan="3" style="text-align: center; color: #94a3b8;">尚無工作事項</td></tr>'}
          </tbody>
        </table>

        <h4>經費支出明細</h4>
        <table>
          <thead>
            <tr>
              <th>序號</th>
              <th>預算科目</th>
              <th>經費來源</th>
              <th>支出金額</th>
              <th>支出說明</th>
            </tr>
          </thead>
          <tbody>
            ${expendituresHtml || '<tr><td colspan="5" style="text-align: center; color: #94a3b8;">尚無支出項目</td></tr>'}
          </tbody>
        </table>
        <p class="total">本月申報總額：$${totalSpent.toLocaleString()}</p>
        
        ${index < selectedReports.length - 1 ? '<div class="page-break"></div>' : ''}
      `;
    });

    htmlContent += `
      </body>
      </html>
    `;

    // 建立 Blob 並下載
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `月報表批次匯出_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // 清空選擇
    setSelectedReportIds([]);
  };

  // 刪除計畫
  const handleDeleteProject = (projectId: string) => {
    if (!window.confirm('確定要刪除這個計畫嗎？相關的月報和輔導紀錄也會一併刪除。')) return;
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setMonthlyReports(prev => prev.filter(r => r.projectId !== projectId));
    setCoachingRecords(prev => prev.filter(r => r.projectId !== projectId));
  };

  // 處理跨系統資料匯入
  const handleImportData = (importedData: any) => {
    if (importedData.projects) setProjects(importedData.projects);
    if (importedData.monthlyReports) setMonthlyReports(importedData.monthlyReports);
    if (importedData.coachingRecords) setCoachingRecords(importedData.coachingRecords);
    setActiveTab('dashboard');
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => {
        setActiveTab(tab);
        setSelectedProject(null);
        setSelectedReport(null);
        setEditMode('NONE');
      }} userRole={currentUser.role} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <UserCircle size={20} className="text-slate-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  {isAdmin ? 'System Admin' : 'Unit Operator'}
                </span>
                <span className="text-sm font-black text-slate-700 leading-none">
                  {currentUser.email}
                </span>
              </div>
            </div>
            {isAdmin && (
               <button 
                onClick={() => setActiveTab('migration')}
                className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-all"
               >
                 資料遷移中心
               </button>
            )}
          </div>
          <button onClick={() => setCurrentUser(null)} className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl font-black text-sm transition-all group shadow-sm">
            <LogOut size={18} className="group-hover:rotate-12 transition-transform" /> 登出系統
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          {/* 資料遷移分頁 */}
          {activeTab === 'migration' && (
            <DataMigration 
              projects={projects} 
              monthlyReports={monthlyReports} 
              coachingRecords={coachingRecords} 
              onImport={handleImportData}
              onBack={() => setActiveTab('dashboard')}
            />
          )}

          {/* 編輯模式：計畫資料/預算 */}
          {editMode === 'BASIC' && selectedProject ? (
            <ProjectForm 
              project={selectedProject} 
              onBack={() => setEditMode('NONE')} 
              onSave={(data) => {
                handleUpdateProject({ ...selectedProject, ...data } as Project);
                setEditMode('NONE');
                setSelectedProject(null);
              }}
              currentUserRole={currentUser.role}
            />
          ) : 
          
          /* 編輯模式：月報/支出/進度 */
          editMode === 'CONTROL' ? (
            <ProjectExecutionControl 
              projects={visibleProjects} 
              coachingRecords={coachingRecords}
              selectedProjectId={selectedProject?.id} 
              initialReport={selectedReport}
              allReports={monthlyReports}  /* 傳遞所有月報給歷史紀錄功能 */
              onBack={() => { setEditMode('NONE'); setSelectedReport(null); }} 
              onSaveReport={handleSaveMonthlyReport}
              userRole={currentUser.role}
            />
          ) : 
          
          /* 計畫詳情檢視 */
          selectedProject ? (
            <div className="space-y-6">
              <ProjectDetail project={selectedProject} reports={reports} onBack={() => setSelectedProject(null)} />
              {/* 輔導老師只能閱覽，不顯示編輯按鈕 */}
              {!isCoach && (
                <div className="flex gap-4 max-w-5xl mx-auto">
                  <button onClick={() => setEditMode('BASIC')} className="flex-1 py-5 bg-white border-2 border-slate-200 text-slate-700 font-black rounded-[32px] hover:bg-slate-50 transition-all flex flex-col items-center gap-2 shadow-sm">
                    <Target size={24} /> 編輯計畫細節與預算
                  </button>
                  <button onClick={() => setEditMode('CONTROL')} className="flex-1 py-5 bg-[#2D3E50] text-white font-black rounded-[32px] hover:bg-slate-700 transition-all shadow-xl flex flex-col items-center gap-2">
                    <TrendingUp size={24} /> 填寫本月執行管控表
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard projects={visibleProjects} />}
              {activeTab === 'projects' && (
                <ProjectList 
                  projects={visibleProjects} 
                  onSelectProject={setSelectedProject} 
                  onAddNew={() => setActiveTab('submission')}
                  onDeleteProject={handleDeleteProject}
                  userRole={currentUser.role}
                />
              )}
              {activeTab === 'reports' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                   <div className="flex justify-between items-center">
                     <div className="space-y-1">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">月報填報管理</h2>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Progress & Expenditure Reports</p>
                     </div>
                     <div className="flex items-center gap-3">
                       {selectedReportIds.length > 0 && (
                         <button 
                           onClick={exportSelectedReportsToWord}
                           className="bg-emerald-500 text-white px-6 py-3.5 rounded-2xl font-black shadow-xl hover:bg-emerald-600 transition-all flex items-center gap-2"
                         >
                           <FileDown size={20} /> 批次匯出 ({selectedReportIds.length})
                         </button>
                       )}
                       {/* 只有管理員和單位操作員可以新增月報，輔導老師只能閱覽 */}
                       {!isCoach && (
                         <button onClick={() => { setEditMode('CONTROL'); setSelectedReport(null); }} className="bg-[#2D3E50] text-white px-8 py-3.5 rounded-2xl font-black shadow-xl hover:bg-slate-700 transition-all flex items-center gap-2">
                            <Plus size={20} /> 新增填報
                         </button>
                       )}
                     </div>
                   </div>
                   {/* 月報列表表格 ... */}
                   <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                     <table className="w-full text-left">
                       <thead className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                         <tr>
                           <th className="px-6 py-6 text-center">
                             <button 
                               onClick={toggleSelectAll}
                               className="p-2 hover:bg-slate-200 rounded-lg transition-all"
                               title="全選/取消全選"
                             >
                               {selectedReportIds.length === monthlyReports.filter(mr => visibleProjects.some(p => p.id === mr.projectId)).length && selectedReportIds.length > 0 
                                 ? <CheckSquare size={20} className="text-blue-600" />
                                 : <Square size={20} className="text-slate-400" />
                               }
                             </button>
                           </th>
                           <th className="px-6 py-6">序號</th>
                           <th className="px-6 py-6">計畫案</th>
                           <th className="px-6 py-6">填報月份</th>
                           <th className="px-6 py-6">核銷金額</th>
                           <th className="px-6 py-6 text-center">操作</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {monthlyReports.filter(mr => visibleProjects.some(p => p.id === mr.projectId)).map(mr => {
                           const proj = projects.find(p => p.id === mr.projectId);
                           const totalSpent = mr.expenditures.reduce((acc, e) => acc + (e.amount || 0), 0);
                           const isSelected = selectedReportIds.includes(mr.id!);
                           return (
                             <tr key={mr.id} className={`hover:bg-slate-50 transition-colors group ${isSelected ? 'bg-blue-50' : ''}`}>
                               <td className="px-6 py-6 text-center">
                                 <button 
                                   onClick={() => toggleReportSelection(mr.id!)}
                                   className="p-2 hover:bg-slate-200 rounded-lg transition-all"
                                 >
                                   {isSelected 
                                     ? <CheckSquare size={20} className="text-blue-600" />
                                     : <Square size={20} className="text-slate-400" />
                                   }
                                 </button>
                               </td>
                               <td className="px-6 py-6 font-black text-slate-300 group-hover:text-slate-500 transition-colors">{mr.id}</td>
                               <td className="px-6 py-6 font-black text-slate-800">{proj?.name}</td>
                               <td className="px-6 py-6 text-sm font-black text-blue-600">
                                  <span className="bg-blue-50 px-3 py-1 rounded-lg">{mr.month}</span>
                               </td>
                               <td className="px-6 py-6 text-sm font-black text-emerald-600">${totalSpent.toLocaleString()}</td>
                               <td className="px-6 py-6 text-center flex justify-center gap-2">
                                 {/* 輔導老師只能查看，不能編輯或刪除 */}
                                 <button 
                                    onClick={() => {
                                      setSelectedProject(proj!);
                                      setSelectedReport(mr);
                                      setEditMode('CONTROL');
                                    }}
                                    className="p-3 text-slate-400 hover:bg-white hover:text-blue-500 hover:shadow-md rounded-xl transition-all"
                                    title={isCoach ? "查看月報" : "編輯月報"}
                                 >
                                   <Pencil size={20} />
                                 </button>
                                 {/* 只有管理員可以刪除月報 */}
                                 {isAdmin && (
                                   <button 
                                      onClick={() => handleDeleteMonthlyReport(mr.id!)}
                                      className="p-3 text-slate-400 hover:bg-white hover:text-red-500 hover:shadow-md rounded-xl transition-all"
                                   >
                                     <Trash2 size={20} />
                                   </button>
                                 )}
                               </td>
                             </tr>
                           )
                         })}
                       </tbody>
                     </table>
                   </div>
                </div>
              )}
              {activeTab === 'grants' && <GrantProgress projects={visibleProjects} onUpdateProject={handleUpdateProject} currentUserRole={currentUser.role} />}
              {activeTab === 'coaching' && <CoachingRecords projects={visibleProjects} coachingRecords={coachingRecords} onSaveRecord={handleSaveCoachingRecord} onDeleteRecord={handleDeleteCoachingRecord} currentUserRole={currentUser.role} currentUserUnitId={currentUser.unitId} />}
              {activeTab === 'finalReport' && <CoachingFinalReport projects={visibleProjects} coachingRecords={coachingRecords} currentUserRole={currentUser.role} />}
              
              {/* 新案提案申請：儲存為新計畫 */}
              {activeTab === 'submission' && isAdmin && (
                <ProjectForm 
                  onBack={() => setActiveTab('projects')} 
                  onSave={(data) => {
                    const newProject = {
                      ...data,
                      id: `P${Date.now()}`,
                      status: ProjectStatus.PLANNING,
                      progress: 0,
                      spent: 0,
                      coachingRecords: [],
                      grants: []
                    } as Project;
                    handleUpdateProject(newProject);
                    setActiveTab('projects');
                  }}
                  currentUserRole={currentUser.role}
                />
              )}
              {activeTab === 'accounts' && isAdmin && (
                <AccountManagement currentUser={currentUser} projects={projects} />
              )}
              {activeTab === 'permissions' && isAdmin && (
                <PermissionManagement projects={projects} onBack={() => setActiveTab('dashboard')} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
