
import React, { useState } from 'react';
import { Project, GrantStage, GrantDocument, GrantDocStatus, UserRole, MOCCheckStatus } from '../types';
import { Calendar, ChevronDown, CheckCircle2, AlertCircle, FileText, Info, ShieldCheck, Clock, CheckCircle } from 'lucide-react';

interface GrantProgressProps {
  projects: Project[];
  onUpdateProject: (project: Project) => void;
  currentUserRole: string;
}

const DEFAULT_DOCS = [
  { name: '切結書', status: '—' as GrantDocStatus },
  { name: '契約書', status: '—' as GrantDocStatus },
  { name: '第 1 期收據', status: '—' as GrantDocStatus }
];

const GrantProgress: React.FC<GrantProgressProps> = ({ projects, onUpdateProject, currentUserRole }) => {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const isAdmin = currentUserRole === UserRole.ADMIN;

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  // 確保 grants 至少有 4 期
  const currentGrants = (selectedProject?.grants && selectedProject.grants.length > 0) 
    ? selectedProject.grants 
    : [
        { stage: '第 1 期撥款', documents: [...DEFAULT_DOCS], submissionDate: '115年1月31日', deadline: '115年2月15日', mocFinalCheck: '—' as MOCCheckStatus },
        { stage: '第 2 期撥款', documents: [{ name: '修正計畫書', status: '—' as GrantDocStatus }], submissionDate: '', deadline: '', mocFinalCheck: '—' as MOCCheckStatus },
        { stage: '第 3 期撥款', documents: [{ name: '期中報告', status: '—' as GrantDocStatus }], submissionDate: '', deadline: '', mocFinalCheck: '—' as MOCCheckStatus },
        { stage: '第 4 期撥款', documents: [{ name: '期末報告', status: '—' as GrantDocStatus }], submissionDate: '', deadline: '', mocFinalCheck: '—' as MOCCheckStatus }
      ];

  const handleUpdateGrant = (stageIdx: number, field: keyof GrantStage, value: any) => {
    if (!selectedProject) return;
    const nextGrants = JSON.parse(JSON.stringify(currentGrants));
    // 確保物件結構完整
    if (!nextGrants[stageIdx]) {
      nextGrants[stageIdx] = { stage: `第 ${stageIdx + 1} 期撥款`, documents: [], mocFinalCheck: '—' };
    }
    nextGrants[stageIdx][field] = value;
    onUpdateProject({ ...selectedProject, grants: nextGrants });
  };

  const handleUpdateDocStatus = (stageIdx: number, docIdx: number, value: GrantDocStatus) => {
    if (!selectedProject) return;
    const nextGrants = JSON.parse(JSON.stringify(currentGrants));
    nextGrants[stageIdx].documents[docIdx].status = value;
    onUpdateProject({ ...selectedProject, grants: nextGrants });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-2">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">撥付進度管控</h2>
          <p className="text-slate-400 font-bold text-sm">追蹤文件檢送狀態與部內最終核定進度。</p>
        </div>
        <div className="relative w-full max-w-xs">
           <select 
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-black text-slate-700 outline-none shadow-sm appearance-none"
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
      </div>

      <div className="space-y-12">
        {currentGrants.map((grant, sIdx) => (
          <div key={sIdx} className="bg-white rounded-[48px] shadow-2xl border border-slate-100 overflow-hidden group transition-all duration-500 hover:shadow-blue-500/5">
            {/* 卡片標題區 */}
            <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
               <div className="flex items-center gap-8">
                  <div className="w-20 h-20 bg-blue-600 text-white rounded-[28px] flex items-center justify-center font-black text-3xl shadow-2xl shadow-blue-200">
                    {sIdx + 1}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">{grant.stage}</h3>
                    <div className="flex flex-wrap items-center gap-6 mt-3">
                       <div className="flex items-center gap-2 text-slate-400 text-sm font-bold bg-slate-50 px-4 py-2 rounded-xl">
                          <Calendar size={16} className="text-blue-500" /> 
                          檢送日期：
                          <input 
                            type="text" 
                            className="bg-transparent border-none p-0 text-slate-800 font-black focus:ring-0 w-28"
                            value={grant.submissionDate || ''}
                            onChange={(e) => handleUpdateGrant(sIdx, 'submissionDate', e.target.value)}
                            placeholder="無"
                          />
                       </div>
                       <div className="flex items-center gap-2 text-orange-400 text-sm font-bold bg-orange-50/50 px-4 py-2 rounded-xl border border-orange-100/50">
                          <Clock size={16} /> 
                          截止日期：
                          <input 
                            type="text" 
                            className="bg-transparent border-none p-0 text-orange-600 font-black focus:ring-0 w-28"
                            value={grant.deadline || ''}
                            onChange={(e) => handleUpdateGrant(sIdx, 'deadline', e.target.value)}
                            placeholder="設定期限"
                          />
                       </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* 文件檢核清單 */}
            <div className="p-10 space-y-8">
               <div className="flex items-center gap-3">
                 <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <CheckCircle2 size={16} />
                 </div>
                 <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">檢核清單與文件</span>
               </div>
               
               <div className="space-y-4">
                  {grant.documents.map((doc, dIdx) => (
                    <div key={dIdx} className="bg-slate-50/50 p-6 rounded-3xl flex items-center justify-between border border-transparent hover:border-slate-200 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm">
                            <FileText size={20} className="text-blue-500" />
                          </div>
                          <span className="font-black text-slate-700 text-lg">{doc.name}</span>
                       </div>
                       <select 
                        className="bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all cursor-pointer"
                        value={doc.status}
                        onChange={(e) => handleUpdateDocStatus(sIdx, dIdx, e.target.value as GrantDocStatus)}
                       >
                         {['—', '已上傳', '審核中', '已退回', '待補件', '已完成'].map(opt => (
                           <option key={opt} value={opt}>{opt}</option>
                         ))}
                       </select>
                    </div>
                  ))}
               </div>
            </div>

            {/* 文化部檢核 - 獨立區塊 (仿截圖風格，底部深色區塊) */}
            <div className="bg-slate-100/50 p-10 border-t border-slate-200/50">
               <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-5">
                     <div className="p-4 bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100">
                        <ShieldCheck size={32} className="text-emerald-500" />
                     </div>
                     <div>
                        <h4 className="font-black text-slate-800 text-xl tracking-tight">文化部最終檢核</h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">MOC Official Verification Point</p>
                     </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-end md:items-center gap-4 w-full md:w-auto">
                     {isAdmin ? (
                        <div className="flex flex-col gap-3 w-full md:w-80">
                           <select 
                            className={`w-full px-6 py-4 rounded-2xl text-sm font-black border outline-none shadow-xl transition-all ${
                              grant.mocFinalCheck === '符合' ? 'bg-emerald-600 text-white border-emerald-700' : 
                              grant.mocFinalCheck === '不符合' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-slate-700 border-slate-200'
                            }`}
                            value={grant.mocFinalCheck}
                            onChange={(e) => handleUpdateGrant(sIdx, 'mocFinalCheck', e.target.value as MOCCheckStatus)}
                           >
                             <option value="—">待檢核</option>
                             <option value="符合">符合 (核定撥款)</option>
                             <option value="不符合">不符合 (退回修正)</option>
                           </select>
                           <textarea 
                              className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 min-h-[80px]"
                              placeholder="文化部審核意見/修正點..."
                              value={grant.mocRemark || ''}
                              onChange={(e) => handleUpdateGrant(sIdx, 'mocRemark', e.target.value)}
                           />
                        </div>
                     ) : (
                        <div className="flex items-center gap-6">
                           <div className={`px-10 py-5 rounded-[24px] text-lg font-black flex items-center gap-3 shadow-xl ${
                             grant.mocFinalCheck === '符合' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                             grant.mocFinalCheck === '不符合' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-white text-slate-300 border border-slate-100'
                           }`}>
                             {grant.mocFinalCheck === '符合' ? <CheckCircle size={24} /> : grant.mocFinalCheck === '不符合' ? <AlertCircle size={24} /> : <Clock size={24} />}
                             {grant.mocFinalCheck === '符合' ? '符合，核定撥款' : grant.mocFinalCheck === '不符合' ? '不符合，請補件' : '等待部內檢核'}
                           </div>
                           {grant.mocRemark && (
                             <div className="group relative">
                                <div className="p-3 bg-white rounded-full border border-slate-200 text-slate-400 hover:text-blue-500 cursor-help transition-all">
                                   <Info size={24} />
                                </div>
                                <div className="absolute bottom-full right-0 mb-4 w-72 p-6 bg-slate-900 text-white text-xs rounded-3xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-2xl z-20">
                                   <p className="font-black text-amber-400 uppercase tracking-widest mb-2">審核意見：</p>
                                   <p className="font-bold leading-relaxed">{grant.mocRemark}</p>
                                </div>
                             </div>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GrantProgress;
