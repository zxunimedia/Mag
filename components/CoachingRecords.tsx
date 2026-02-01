
import React, { useState, useRef } from 'react';
import { Project, CoachingRecord, UserRole, KRStatus, VisitRow, AssessmentResult } from '../types';
import { Plus, X, Calendar, Camera, Trash2, MessageSquare, Save, Pencil, Upload, FileCheck, Info, ChevronRight, AlertTriangle } from 'lucide-react';

interface CoachingRecordsProps {
  projects: Project[];
  coachingRecords: CoachingRecord[];
  onSaveRecord: (record: CoachingRecord) => void;
  onDeleteRecord?: (recordId: string) => void;
  currentUserRole: UserRole;
  currentUserUnitId?: string;  // 操作人員的單位 ID，用於過濾可見紀錄
}

const CoachingRecords: React.FC<CoachingRecordsProps> = ({ projects, coachingRecords, onSaveRecord, onDeleteRecord, currentUserRole, currentUserUnitId }) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  // 操作人員只能看到自己單位的計畫
  const visibleProjects = currentUserRole === UserRole.ADMIN 
    ? projects 
    : projects.filter(p => p.unitId === currentUserUnitId);
  const [selectedProjectId, setSelectedProjectId] = useState(visibleProjects[0]?.id || '');
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<CoachingRecord> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isAdmin = currentUserRole === UserRole.ADMIN;
  const selectedProject = visibleProjects.find(p => p.id === selectedProjectId);
  const filteredRecords = coachingRecords.filter(r => r.projectId === selectedProjectId);

  const initAssessment = (): AssessmentResult => ({ status: KRStatus.ON_TRACK, strategy: '' });
  const initVisitRow = (id: string, workItem: string = ''): VisitRow => ({ id, workItem, opinion: '', status: KRStatus.ON_TRACK, strategy: '' });

  const handleOpenNew = () => {
    if (!isAdmin) return;
    // 使用計畫編號生成序號，格式：計畫編號-流水號
    const projectCode = selectedProject?.projectCode || selectedProjectId;
    const serial = `${projectCode}-${(filteredRecords.length + 1).toString().padStart(3, '0')}`;
    
    // 從計畫的願景中取得所有關鍵結果作為工作項目
    const keyResults: VisitRow[] = [];
    if (selectedProject?.visions) {
      selectedProject.visions.forEach(vision => {
        vision.objectives.forEach(obj => {
          obj.keyResults.forEach(kr => {
            keyResults.push(initVisitRow(kr.id, kr.description));
          });
        });
      });
    }
    // 如果沒有關鍵結果，預設兩個空白項目
    const visitContents = keyResults.length > 0 ? keyResults : [initVisitRow('1'), initVisitRow('2')];
    
    setEditingRecord({
      id: `cr-${Date.now()}`,
      projectId: selectedProjectId,
      serialNumber: serial,
      location: '',
      frequency: (filteredRecords.length + 1).toString(),
      method: '實地訪視',
      writer: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '12:00',
      attendees: { commissioners: false, staff: false, representatives: false, liaison: false, others: '' },
      overallResults: { progress: initAssessment(), content: initAssessment(), records: initAssessment(), vouchers: initAssessment() },
      visitContents: visitContents,
      communityMobilization: initVisitRow('cm', '全計畫捲動在地社區/部落參與人數'),
      communityConnection: initVisitRow('cc', '全計畫串連社群個數'),
      photos: [],
    });
    setShowModal(true);
  };

  const handleOpenEdit = (record: CoachingRecord) => {
    // 允許所有人編輯輔導紀錄
    setEditingRecord({...record});
    setShowModal(true);
  };

  const updateVisitContent = (id: string, field: keyof VisitRow, value: any) => {
    if (!editingRecord) return;
    const next = editingRecord.visitContents?.map(row => row.id === id ? { ...row, [field]: value } : row);
    setEditingRecord({ ...editingRecord, visitContents: next });
  };

  const handleSave = () => {
    if (editingRecord) {
      onSaveRecord(editingRecord as CoachingRecord);
      setShowModal(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500 px-4">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-10">
           <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <div className="p-3 bg-amber-500 text-white rounded-2xl">
                 <Calendar size={28} />
              </div>
              訪視輔導與管考紀錄
           </h2>
           <div className="flex gap-4">
              <select 
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 font-black text-slate-800 outline-none shadow-sm"
              >
                {visibleProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {isAdmin && (
                <button onClick={handleOpenNew} className="px-8 py-3 bg-[#2D3E50] text-white rounded-2xl font-black shadow-lg hover:bg-slate-700 transition-all flex items-center gap-2">
                  <Plus size={20} /> 新增紀錄表
                </button>
              )}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((record) => (
            <div key={record.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all p-6 group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 -mr-16 -mt-16 rounded-full group-hover:bg-amber-50 transition-colors" />
               <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">{record.serialNumber}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => handleOpenEdit(record)} className="p-2 text-blue-500 bg-blue-50 rounded-xl hover:bg-blue-100" title="編輯紀錄"><Pencil size={18} /></button>
                       {currentUserRole === UserRole.ADMIN && onDeleteRecord && (
                         deleteConfirm === record.id ? (
                           <div className="flex items-center gap-1">
                             <button onClick={() => { onDeleteRecord(record.id); setDeleteConfirm(null); }} className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600">確認</button>
                             <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded hover:bg-gray-300">取消</button>
                           </div>
                         ) : (
                           <button onClick={() => setDeleteConfirm(record.id)} className="p-2 text-red-400 bg-red-50 rounded-xl hover:bg-red-100" title="刪除紀錄"><Trash2 size={18} /></button>
                         )
                       )}
                    </div>
                  </div>
                  <h4 className="text-lg font-black text-slate-800 truncate">{selectedProject?.name}</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-500 pt-2">
                     <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-300" /> {record.date}</div>
                     <div className="flex items-center gap-2 text-amber-600"><Info size={14} /> 第 {record.frequency} 次訪視</div>
                  </div>
                  <button onClick={() => handleOpenEdit(record)} className="w-full py-3 bg-slate-50 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                    查看詳情 <ChevronRight size={16} />
                  </button>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* 復刻截圖的表格編輯 Modal */}
      {showModal && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="px-10 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">訪視輔導與管考紀錄表格式</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full text-slate-400 shadow-sm transition-all"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 bg-slate-100/30">
              <div className="bg-white border-2 border-slate-300 shadow-xl overflow-hidden max-w-4xl mx-auto">
                 <table className="w-full border-collapse border-slate-300 text-sm font-bold">
                    <tbody>
                       {/* 表格標題 */}
                       <tr>
                          <td colSpan={6} className="text-center py-4 bg-white border-b-2 border-slate-300 text-2xl font-black tracking-[0.2em] text-slate-700">訪視輔導與管考紀錄表格式</td>
                       </tr>
                       {/* 單位名稱 & 計畫名稱 */}
                       <tr>
                          <td className="record-header w-32">受輔導單位</td>
                          <td className="record-cell">{selectedProject?.executingUnit}</td>
                          <td className="record-header w-32">計畫名稱</td>
                          <td colSpan={3} className="record-cell">{selectedProject?.name}</td>
                       </tr>
                       {/* 輔導地點 & 輔導次數 */}
                       <tr>
                          <td className="record-header">輔導地點</td>
                          <td className="record-cell">
                             <input type="text" className="record-input" value={editingRecord.location} onChange={e => setEditingRecord({...editingRecord, location: e.target.value})} placeholder="請填寫地點..." />
                          </td>
                          <td className="record-header">輔導次數</td>
                          <td colSpan={3} className="record-cell">第 <input type="text" className="inline-input w-12" value={editingRecord.frequency} onChange={e => setEditingRecord({...editingRecord, frequency: e.target.value})} /> 次</td>
                       </tr>
                       {/* 輔導方式 & 填寫人 */}
                       <tr>
                          <td className="record-header">輔導方式</td>
                          <td className="record-cell">
                             <div className="flex gap-4">
                                {['實地訪視', '視訊', '電話', '其他'].map(m => (
                                   <label key={m} className="flex items-center gap-1 cursor-pointer">
                                      <input type="radio" checked={editingRecord.method === m} onChange={() => setEditingRecord({...editingRecord, method: m as any})} /> {m}
                                   </label>
                                ))}
                             </div>
                          </td>
                          <td className="record-header">填寫人</td>
                          <td colSpan={3} className="record-cell">
                             <input type="text" className="record-input" value={editingRecord.writer} onChange={e => setEditingRecord({...editingRecord, writer: e.target.value})} />
                          </td>
                       </tr>
                       {/* 輔導日期 & 輔導時間 */}
                       <tr>
                          <td className="record-header">輔導日期</td>
                          <td className="record-cell">
                             <input type="date" className="record-input" value={editingRecord.date} onChange={e => setEditingRecord({...editingRecord, date: e.target.value})} />
                          </td>
                          <td className="record-header">輔導時間</td>
                          <td colSpan={3} className="record-cell">
                             <input type="time" className="inline-input" value={editingRecord.startTime} onChange={e => setEditingRecord({...editingRecord, startTime: e.target.value})} /> 
                             至 
                             <input type="time" className="inline-input" value={editingRecord.endTime} onChange={e => setEditingRecord({...editingRecord, endTime: e.target.value})} />
                          </td>
                       </tr>
                       {/* 出席人員 */}
                       <tr>
                          <td className="record-header">出席人員</td>
                          <td colSpan={5} className="record-cell space-y-2">
                             <AttendeeRow label="輔導委員" name={selectedProject?.commissioner.name} checked={editingRecord.attendees?.commissioners} onChange={() => setEditingRecord({...editingRecord, attendees: {...editingRecord.attendees!, commissioners: !editingRecord.attendees?.commissioners}})} />
                             <AttendeeRow label="主責人員" name={selectedProject?.chiefStaff.name} checked={editingRecord.attendees?.staff} onChange={() => setEditingRecord({...editingRecord, attendees: {...editingRecord.attendees!, staff: !editingRecord.attendees?.staff}})} />
                             <AttendeeRow label="計畫代表人" name={selectedProject?.representative.name} checked={editingRecord.attendees?.representatives} onChange={() => setEditingRecord({...editingRecord, attendees: {...editingRecord.attendees!, representatives: !editingRecord.attendees?.representatives}})} />
                             <AttendeeRow label="計畫聯絡人" name={selectedProject?.liaison.name} checked={editingRecord.attendees?.liaison} onChange={() => setEditingRecord({...editingRecord, attendees: {...editingRecord.attendees!, liaison: !editingRecord.attendees?.liaison}})} />
                             <div className="flex items-center gap-2">
                                <span className="w-4 h-4 border border-slate-400" /> 其他人員：
                                <input type="text" className="border-b border-slate-300 outline-none w-1/2" value={editingRecord.attendees?.others} onChange={e => setEditingRecord({...editingRecord, attendees: {...editingRecord.attendees!, others: e.target.value}})} />
                             </div>
                          </td>
                       </tr>
                       {/* 整體訪視結果 */}
                       <tr>
                          <td className="record-header">整體訪視結果</td>
                          <td colSpan={5} className="record-cell p-0">
                             <table className="w-full border-collapse">
                                <tbody className="divide-y border-slate-200">
                                   <ResultRow label="1. 計畫執行進度" result={editingRecord.overallResults?.progress} onChange={(r) => setEditingRecord({...editingRecord, overallResults: {...editingRecord.overallResults!, progress: r}})} />
                                   <ResultRow label="2. 計畫執行內容" result={editingRecord.overallResults?.content} onChange={(r) => setEditingRecord({...editingRecord, overallResults: {...editingRecord.overallResults!, content: r}})} />
                                   <ResultRow label="3. 執行紀錄完善" result={editingRecord.overallResults?.records} onChange={(r) => setEditingRecord({...editingRecord, overallResults: {...editingRecord.overallResults!, records: r}})} />
                                   <ResultRow label="4. 核銷憑證完備" result={editingRecord.overallResults?.vouchers} onChange={(r) => setEditingRecord({...editingRecord, overallResults: {...editingRecord.overallResults!, vouchers: r}})} />
                                </tbody>
                             </table>
                          </td>
                       </tr>
                       {/* 訪視重點 - 新增欄位 */}
                       <tr>
                          <td className="record-header">訪視重點</td>
                          <td colSpan={5} className="record-cell">
                             <textarea 
                               className="record-input min-h-[100px]" 
                               value={editingRecord.keyPoints || ''} 
                               onChange={e => setEditingRecord({...editingRecord, keyPoints: e.target.value})} 
                               placeholder="請輸入本次訪視的重點事項..."
                             />
                          </td>
                       </tr>
                       {/* 訪視內容 */}
                       <tr>
                          <td className="record-header">訪視內容</td>
                          <td colSpan={5} className="record-cell p-0">
                             <table className="w-full border-collapse text-center">
                                <thead>
                                   <tr className="bg-slate-50 border-b border-slate-300">
                                      <th className="px-4 py-2 border-r border-slate-300 w-1/4">工作項目</th>
                                      <th className="px-4 py-2 border-r border-slate-300">訪視意見</th>
                                      <th className="px-4 py-2 w-1/4">進度總結</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y border-slate-200">
                                   {editingRecord.visitContents?.map((row, idx) => (
                                      <tr key={row.id}>
                                         <td className="border-r border-slate-300 p-2">
                                            <input type="text" className="record-input text-center" value={row.workItem} onChange={e => updateVisitContent(row.id, 'workItem', e.target.value)} placeholder={`項目 ${idx+1}`} />
                                         </td>
                                         <td className="border-r border-slate-300 p-2">
                                            <textarea className="record-input min-h-[60px]" value={row.opinion} onChange={e => updateVisitContent(row.id, 'opinion', e.target.value)} />
                                         </td>
                                         <td className="p-2">
                                            <StatusPicker row={row} onChange={(f, v) => updateVisitContent(row.id, f as any, v)} />
                                         </td>
                                      </tr>
                                   ))}
                                   {/* 固定項 1 */}
                                   <tr>
                                      <td className="border-r border-slate-300 p-4 bg-slate-50 font-black">全計畫捲動在地社區/部落參與人數</td>
                                      <td className="border-r border-slate-300 p-2">
                                         <textarea className="record-input" value={editingRecord.communityMobilization?.opinion} onChange={e => setEditingRecord({...editingRecord, communityMobilization: {...editingRecord.communityMobilization!, opinion: e.target.value}})} />
                                      </td>
                                      <td className="p-2">
                                         <StatusPicker row={editingRecord.communityMobilization!} onChange={(f, v) => setEditingRecord({...editingRecord, communityMobilization: {...editingRecord.communityMobilization!, [f]: v}})} />
                                      </td>
                                   </tr>
                                   {/* 固定項 2 */}
                                   <tr>
                                      <td className="border-r border-slate-300 p-4 bg-slate-50 font-black">全計畫串連社群個數</td>
                                      <td className="border-r border-slate-300 p-2">
                                         <textarea className="record-input" value={editingRecord.communityConnection?.opinion} onChange={e => setEditingRecord({...editingRecord, communityConnection: {...editingRecord.communityConnection!, opinion: e.target.value}})} />
                                      </td>
                                      <td className="p-2">
                                         <StatusPicker row={editingRecord.communityConnection!} onChange={(f, v) => setEditingRecord({...editingRecord, communityConnection: {...editingRecord.communityConnection!, [f]: v}})} />
                                      </td>
                                   </tr>
                                </tbody>
                             </table>
                          </td>
                       </tr>
                       {/* 訪視照片 */}
                       <tr>
                          <td className="record-header">訪視照片</td>
                          <td colSpan={5} className="record-cell min-h-[200px]">
                             <div className="flex flex-col items-center justify-center gap-4 py-6 text-slate-400">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full px-4">
                                   {[0, 1, 2, 3].map(i => (
                                      <div key={i} className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-blue-400 transition-all">
                                         {editingRecord.photos?.[i] ? (
                                            <>
                                              <img src={editingRecord.photos[i]} className="w-full h-full object-cover" alt={`訪視照片 ${i+1}`} />
                                              <button 
                                                onClick={() => {
                                                  const newPhotos = [...(editingRecord.photos || [])];
                                                  newPhotos.splice(i, 1);
                                                  setEditingRecord({...editingRecord, photos: newPhotos});
                                                }}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                              >
                                                <X size={14} />
                                              </button>
                                            </>
                                         ) : (
                                            <label className="cursor-pointer flex flex-col items-center gap-2 p-4">
                                              <Camera size={28} className="text-slate-300" />
                                              <span className="text-xs font-bold text-slate-400">照片 {i+1}</span>
                                              <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (ev) => {
                                                      const newPhotos = [...(editingRecord.photos || [])];
                                                      newPhotos[i] = ev.target?.result as string;
                                                      setEditingRecord({...editingRecord, photos: newPhotos});
                                                    };
                                                    reader.readAsDataURL(file);
                                                  }
                                                }}
                                              />
                                            </label>
                                         )}
                                      </div>
                                   ))}
                                </div>
                                <p className="text-xs font-black text-amber-600 flex items-center gap-2">
                                  <AlertTriangle size={14} /> 至少上傳四張照片
                                </p>
                             </div>
                          </td>
                       </tr>
                       {/* 操作人員意見回應 */}
                       <tr>
                          <td className="record-header" colSpan={2}>操作人員意見回應</td>
                          <td className="record-cell" colSpan={4}>
                             <textarea 
                                className="w-full min-h-[100px] bg-amber-50/50 border border-amber-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                                placeholder="請操作人員填寫對此次輔導紀錄的意見回應..."
                                value={editingRecord.operatorFeedback || ''}
                                onChange={e => setEditingRecord({...editingRecord, operatorFeedback: e.target.value})}
                             />
                          </td>
                       </tr>
                    </tbody>
                 </table>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-white flex gap-4">
               <div className="flex-1 flex items-center gap-4">
                  <button className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-black">
                     <Upload size={18} /> 上傳附件備份 (掃描檔)
                  </button>
               </div>
               <button 
                onClick={handleSave}
                className="px-12 py-4 bg-blue-700 text-white rounded-2xl font-black shadow-xl hover:bg-blue-800 transition-all flex items-center gap-3"
              >
                <Save size={20} /> 確認儲存填報紀錄
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .record-header {
           @apply bg-slate-200/50 p-4 border border-slate-300 font-black text-slate-700 text-center;
        }
        .record-cell {
           @apply p-4 border border-slate-300 font-bold text-slate-800;
        }
        .record-input {
           @apply w-full bg-transparent border-none outline-none font-bold text-slate-800 focus:bg-amber-50/50 p-1;
        }
        .inline-input {
           @apply bg-transparent border-b border-slate-300 outline-none text-center px-1 font-mono;
        }
      `}</style>
    </div>
  );
};

const AttendeeRow = ({ label, name, checked, onChange }: any) => (
   <div className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4" /> 
      {label}：({checked ? <span className="text-blue-600">{name}</span> : '自動帶入'})
   </div>
);

const ResultRow = ({ label, result, onChange }: { label: string, result: AssessmentResult, onChange: (r: AssessmentResult) => void }) => (
   <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="p-4 font-black text-slate-600 w-1/3">{label}：</td>
      <td className="p-4">
         <div className="flex flex-col gap-3">
            <div className="flex gap-6">
               {[KRStatus.AHEAD, KRStatus.ON_TRACK, KRStatus.DELAYED].map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                     <input type="radio" checked={result.status === s} onChange={() => onChange({...result, status: s})} /> {s}
                  </label>
               ))}
            </div>
            {result.status === KRStatus.DELAYED && (
               <div className="flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-100">
                  <span className="text-[10px] font-black text-red-600 whitespace-nowrap">改進策略：</span>
                  <input type="text" className="w-full bg-transparent border-none outline-none text-xs font-bold" value={result.strategy} onChange={e => onChange({...result, strategy: e.target.value})} placeholder="請輸入改善方針..." />
               </div>
            )}
         </div>
      </td>
   </tr>
);

const StatusPicker = ({ row, onChange }: { row: VisitRow, onChange: (field: string, val: any) => void }) => (
   <div className="space-y-3 text-xs text-left">
      <div className="flex flex-wrap gap-2">
         {[KRStatus.AHEAD, KRStatus.ON_TRACK, KRStatus.DELAYED].map(s => (
            <label key={s} className="flex items-center gap-1 cursor-pointer">
               <input type="radio" checked={row.status === s} onChange={() => onChange('status', s)} /> {s}
            </label>
         ))}
      </div>
      {row.status === KRStatus.DELAYED && (
         <div className="space-y-1">
            <p className="font-black text-red-500">改進策略：</p>
            <textarea className="w-full border border-red-200 rounded p-1 outline-none font-bold" value={row.strategy} onChange={e => onChange('strategy', e.target.value)} />
         </div>
      )}
   </div>
);

export default CoachingRecords;
