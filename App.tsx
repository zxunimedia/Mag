
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import ProjectForm from './components/ProjectForm';
import ProjectExecutionControl from './components/ProjectExecutionControl';
import CoachingRecords from './components/CoachingRecords';
import GrantProgress from './components/GrantProgress';
import DataMigration from './components/DataMigration';
import Login from './components/Login';
import AccountManagement from './components/AccountManagement';
import BudgetControl from './components/BudgetControl';
import { Project, ProjectStatus, KRStatus, Report, MonthlyReport, CoachingRecord, User, UserRole, BudgetCategory, MOCCheckStatus } from './types';
import { UserCircle, TrendingUp, Target, FileText, Mountain, Pencil, Trash2, LogOut, Plus } from 'lucide-react';

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    unitId: 'unit-101',
    unitName: '拔馬部落文化發展協會',
    name: '從庫房到衣著,拔馬部落衣飾復刻及日常化計畫',
    executingUnit: '拔馬部落文化發展協會',
    year: '114年度',
    period: '114年12月26日至115年12月5日',
    category: '原鄉文化行動',
    representative: { name: '胡天國', title: '理事長', email: 'bunun@example.com' },
    liaison: { name: '胡曉秘', title: '秘書', email: 'wang@atipd.tw' },
    legalAddress: '南投縣信義鄉...',
    contactAddress: '南投縣信義鄉...',
    siteType: '原鄉',
    village: '拔馬部落',
    sites: ['部落集會所'],
    appliedAmount: 934915,
    approvedAmount: 850000,
    commissioner: { name: '陳專家', title: '輔導委員', email: 'chen@moc.gov.tw' },
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
          { name: '切結書', status: '已完成' },
          { name: '契約書', status: '已完成' },
          { name: '第一期收據', status: '已完成' }
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

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
  const [editMode, setEditMode] = useState<'NONE' | 'BASIC' | 'CONTROL'>('NONE');
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [coachingRecords, setCoachingRecords] = useState<CoachingRecord[]>([]);
  const [reports] = useState<Report[]>([]);

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const visibleProjects = isAdmin 
    ? projects 
    : projects.filter(p => p.unitId === currentUser.unitId || p.liaison.email === currentUser.email);

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

  // 刪除月報
  const handleDeleteMonthlyReport = (reportId: string) => {
    if (!window.confirm('確定要刪除這份月報嗎？')) return;
    setMonthlyReports(prev => prev.filter(r => r.id !== reportId));
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
            <ProjectForm project={selectedProject} onBack={() => setEditMode('NONE')} onSave={(data) => {
              handleUpdateProject({ ...selectedProject, ...data } as Project);
              setEditMode('NONE');
              setSelectedProject(null);
            }} />
          ) : 
          
          /* 編輯模式：月報/支出/進度 */
          editMode === 'CONTROL' ? (
            <ProjectExecutionControl 
              projects={visibleProjects} 
              coachingRecords={coachingRecords}
              selectedProjectId={selectedProject?.id} 
              initialReport={selectedReport}
              onBack={() => { setEditMode('NONE'); setSelectedReport(null); }} 
              onSaveReport={handleSaveMonthlyReport} 
            />
          ) : 
          
          /* 計畫詳情檢視 */
          selectedProject ? (
            <div className="space-y-6">
              <ProjectDetail project={selectedProject} reports={reports} onBack={() => setSelectedProject(null)} />
              <div className="flex gap-4 max-w-5xl mx-auto">
                <button onClick={() => setEditMode('BASIC')} className="flex-1 py-5 bg-white border-2 border-slate-200 text-slate-700 font-black rounded-[32px] hover:bg-slate-50 transition-all flex flex-col items-center gap-2 shadow-sm">
                  <Target size={24} /> 編輯計畫細節與預算
                </button>
                <button onClick={() => setEditMode('CONTROL')} className="flex-1 py-5 bg-[#2D3E50] text-white font-black rounded-[32px] hover:bg-slate-700 transition-all shadow-xl flex flex-col items-center gap-2">
                  <TrendingUp size={24} /> 填寫本月執行管控表
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard projects={visibleProjects} />}
              {activeTab === 'projects' && (
                <ProjectList 
                  projects={visibleProjects} 
                  onSelectProject={setSelectedProject} 
                  onAddNew={() => setActiveTab('submission')}
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
                     <button onClick={() => { setEditMode('CONTROL'); setSelectedReport(null); }} className="bg-[#2D3E50] text-white px-8 py-3.5 rounded-2xl font-black shadow-xl hover:bg-slate-700 transition-all flex items-center gap-2">
                        <Plus size={20} /> 新增填報
                     </button>
                   </div>
                   {/* 月報列表表格 ... */}
                   <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                     <table className="w-full text-left">
                       <thead className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                         <tr>
                           <th className="px-10 py-6">序號</th>
                           <th className="px-10 py-6">計畫案</th>
                           <th className="px-10 py-6">填報月份</th>
                           <th className="px-10 py-6">核銷金額</th>
                           <th className="px-10 py-6 text-center">操作</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {monthlyReports.filter(mr => visibleProjects.some(p => p.id === mr.projectId)).map(mr => {
                           const proj = projects.find(p => p.id === mr.projectId);
                           const totalSpent = mr.expenditures.reduce((acc, e) => acc + (e.amount || 0), 0);
                           return (
                             <tr key={mr.id} className="hover:bg-slate-50 transition-colors group">
                               <td className="px-10 py-6 font-black text-slate-300 group-hover:text-slate-500 transition-colors">{mr.id}</td>
                               <td className="px-10 py-6 font-black text-slate-800">{proj?.name}</td>
                               <td className="px-10 py-6 text-sm font-black text-blue-600">
                                  <span className="bg-blue-50 px-3 py-1 rounded-lg">{mr.month}</span>
                               </td>
                               <td className="px-10 py-6 text-sm font-black text-emerald-600">${totalSpent.toLocaleString()}</td>
                               <td className="px-10 py-6 text-center flex justify-center gap-2">
                                 <button 
                                    onClick={() => {
                                      setSelectedProject(proj!);
                                      setSelectedReport(mr);
                                      setEditMode('CONTROL');
                                    }}
                                    className="p-3 text-slate-400 hover:bg-white hover:text-blue-500 hover:shadow-md rounded-xl transition-all"
                                 >
                                   <Pencil size={20} />
                                 </button>
                                 <button 
                                    onClick={() => handleDeleteMonthlyReport(mr.id!)}
                                    className="p-3 text-slate-400 hover:bg-white hover:text-red-500 hover:shadow-md rounded-xl transition-all"
                                 >
                                   <Trash2 size={20} />
                                 </button>
                               </td>
                             </tr>
                           )
                         })}
                       </tbody>
                     </table>
                   </div>
                </div>
              )}
              {activeTab === 'budget' && <BudgetControl projects={visibleProjects} onUpdateProject={handleUpdateProject} />}
              {activeTab === 'grants' && <GrantProgress projects={visibleProjects} onUpdateProject={handleUpdateProject} currentUserRole={currentUser.role} />}
              {activeTab === 'coaching' && <CoachingRecords projects={visibleProjects} coachingRecords={coachingRecords} onSaveRecord={handleSaveCoachingRecord} currentUserRole={currentUser.role} />}
              
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
                />
              )}
              {activeTab === 'accounts' && isAdmin && (
                <AccountManagement currentUser={currentUser} projects={projects} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
