
import React, { useState, useEffect, useRef } from 'react';
import { Project, Objective, KeyResult, KRStatus, MonthlyReport, KRReport, ExpenditureDetail, BudgetItem, BudgetCategory, CoachingRecord } from '../types';
import { Save, ArrowLeft, Plus, Trash2, X, FileText, BarChart3, AlertTriangle, Paperclip, FileCheck, MessageSquare, DollarSign, Eye, ZoomIn, Loader2 } from 'lucide-react';

interface ProjectExecutionControlProps {
  projects: Project[];
  coachingRecords: CoachingRecord[];
  selectedProjectId?: string;
  initialReport?: MonthlyReport | null;
  onBack: () => void;
  onSaveReport: (report: MonthlyReport) => void;
}

const ProjectExecutionControl: React.FC<ProjectExecutionControlProps> = ({ projects, coachingRecords, selectedProjectId, initialReport, onBack, onSaveReport }) => {
  const [targetProjectId, setTargetProjectId] = useState(initialReport?.projectId || selectedProjectId || (projects[0]?.id || ''));
  const [reportMonth, setReportMonth] = useState(initialReport?.month || '115-02');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeExpId, setActiveExpId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const selectedProject = projects.find(p => p.id === targetProjectId);
  const pendingCoachingRecords = coachingRecords.filter(r => r.projectId === targetProjectId && !r.operatorFeedback);
  
  const [reportData, setReportData] = useState<Partial<MonthlyReport>>({
    id: initialReport?.id,
    projectId: initialReport?.projectId || targetProjectId,
    month: initialReport?.month || reportMonth,
    krReports: initialReport?.krReports || [],
    expenditures: initialReport?.expenditures || [],
    fanpageLinks: initialReport?.fanpageLinks || [],
    summary: initialReport?.summary || ''
  });

  const [coachingFeedbacks, setCoachingFeedbacks] = useState<{[key: string]: string}>(() => {
    const initial: {[key: string]: string} = {};
    pendingCoachingRecords.forEach(r => {
      initial[r.id] = r.operatorFeedback || '';
    });
    return initial;
  });

  useEffect(() => {
    if (initialReport) {
      setReportData(initialReport);
    } else if (selectedProject) {
      const initialKRs: KRReport[] = selectedProject.objectives.flatMap(obj => 
        obj.keyResults.map(kr => ({
          krId: kr.id,
          executionNote: '',
          progress: 0,
          status: KRStatus.NOT_STARTED,
          improvementStrategy: ''
        }))
      );
      setReportData({ 
        projectId: selectedProject.id, 
        month: reportMonth,
        krReports: initialKRs,
        expenditures: [],
        fanpageLinks: [],
        summary: ''
      });
    }
  }, [initialReport, selectedProject, reportMonth]);

  const handleUpdateKR = (krId: string, field: keyof KRReport, value: any) => {
    setReportData(prev => ({
      ...prev,
      krReports: prev.krReports?.map(kr => kr.krId === krId ? { ...kr, [field]: value } : kr)
    }));
  };

  const addExpenditure = () => {
    const newExp: ExpenditureDetail = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      budgetItemId: '',
      amount: 0,
      description: '業務費', 
      receiptUrls: []
    };
    setReportData(prev => ({
      ...prev,
      expenditures: [...(prev.expenditures || []), newExp]
    }));
  };

  const updateExpenditure = (id: string, field: keyof ExpenditureDetail, value: any) => {
    setReportData(prev => ({
      ...prev,
      expenditures: prev.expenditures?.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeExpId) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        // 模擬上傳延遲
        setTimeout(() => {
          updateExpenditure(activeExpId, 'receiptUrls', [base64]);
          setActiveExpId(null);
          setIsUploading(false);
        }, 800);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeExpenditure = (id: string) => {
    setReportData(prev => ({
      ...prev,
      expenditures: prev.expenditures?.filter(exp => exp.id !== id)
    }));
  };

  if (!selectedProject) return <div className="p-10 text-center text-gray-400 font-bold">計畫載入中...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-20 animate-in fade-in duration-500">
      {/* 燈箱 Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-8 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewImageUrl(null)}>
           <button className="absolute top-8 right-8 p-4 text-white/50 hover:text-white transition-colors">
              <X size={48} />
           </button>
           <div className="relative max-w-full max-h-full flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>
              <img 
                src={previewImageUrl} 
                className="max-w-full max-h-[80vh] object-contain shadow-[0_0_100px_rgba(255,255,255,0.1)] rounded-xl border border-white/10"
                alt="Receipt Full Preview"
              />
              <p className="text-white/60 font-black tracking-widest uppercase text-sm">單據原始憑證檢視</p>
           </div>
        </div>
      )}

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-[#2D3E50] text-white rounded-[24px] shadow-2xl">
            <BarChart3 size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              執行月報填報：{reportMonth}
            </h1>
            <p className="text-slate-400 font-bold text-sm mt-1">{selectedProject.name}</p>
          </div>
        </div>
        <button onClick={onBack} className="p-3 hover:bg-white rounded-full text-slate-300 hover:text-slate-900 transition-all shadow-sm">
          <ArrowLeft size={32} />
        </button>
      </div>

      {/* 1. 工作進度填報 (OKR) */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 px-2">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-blue-200">1</div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">進度填報</h2>
        </div>
        {selectedProject.objectives.map((obj) => (
          <div key={obj.id} className="space-y-8">
            <h3 className="px-8 py-3 bg-slate-100/50 rounded-2xl inline-block text-xs font-black text-slate-500 uppercase tracking-[0.2em] border border-slate-200/50">
              策略目標：{obj.title}
            </h3>
            {obj.keyResults.map((kr) => {
              const report = reportData.krReports?.find(r => r.krId === kr.id);
              return (
                <div key={kr.id} className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all">
                   <div className="bg-slate-50/50 px-10 py-6 border-b border-slate-100 flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">關鍵結果 Key Result</p>
                        <h4 className="text-xl font-black text-slate-800">{kr.description}</h4>
                      </div>
                      <select 
                        className="bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-black text-slate-700 outline-none shadow-sm"
                        value={report?.status || KRStatus.NOT_STARTED}
                        onChange={(e) => handleUpdateKR(kr.id, 'status', e.target.value as KRStatus)}
                      >
                         <option value={KRStatus.ON_TRACK}>符合進度</option>
                         <option value={KRStatus.DELAYED}>進度落後</option>
                         <option value={KRStatus.AHEAD}>進度超前</option>
                         <option value={KRStatus.NOT_STARTED}>尚未開始</option>
                      </select>
                   </div>
                   <div className="p-10 space-y-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">執行成果詳細描述</label>
                         <textarea 
                          className="w-full bg-slate-50/50 border border-slate-100 rounded-[32px] p-6 min-h-[160px] outline-none font-bold text-slate-700 focus:bg-white focus:ring-8 focus:ring-blue-500/5 transition-all"
                          placeholder="請描述本月實際執行的活動、參與人數與具體成效..."
                          value={report?.executionNote || ''}
                          onChange={(e) => handleUpdateKR(kr.id, 'executionNote', e.target.value)}
                         />
                      </div>
                      
                      {report?.status === KRStatus.DELAYED && (
                        <div className="p-8 bg-red-50 border border-red-100 rounded-[32px] space-y-5 animate-in slide-in-from-top-4">
                           <div className="flex items-center gap-3 text-red-600">
                             <AlertTriangle size={24} />
                             <span className="text-sm font-black tracking-widest uppercase">改善策略與對策 (進度落後必填)</span>
                           </div>
                           <textarea className="w-full bg-white border border-red-200 rounded-2xl p-5 min-h-[120px] outline-none font-bold text-slate-700" placeholder="請針對落後原因提出後續補強計畫..." value={report?.improvementStrategy || ''} onChange={(e) => handleUpdateKR(kr.id, 'improvementStrategy', e.target.value)} />
                        </div>
                      )}

                      <div className="flex justify-center pt-4">
                        <div className="bg-blue-50/50 p-8 rounded-[40px] border border-blue-100 flex flex-col items-center gap-4 w-full max-w-sm">
                          <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">本月累計總進度百分比</label>
                          <div className="flex items-center gap-4">
                             <input type="number" className="w-32 bg-white border border-blue-200 rounded-2xl p-4 text-4xl font-black text-blue-600 text-center shadow-xl shadow-blue-100" value={report?.progress || 0} onChange={(e) => handleUpdateKR(kr.id, 'progress', Number(e.target.value))} />
                             <span className="text-4xl font-black text-blue-200">%</span>
                          </div>
                        </div>
                      </div>
                   </div>
                </div>
              );
            })}
          </div>
        ))}
      </section>

      {/* 2. 支出明細填報 */}
      <section className="space-y-10">
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-emerald-200">2</div>
             <h2 className="text-2xl font-black text-slate-800 tracking-tight">支出明細</h2>
          </div>
          <button 
            onClick={addExpenditure}
            className="px-8 py-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl font-black text-sm hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-3 shadow-sm"
          >
            <Plus size={20} /> 新增本月支出
          </button>
        </div>

        <div className="space-y-6">
          {reportData.expenditures?.map((exp) => (
            <div key={exp.id} className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden relative border-l-[12px] border-l-emerald-500 hover:shadow-2xl transition-all group">
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-start gap-8">
                   <div className="space-y-5 flex-1">
                      <div className="flex items-center gap-4">
                        <select 
                          className="bg-slate-100 border border-slate-200 px-5 py-2 rounded-2xl text-xs font-black text-slate-600 outline-none cursor-pointer"
                          value={exp.description} 
                          onChange={(e) => updateExpenditure(exp.id, 'description', e.target.value)}
                        >
                          <option value="人事費">人事費</option>
                          <option value="業務費">業務費</option>
                          <option value="雜支">雜支</option>
                        </select>
                        <input 
                          type="text" 
                          className="text-2xl font-black text-slate-800 bg-transparent border-none p-0 focus:ring-0 w-full placeholder-slate-200" 
                          placeholder="請輸入支出項目內容 (如：講師鐘點費)"
                          value={exp.budgetItemId}
                          onChange={(e) => updateExpenditure(exp.id, 'budgetItemId', e.target.value)}
                        />
                      </div>
                   </div>
                   <div className="flex flex-col items-end gap-2">
                      <button onClick={() => removeExpenditure(exp.id)} className="text-slate-200 hover:text-red-500 transition-all p-2 bg-slate-50 rounded-xl">
                        <Trash2 size={24} />
                      </button>
                      <div className="flex items-center text-4xl font-black text-emerald-600 font-mono mt-4">
                        <span className="text-xl mr-2">$</span>
                        <input 
                          type="number" 
                          className="bg-transparent border-none text-right focus:ring-0 p-0 w-40 font-mono"
                          value={exp.amount}
                          onChange={(e) => updateExpenditure(exp.id, 'amount', Number(e.target.value))}
                        />
                      </div>
                   </div>
                </div>
                
                <div className="pt-6 border-t border-slate-50 flex items-center justify-between gap-6">
                  {exp.receiptUrls && exp.receiptUrls.length > 0 ? (
                    <div className="flex items-center gap-4 bg-emerald-50/50 p-2 pr-6 rounded-3xl border border-emerald-100 group/file shadow-sm animate-in zoom-in-95 duration-300">
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white">
                         <img src={exp.receiptUrls[0]} className="w-full h-full object-cover" />
                         <button 
                           onClick={() => setPreviewImageUrl(exp.receiptUrls[0])}
                           className="absolute inset-0 bg-emerald-600/60 text-white opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center justify-center"
                         >
                            <ZoomIn size={20} />
                         </button>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-1">單據已成功上傳</span>
                        <div className="flex items-center gap-4">
                           <button 
                             onClick={() => setPreviewImageUrl(exp.receiptUrls[0])}
                             className="text-xs font-black text-emerald-600 hover:underline flex items-center gap-1"
                           >
                             <Eye size={12} /> 點擊預覽
                           </button>
                           <button onClick={() => updateExpenditure(exp.id, 'receiptUrls', [])} className="text-xs font-black text-red-400 hover:text-red-600">
                             移除檔案
                           </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setActiveExpId(exp.id); fileInputRef.current?.click(); }}
                      disabled={isUploading}
                      className="flex items-center gap-3 text-blue-600 text-sm font-black hover:bg-blue-50 px-8 py-4 rounded-2xl border border-blue-100 transition-all shadow-sm group/btn"
                    >
                      {isUploading && activeExpId === exp.id ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} className="group-hover/btn:rotate-12 transition-transform" />}
                      {isUploading && activeExpId === exp.id ? '檔案處理中...' : '上傳憑證/發票 (支援圖片預覽)'}
                    </button>
                  )}
                  <div className="flex flex-col items-end">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">核銷序號</p>
                    <p className="text-xs font-mono font-bold text-slate-400"># {exp.id.slice(-6)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {(!reportData.expenditures || reportData.expenditures.length === 0) && (
            <div className="py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200 flex flex-col items-center gap-4">
               <DollarSign size={48} className="text-slate-100" />
               <p className="text-slate-300 font-black italic tracking-widest text-lg">目前尚無支出明細，請點擊上方按鈕新增。</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. 輔導紀錄回應 */}
      {pendingCoachingRecords.length > 0 && (
        <section className="space-y-10">
          <div className="flex items-center gap-4 px-2">
            <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-amber-100">3</div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">輔導紀錄回應</h2>
          </div>
          <div className="space-y-8">
            {pendingCoachingRecords.map(record => (
              <div key={record.id} className="bg-white rounded-[40px] border border-amber-100 shadow-xl overflow-hidden">
                <div className="bg-amber-50/80 p-8 border-b border-amber-100 flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl text-amber-500 border border-amber-100 shadow-sm">
                        <MessageSquare size={24} />
                      </div>
                      <div>
                        <span className="font-black text-slate-800 text-lg">訪視輔導紀錄：{record.date}</span>
                        <p className="text-[10px] font-black text-amber-600 mt-1 uppercase tracking-widest">流水號：{record.serialNumber}</p>
                      </div>
                   </div>
                </div>
                <div className="p-10 space-y-10">
                   <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText size={16} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">委員輔導意見摘要</span>
                      </div>
                      <p className="text-lg font-bold text-slate-600 leading-relaxed italic border-l-4 border-slate-200 pl-6">
                        {record.keyPoints || "此訪視紀錄尚未匯入摘要內容。"}
                      </p>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] pl-2 flex items-center gap-2">
                        <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></span>
                        單位回應
                      </label>
                      <textarea 
                        className="w-full bg-amber-50/50 border-2 border-amber-200 rounded-[32px] p-8 min-h-[200px] outline-none font-bold text-slate-800 focus:border-amber-500 focus:ring-8 focus:ring-amber-500/5 transition-all shadow-sm"
                        placeholder="請針對委員所提之輔導意見，具體回覆後續改善規劃或辦理情形..."
                        value={coachingFeedbacks[record.id]}
                        onChange={(e) => setCoachingFeedbacks({...coachingFeedbacks, [record.id]: e.target.value})}
                      />
                   </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileSelect} 
        accept="image/*" 
      />

      {/* 底部提交列 */}
      <div className="fixed bottom-12 right-12 z-40">
        <button 
          onClick={() => {
            onSaveReport(reportData as MonthlyReport);
          }}
          className="px-16 py-6 bg-[#2D3E50] text-white rounded-[32px] font-black shadow-2xl hover:scale-105 hover:bg-slate-900 transition-all flex items-center gap-4 border-4 border-white active:scale-95"
        >
          <Save size={32} />
          <span className="text-xl">確認提交並保存本月報</span>
        </button>
      </div>
    </div>
  );
};

export default ProjectExecutionControl;
