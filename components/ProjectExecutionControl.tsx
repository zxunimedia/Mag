
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Project, KeyResult, KRStatus, MonthlyReport, WorkItemReport, ExpenditureDetail, BudgetItem, BudgetCategory, CoachingRecord, FundingSource } from '../types';
import { Save, ArrowLeft, Plus, Trash2, X, FileText, BarChart3, AlertTriangle, Paperclip, FileCheck, MessageSquare, DollarSign, Eye, ZoomIn, Loader2, Link2, ExternalLink, Clock, ChevronDown, Upload, Calendar, Target, TrendingUp, AlertCircle, CheckCircle2, FileDown } from 'lucide-react';

interface ProjectExecutionControlProps {
  projects: Project[];
  coachingRecords: CoachingRecord[];
  selectedProjectId?: string;
  initialReport?: MonthlyReport | null;
  allReports?: MonthlyReport[];  // 所有歷史月報，用於計算累計支出
  onBack: () => void;
  onSaveReport: (report: MonthlyReport) => void;
  userRole?: string;  // 用戶角色，用於控制權限
  assignedProjectIds?: string[];  // 輔導老師負責的計畫 ID 列表
}

const ProjectExecutionControl: React.FC<ProjectExecutionControlProps> = ({ 
  projects, 
  coachingRecords, 
  selectedProjectId, 
  initialReport, 
  allReports = [],
  onBack, 
  onSaveReport,
  userRole,
  assignedProjectIds = []
}) => {
  // 權限控制
  const isAdmin = userRole === 'MOC_ADMIN';
  const isCoach = userRole === 'COACH';
  const isOperator = userRole === 'OPERATOR';
  
  // 輔導老師只能閱覽負責計畫的月報（不可編輯）
  const isReadOnly = isCoach;
  const [targetProjectId, setTargetProjectId] = useState(initialReport?.projectId || selectedProjectId || (projects[0]?.id || ''));
  const [reportMonth, setReportMonth] = useState(initialReport?.month || '2026年01月');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'expenditure' | 'workItem'>('expenditure');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  
  const selectedProject = projects.find(p => p.id === targetProjectId);
  const pendingCoachingRecords = coachingRecords.filter(r => r.projectId === targetProjectId && !r.operatorFeedback);
  
  // 從 visions 結構中取得所有 KR
  const allKeyResults = useMemo(() => {
    if (!selectedProject) return [];
    return selectedProject.visions?.flatMap(v => 
      v.objectives.flatMap(obj => 
        obj.keyResults.map(kr => ({
          ...kr,
          objectiveTitle: obj.title,
          visionTitle: v.title
        }))
      )
    ) || [];
  }, [selectedProject]);

  // 計算各預算科目的累計支出
  const budgetSpentMap = useMemo(() => {
    const map: Record<string, number> = {};
    const projectReports = allReports.filter(r => r.projectId === targetProjectId);
    projectReports.forEach(report => {
      report.expenditures?.forEach(exp => {
        if (exp.budgetItemId) {
          map[exp.budgetItemId] = (map[exp.budgetItemId] || 0) + exp.amount;
        }
      });
    });
    return map;
  }, [allReports, targetProjectId]);

  const [reportData, setReportData] = useState<Partial<MonthlyReport>>({
    id: initialReport?.id,
    projectId: initialReport?.projectId || targetProjectId,
    month: initialReport?.month || reportMonth,
    workItems: initialReport?.workItems || [],
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

  // 計算本月中報總額
  const currentMonthTotal = useMemo(() => {
    return reportData?.expenditures?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
  }, [reportData?.expenditures]);

  // 人事費上限檢查 (假設上限為核定金額的 30%)
  const personnelBudgetLimit = selectedProject ? selectedProject.approvedAmount * 0.3 : 0;
  const currentPersonnelSpent = useMemo(() => {
    const personnelItems = selectedProject?.budgetItems.filter(item => item.category === BudgetCategory.PERSONNEL) || [];
    const personnelItemIds = personnelItems.map(item => item.id);
    return reportData?.expenditures
      ?.filter(exp => personnelItemIds.includes(exp.budgetItemId))
      .reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
  }, [reportData?.expenditures, selectedProject]);

  useEffect(() => {
    if (initialReport) {
      setReportData(initialReport);
    } else if (selectedProject) {
      setReportData({ 
        projectId: selectedProject.id, 
        month: reportMonth,
        workItems: [],
        expenditures: [],
        fanpageLinks: [],
        summary: ''
      });
    }
  }, [initialReport, selectedProject, reportMonth]);

  // 新增工作事項
  const addWorkItem = () => {
    const newItem: WorkItemReport = {
      id: `work-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      krId: '',
      executionNote: '',
      achievedValue: 0,
      attachments: []
    };
    setReportData(prev => ({
      ...prev,
      workItems: [...(prev.workItems || []), newItem]
    }));
  };

  const updateWorkItem = (id: string, field: keyof WorkItemReport, value: any) => {
    setReportData(prev => ({
      ...prev,
      workItems: prev.workItems?.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeWorkItem = (id: string) => {
    setReportData(prev => ({
      ...prev,
      workItems: prev.workItems?.filter(item => item.id !== id)
    }));
  };

  // 新增支出明細
  const addExpenditure = () => {
    const newExp: ExpenditureDetail = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      budgetItemId: '',
      fundingSource: FundingSource.SUBSIDY,
      amount: 0,
      description: '',
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

  const removeExpenditure = (id: string) => {
    setReportData(prev => ({
      ...prev,
      expenditures: prev.expenditures?.filter(exp => exp.id !== id)
    }));
  };

  // 檔案上傳處理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && activeUploadId) {
      setIsUploading(true);
      
      const readPromises = Array.from(files).map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve(event.target?.result as string);
          };
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(readPromises).then(newUrls => {
        setTimeout(() => {
          if (uploadType === 'expenditure') {
            const currentExp = reportData.expenditures?.find(exp => exp.id === activeUploadId);
            const existingUrls = currentExp?.receiptUrls || [];
            updateExpenditure(activeUploadId, 'receiptUrls', [...existingUrls, ...newUrls]);
          } else {
            const currentItem = reportData.workItems?.find(item => item.id === activeUploadId);
            const existingUrls = currentItem?.attachments || [];
            updateWorkItem(activeUploadId, 'attachments', [...existingUrls, ...newUrls]);
          }
          setActiveUploadId(null);
          setIsUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 500);
      });
    }
  };

  const removeReceiptUrl = (expId: string, urlIndex: number) => {
    const exp = reportData.expenditures?.find(e => e.id === expId);
    if (exp && exp.receiptUrls) {
      const newUrls = exp.receiptUrls.filter((_, i) => i !== urlIndex);
      updateExpenditure(expId, 'receiptUrls', newUrls);
    }
  };

  const removeAttachment = (itemId: string, urlIndex: number) => {
    const item = reportData.workItems?.find(i => i.id === itemId);
    if (item && item.attachments) {
      const newUrls = item.attachments.filter((_, i) => i !== urlIndex);
      updateWorkItem(itemId, 'attachments', newUrls);
    }
  };

  // 取得預算科目的剩餘餘額
  const getBudgetRemaining = (budgetItemId: string) => {
    const item = selectedProject?.budgetItems.find(b => b.id === budgetItemId);
    if (!item) return 0;
    const spent = budgetSpentMap[budgetItemId] || 0;
    return item.totalPrice - spent;
  };

  // 取得 KR 的預定目標值
  const getKRTargetValue = (krId: string) => {
    const kr = allKeyResults.find(k => k.id === krId);
    return kr?.targetValue || 0;
  };

  // 匯出 Word 檔案功能
  const exportToWord = () => {
    if (!selectedProject || !reportData) return;

    // 建立 Word 文件內容
    const workItemsHtml = reportData.workItems?.map((item, idx) => {
      const kr = allKeyResults.find(k => k.id === item.krId);
      return `
        <tr>
          <td style="border: 1px solid #000; padding: 8px;">${idx + 1}</td>
          <td style="border: 1px solid #000; padding: 8px;">${kr?.description || '未指定'}</td>
          <td style="border: 1px solid #000; padding: 8px;">${item.executionNote || ''}</td>
          <td style="border: 1px solid #000; padding: 8px;">${item.achievedValue || 0}</td>
        </tr>
      `;
    }).join('') || '';

    const expendituresHtml = reportData.expenditures?.map((exp, idx) => {
      const budgetItem = selectedProject.budgetItems.find(b => b.id === exp.budgetItemId);
      return `
        <tr>
          <td style="border: 1px solid #000; padding: 8px;">${idx + 1}</td>
          <td style="border: 1px solid #000; padding: 8px;">${budgetItem?.name || '未指定'}</td>
          <td style="border: 1px solid #000; padding: 8px;">${exp.fundingSource === 'SUBSIDY' ? '補助款' : '自籌款'}</td>
          <td style="border: 1px solid #000; padding: 8px;">$${exp.amount?.toLocaleString() || 0}</td>
          <td style="border: 1px solid #000; padding: 8px;">${exp.description || ''}</td>
        </tr>
      `;
    }).join('') || '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>月報表 - ${selectedProject.name} - ${reportData.month}</title>
        <style>
          body { font-family: '微軟正黑體', 'Microsoft JhengHei', sans-serif; padding: 40px; }
          h1 { text-align: center; color: #1e40af; margin-bottom: 30px; }
          h2 { color: #334155; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #f1f5f9; border: 1px solid #000; padding: 10px; text-align: left; }
          .info-section { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .info-row { display: flex; margin-bottom: 10px; }
          .info-label { font-weight: bold; width: 120px; }
          .total { font-size: 18px; font-weight: bold; color: #059669; text-align: right; margin-top: 10px; }
        </style>
      </head>
      <body>
        <h1>文化部原村計畫 月報表</h1>
        
        <div class="info-section">
          <div class="info-row"><span class="info-label">計畫名稱：</span><span>${selectedProject.name}</span></div>
          <div class="info-row"><span class="info-label">計畫編號：</span><span>${selectedProject.id}</span></div>
          <div class="info-row"><span class="info-label">報告月份：</span><span>${reportData.month}</span></div>
          <div class="info-row"><span class="info-label">匯出時間：</span><span>${new Date().toLocaleString('zh-TW')}</span></div>
        </div>

        <h2>一、工作事項執行情形</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 50px;">序號</th>
              <th>對應關鍵結果 (KR)</th>
              <th>執行說明</th>
              <th style="width: 100px;">達成值</th>
            </tr>
          </thead>
          <tbody>
            ${workItemsHtml || '<tr><td colspan="4" style="border: 1px solid #000; padding: 20px; text-align: center; color: #94a3b8;">尚無工作事項</td></tr>'}
          </tbody>
        </table>

        <h2>二、經費支出明細</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 50px;">序號</th>
              <th>預算科目</th>
              <th style="width: 100px;">經費來源</th>
              <th style="width: 120px;">支出金額</th>
              <th>支出說明</th>
            </tr>
          </thead>
          <tbody>
            ${expendituresHtml || '<tr><td colspan="5" style="border: 1px solid #000; padding: 20px; text-align: center; color: #94a3b8;">尚無支出項目</td></tr>'}
          </tbody>
        </table>
        <p class="total">本月申報總額：$${currentMonthTotal.toLocaleString()}</p>

        ${reportData.fanpageLinks && reportData.fanpageLinks.length > 0 ? `
          <h2>三、原村粉絲頁貼文連結</h2>
          <ul>
            ${reportData.fanpageLinks.map(link => `<li><a href="${link}">${link}</a></li>`).join('')}
          </ul>
        ` : ''}

        ${reportData.summary ? `
          <h2>四、備註</h2>
          <p>${reportData.summary}</p>
        ` : ''}
      </body>
      </html>
    `;

    // 建立 Blob 並下載
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `月報表_${selectedProject.name}_${reportData.month?.replace(/\s/g, '')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!selectedProject) return <div className="p-10 text-center text-gray-400 font-bold">計畫載入中...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
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
                alt="Preview"
              />
           </div>
        </div>
      )}

      {/* 頁首 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <FileText size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">月報填報</h1>
              <p className="text-blue-100 text-sm mt-1">系統已全面更新至 v1.1 (包含經費核銷與預算追蹤)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={exportToWord}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all flex items-center gap-2 text-sm font-bold"
              title="匯出 Word 檔案"
            >
              <FileDown size={20} /> 匯出 Word
            </button>
            <button onClick={onBack} className="p-3 hover:bg-white/20 rounded-xl transition-all">
              <ArrowLeft size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* 選擇專案與月份 + 本月申報總額 */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <div className="flex items-start justify-between gap-8">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-bold text-slate-500 w-24">選擇專案：</label>
              <select 
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                value={targetProjectId}
                onChange={(e) => setTargetProjectId(e.target.value)}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-bold text-slate-500 w-24">填報月份：</label>
              <input 
                type="month"
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                value={reportMonth.replace('年', '-').replace('月', '')}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-');
                  setReportMonth(`${year}年${month}月`);
                }}
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-400 mb-2">本月申報總額</p>
            <p className="text-5xl font-black text-blue-600">${currentMonthTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Tab 切換 */}
      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('current')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'current' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <FileText size={18} /> 當月填報
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Clock size={18} /> 歷史紀錄
        </button>
      </div>

      {activeTab === 'current' && (
        <>
          {/* 成果說明 */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                <FileText size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-800">成果說明</h2>
            </div>
            <textarea 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 min-h-[120px] outline-none font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="請摘要描述本月整體執行成果與重要事項..."
              value={reportData.summary || ''}
              onChange={(e) => setReportData(prev => ({ ...prev, summary: e.target.value }))}
            />
          </section>

          {/* 工作事項與支出明細 */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800">工作事項與支出明細</h2>
              {!isReadOnly && (
                <button 
                  onClick={addWorkItem}
                  className="px-5 py-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-bold text-sm hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                >
                  <Plus size={18} /> 新增工作事項
                </button>
              )}
            </div>

            {/* 工作事項列表 */}
            <div className="space-y-6">
              {reportData.workItems?.map((item, index) => {
                const selectedKR = allKeyResults.find(kr => kr.id === item.krId);
                return (
                  <div key={item.id} className="bg-slate-50 rounded-2xl p-6 space-y-5 border border-slate-100 relative">
                    {!isReadOnly && (
                      <button 
                        onClick={() => removeWorkItem(item.id)}
                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                      {/* 對應工作項目 (預算科目) - 下拉選單連動計畫書 KR */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">對應工作項目 (預算科目)</label>
                        <select 
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={item.krId}
                          onChange={(e) => updateWorkItem(item.id, 'krId', e.target.value)}
                        >
                          <option value="">請選擇預算科目</option>
                          {allKeyResults.map(kr => (
                            <option key={kr.id} value={kr.id}>
                              [{kr.objectiveTitle}] {kr.description} (目標: {kr.targetValue})
                            </option>
                          ))}
                        </select>
                        {selectedKR && (
                          <p className="text-xs text-blue-600 font-medium pl-1">
                            預定目標值：{selectedKR.targetValue} | 預計完成日：{selectedKR.expectedDate}
                          </p>
                        )}
                      </div>

                      {/* 當月達成數 */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">當月達成數</label>
                        <input 
                          type="number"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                          placeholder="0"
                          value={item.achievedValue || ''}
                          onChange={(e) => updateWorkItem(item.id, 'achievedValue', Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* 執行內容說明 */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">執行內容說明</label>
                      <textarea 
                        className="w-full bg-white border border-slate-200 rounded-xl p-4 min-h-[100px] outline-none font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        placeholder="請描述本月執行之具體內容..."
                        value={item.executionNote}
                        onChange={(e) => updateWorkItem(item.id, 'executionNote', e.target.value)}
                      />
                    </div>

                    {/* 上傳單據/附件 */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">上傳單據 / 附件</label>
                      <div className="flex flex-wrap gap-3">
                        {item.attachments?.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200 bg-white cursor-pointer hover:border-blue-400 transition-all">
                              <img src={url} className="w-full h-full object-cover" onClick={() => setPreviewImageUrl(url)} />
                            </div>
                            <button 
                              onClick={() => removeAttachment(item.id, idx)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => { setActiveUploadId(item.id); setUploadType('workItem'); fileInputRef.current?.click(); }}
                          className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all"
                        >
                          <Plus size={24} />
                          <span className="text-xs mt-1">新增</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {(!reportData.workItems || reportData.workItems.length === 0) && (
                <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Target size={48} className="mx-auto mb-4 text-slate-200" />
                  <p className="font-bold">尚未新增工作事項</p>
                  <p className="text-sm mt-1">點擊上方按鈕新增本月執行的工作項目</p>
                </div>
              )}
            </div>
          </section>

          {/* 預算執行 (支出明細) */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                  <DollarSign size={20} />
                </div>
                <h2 className="text-xl font-black text-slate-800">預算執行</h2>
              </div>
{!isReadOnly && (
                <button 
                  onClick={addExpenditure}
                  className="px-5 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl font-bold text-sm hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2"
                >
                  <Plus size={18} /> 新增支出項目
                </button>
              )}
            </div>

            {/* 人事費上限警示 */}
            {currentPersonnelSpent > personnelBudgetLimit * 0.8 && (
              <div className={`p-4 rounded-xl flex items-center gap-3 ${currentPersonnelSpent > personnelBudgetLimit ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                <AlertCircle size={20} className={currentPersonnelSpent > personnelBudgetLimit ? 'text-red-500' : 'text-amber-500'} />
                <div>
                  <p className={`font-bold ${currentPersonnelSpent > personnelBudgetLimit ? 'text-red-700' : 'text-amber-700'}`}>
                    {currentPersonnelSpent > personnelBudgetLimit ? '人事費已超過上限！' : '人事費即將達到上限'}
                  </p>
                  <p className="text-sm text-slate-600">
                    目前人事費支出：${currentPersonnelSpent.toLocaleString()} / 上限：${personnelBudgetLimit.toLocaleString()} (核定金額的 30%)
                  </p>
                </div>
              </div>
            )}

            {/* 支出明細列表 */}
            <div className="space-y-4">
              {reportData.expenditures?.map((exp) => {
                const budgetItem = selectedProject?.budgetItems.find(b => b.id === exp.budgetItemId);
                const remaining = getBudgetRemaining(exp.budgetItemId);
                const isOverBudget = exp.amount > remaining;
                
                return (
                  <div key={exp.id} className={`bg-slate-50 rounded-2xl p-6 space-y-5 border ${isOverBudget ? 'border-red-300 bg-red-50/30' : 'border-slate-100'} relative`}>
                    {!isReadOnly && (
                      <button 
                        onClick={() => removeExpenditure(exp.id)}
                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                      {/* 對應預算科目 - 下拉選單連動計畫書預算 */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">對應預算內容</label>
                        <select 
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={exp.budgetItemId}
                          onChange={(e) => updateExpenditure(exp.id, 'budgetItemId', e.target.value)}
                        >
                          <option value="">請選擇預算科目</option>
                          <optgroup label="人事費">
                            {selectedProject?.budgetItems.filter(b => b.category === BudgetCategory.PERSONNEL).map(b => (
                              <option key={b.id} value={b.id}>{b.name} (核定: ${b.totalPrice.toLocaleString()})</option>
                            ))}
                          </optgroup>
                          <optgroup label="業務費">
                            {selectedProject?.budgetItems.filter(b => b.category === BudgetCategory.OPERATING).map(b => (
                              <option key={b.id} value={b.id}>{b.name} (核定: ${b.totalPrice.toLocaleString()})</option>
                            ))}
                          </optgroup>
                          <optgroup label="雜支">
                            {selectedProject?.budgetItems.filter(b => b.category === BudgetCategory.MISCELLANEOUS).map(b => (
                              <option key={b.id} value={b.id}>{b.name} (核定: ${b.totalPrice.toLocaleString()})</option>
                            ))}
                          </optgroup>
                        </select>
                        {budgetItem && (
                          <p className={`text-xs font-medium pl-1 ${isOverBudget ? 'text-red-600' : 'text-emerald-600'}`}>
                            剩餘餘額：${remaining.toLocaleString()} {isOverBudget && '(超支！)'}
                          </p>
                        )}
                      </div>

                      {/* 經費來源 */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">經費來源</label>
                        <select 
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={exp.fundingSource}
                          onChange={(e) => updateExpenditure(exp.id, 'fundingSource', e.target.value as FundingSource)}
                        >
                          <option value={FundingSource.SUBSIDY}>補助款</option>
                          <option value={FundingSource.SELF_FUNDED}>自籌款</option>
                        </select>
                      </div>

                      {/* 本月支出金額 */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">本月支出金額</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                          <input 
                            type="number"
                            className={`w-full bg-white border rounded-xl pl-8 pr-4 py-3 font-bold outline-none focus:ring-2 focus:ring-blue-500/20 ${isOverBudget ? 'border-red-300 text-red-600' : 'border-slate-200 text-slate-700'}`}
                            placeholder="0"
                            value={exp.amount || ''}
                            onChange={(e) => updateExpenditure(exp.id, 'amount', Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 支出說明 */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">支出說明</label>
                      <input 
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="請簡述支出用途..."
                        value={exp.description}
                        onChange={(e) => updateExpenditure(exp.id, 'description', e.target.value)}
                      />
                    </div>

                    {/* 上傳憑證 */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">上傳憑證 / 發票</label>
                      <div className="flex flex-wrap gap-3">
                        {exp.receiptUrls?.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-emerald-200 bg-white cursor-pointer hover:border-emerald-400 transition-all">
                              <img src={url} className="w-full h-full object-cover" onClick={() => setPreviewImageUrl(url)} />
                            </div>
                            <button 
                              onClick={() => removeReceiptUrl(exp.id, idx)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => { setActiveUploadId(exp.id); setUploadType('expenditure'); fileInputRef.current?.click(); }}
                          className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-all"
                        >
                          <Plus size={24} />
                          <span className="text-xs mt-1">新增</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {(!reportData.expenditures || reportData.expenditures.length === 0) && (
                <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                  <DollarSign size={48} className="mx-auto mb-4 text-slate-200" />
                  <p className="font-bold">尚未新增支出項目</p>
                  <p className="text-sm mt-1">點擊上方按鈕新增本月的支出明細</p>
                </div>
              )}
            </div>
          </section>

          {/* 原村粉絲頁上傳紀錄 */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                  <Link2 size={20} />
                </div>
                <h2 className="text-xl font-black text-slate-800">原村粉絲頁上傳紀錄</h2>
              </div>
{!isReadOnly && (
                <button 
                  onClick={() => {
                    setReportData(prev => ({
                      ...prev,
                      fanpageLinks: [...(prev.fanpageLinks || []), '']
                    }));
                  }}
                  className="px-5 py-2.5 bg-purple-50 text-purple-600 border border-purple-100 rounded-xl font-bold text-sm hover:bg-purple-600 hover:text-white transition-all flex items-center gap-2"
                >
                  <Plus size={18} /> 新增貼文連結
                </button>
              )}
            </div>

            <div className="space-y-3">
              {reportData.fanpageLinks?.map((link, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-500">
                    <Link2 size={18} />
                  </div>
                  <input 
                    type="url"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20"
                    placeholder="請貼上原村粉絲頁貼文連結 (https://www.facebook.com/...)"
                    value={link}
                    onChange={(e) => {
                      const newLinks = [...(reportData.fanpageLinks || [])];
                      newLinks[index] = e.target.value;
                      setReportData(prev => ({ ...prev, fanpageLinks: newLinks }));
                    }}
                  />
                  {link && (
                    <a 
                      href={link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
{!isReadOnly && (
                    <button 
                      onClick={() => {
                        const newLinks = reportData.fanpageLinks?.filter((_, i) => i !== index) || [];
                        setReportData(prev => ({ ...prev, fanpageLinks: newLinks }));
                      }}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}

              {(!reportData.fanpageLinks || reportData.fanpageLinks.length === 0) && (
                <div className="py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                  <Link2 size={36} className="mx-auto mb-3 text-slate-200" />
                  <p className="font-bold text-sm">尚未新增粉絲頁貼文連結</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {activeTab === 'history' && (
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
              <Clock size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-800">提交歷史紀錄</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left rounded-l-xl">日份</th>
                  <th className="px-6 py-4 text-left">專案名稱</th>
                  <th className="px-6 py-4 text-left">申報金額</th>
                  <th className="px-6 py-4 text-left">提交時間</th>
                  <th className="px-6 py-4 text-center rounded-r-xl">狀態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allReports.filter(r => r.projectId === targetProjectId).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      尚無歷史紀錄
                    </td>
                  </tr>
                ) : (
                  allReports.filter(r => r.projectId === targetProjectId).map(report => {
                    const total = report.expenditures?.reduce((sum, e) => sum + e.amount, 0) || 0;
                    return (
                      <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{report.month}</td>
                        <td className="px-6 py-4 text-slate-600">{selectedProject?.name}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600">${total.toLocaleString()}</td>
                        <td className="px-6 py-4 text-slate-500">{report.submittedAt || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                            已提交
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileSelect} 
        accept="image/*,application/pdf" 
        multiple
      />

      {/* 底部提交按鈕 - 唯讀模式下隱藏 */}
      {!isReadOnly && (
        <div className="fixed bottom-8 right-8 z-40 flex gap-4">
          <button 
            onClick={() => {
              // 儲存草稿
              console.log('儲存草稿', reportData);
            }}
            className="px-8 py-4 bg-white text-slate-700 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 border border-slate-200"
          >
            <Save size={20} /> 儲存草稿
          </button>
          <button 
            onClick={() => {
              const finalReport: MonthlyReport = {
                ...reportData as MonthlyReport,
                submittedAt: new Date().toLocaleString('zh-TW')
              };
              onSaveReport(finalReport);
            }}
            className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all flex items-center gap-2"
          >
            <CheckCircle2 size={20} /> 提交月報
          </button>
        </div>
      )}

      {/* 唯讀模式提示 */}
      {isReadOnly && (
        <div className="fixed bottom-8 right-8 z-40">
          <div className="px-6 py-3 bg-amber-100 text-amber-800 rounded-2xl font-bold shadow-lg flex items-center gap-2 border border-amber-200">
            <Eye size={20} /> 唯讀模式 - 僅供閱覽
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectExecutionControl;
