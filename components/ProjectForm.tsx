
import React, { useState } from 'react';
import { Project, Objective, ProjectStatus, KRStatus, KeyResult, ContactInfo, GrantStage, GrantDocStatus, BudgetItem, BudgetCategory } from '../types';
import { Plus, Trash2, Save, ArrowLeft, PlusCircle, MinusCircle, UserCircle, LayoutGrid, Clock, Target, Eye, Calculator, List, MapPin, Building, Phone, Mail, DollarSign, Users } from 'lucide-react';

interface ProjectFormProps {
  project?: Project;
  onBack: () => void;
  onSave: (project: Partial<Project>) => void;
}

const emptyContact = (): ContactInfo => ({ name: '', title: '', phone: '', mobile: '', email: '' });

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onBack, onSave }) => {
  const [formData, setFormData] = useState<Partial<Project>>(project || {
    id: `P${Date.now()}`,
    year: '115',
    status: ProjectStatus.PLANNING,
    representative: emptyContact(),
    liaison: emptyContact(),
    chiefStaff: emptyContact(),
    commissioner: emptyContact(),
    legalAddress: '',
    contactAddress: '',
    siteType: '原鄉',
    sites: [''],
    appliedAmount: 0,
    approvedAmount: 0,
    vision: '',
    grants: [],
    objectives: [],
    budgetItems: []
  });

  // 聯絡人更新
  const updateContact = (field: 'representative' | 'liaison' | 'commissioner' | 'chiefStaff', key: keyof ContactInfo, value: string) => {
    setFormData({
      ...formData,
      [field]: { ...(formData[field] as ContactInfo), [key]: value }
    });
  };

  // 實施地點操作
  const addSite = () => {
    setFormData({ ...formData, sites: [...(formData.sites || []), ''] });
  };

  const updateSite = (index: number, value: string) => {
    const newSites = [...(formData.sites || [])];
    newSites[index] = value;
    setFormData({ ...formData, sites: newSites });
  };

  const removeSite = (index: number) => {
    const newSites = (formData.sites || []).filter((_, i) => i !== index);
    setFormData({ ...formData, sites: newSites.length > 0 ? newSites : [''] });
  };

  // 預算操作邏輯
  const addBudgetItem = () => {
    const newItem: BudgetItem = {
      id: `bi-${Date.now()}`,
      category: BudgetCategory.OPERATING,
      name: '',
      quantity: 1,
      unit: '',
      unitPrice: 0,
      totalPrice: 0,
      description: ''
    };
    setFormData({ ...formData, budgetItems: [...(formData.budgetItems || []), newItem] });
  };

  const updateBudgetItem = (id: string, field: keyof BudgetItem, value: any) => {
    const nextItems = formData.budgetItems?.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.totalPrice = (updated.quantity || 0) * (updated.unitPrice || 0);
        }
        return updated;
      }
      return item;
    });
    setFormData({ ...formData, budgetItems: nextItems });
  };

  // 撥付截止日期邏輯
  const updateGrantDeadline = (idx: number, deadline: string) => {
    const nextGrants = [...(formData.grants || [])];
    if (!nextGrants[idx]) {
      nextGrants[idx] = { stage: `第 ${idx + 1} 期撥款`, documents: [], mocFinalCheck: '—' as any, deadline };
    } else {
      nextGrants[idx] = { ...nextGrants[idx], deadline };
    }
    setFormData({ ...formData, grants: nextGrants });
  };

  // 目標操作
  const addObjective = () => {
    const newObj: Objective = {
      id: `obj-${Date.now()}`,
      title: '',
      weight: 0,
      keyResults: []
    };
    setFormData({ ...formData, objectives: [...(formData.objectives || []), newObj] });
  };

  const updateObjective = (objId: string, field: keyof Objective, value: any) => {
    setFormData({
      ...formData,
      objectives: formData.objectives?.map(o => o.id === objId ? { ...o, [field]: value } : o)
    });
  };

  const removeObjective = (objId: string) => {
    setFormData({ ...formData, objectives: formData.objectives?.filter(o => o.id !== objId) });
  };

  // 關鍵結果操作
  const addKeyResult = (objId: string) => {
    const newKR: KeyResult = {
      id: `kr-${Date.now()}`,
      description: '',
      targetValue: 1,
      expectedDate: '',
      budgetAmount: 0,
      actualAmount: 0
    };
    setFormData({
      ...formData,
      objectives: formData.objectives?.map(o => 
        o.id === objId ? { ...o, keyResults: [...o.keyResults, newKR] } : o
      )
    });
  };

  const updateKeyResult = (objId: string, krId: string, field: keyof KeyResult, value: any) => {
    setFormData({
      ...formData,
      objectives: formData.objectives?.map(o => 
        o.id === objId ? {
          ...o,
          keyResults: o.keyResults.map(kr => kr.id === krId ? { ...kr, [field]: value } : kr)
        } : o
      )
    });
  };

  const removeKeyResult = (objId: string, krId: string) => {
    setFormData({
      ...formData,
      objectives: formData.objectives?.map(o => 
        o.id === objId ? { ...o, keyResults: o.keyResults.filter(kr => kr.id !== krId) } : o
      )
    });
  };

  // 聯絡人輸入區塊組件
  const ContactSection = ({ title, field, icon: Icon }: { title: string; field: 'representative' | 'liaison' | 'commissioner' | 'chiefStaff'; icon: any }) => {
    const contact = formData[field] as ContactInfo;
    return (
      <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-4">
        <div className="flex items-center gap-3 text-slate-700 font-black">
          <Icon size={20} className="text-blue-500" />
          {title}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <input type="text" placeholder="姓名" className="form-input" value={contact?.name || ''} onChange={e => updateContact(field, 'name', e.target.value)} />
          <input type="text" placeholder="職稱" className="form-input" value={contact?.title || ''} onChange={e => updateContact(field, 'title', e.target.value)} />
          <input type="text" placeholder="電話" className="form-input" value={contact?.phone || ''} onChange={e => updateContact(field, 'phone', e.target.value)} />
          <input type="text" placeholder="手機" className="form-input" value={contact?.mobile || ''} onChange={e => updateContact(field, 'mobile', e.target.value)} />
          <input type="email" placeholder="Email" className="form-input" value={contact?.email || ''} onChange={e => updateContact(field, 'email', e.target.value)} />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <style>{`
        .form-input {
          @apply w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-300 transition-all;
        }
        .section-header {
          @apply bg-[#1a1a1a] p-8 flex items-center gap-4 text-white;
        }
        .section-icon {
          @apply w-10 h-10 bg-[#FFC107] rounded-full flex items-center justify-center text-black shadow-lg shadow-amber-500/20;
        }
      `}</style>

      <div className="flex items-center justify-between sticky top-0 bg-[#f8fafc]/90 backdrop-blur-md py-4 z-20 px-2 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white rounded-full shadow-sm text-gray-400">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">計畫基本資料與預算編列</h2>
        </div>
        <button 
          onClick={() => onSave(formData)}
          className="px-12 py-3.5 bg-[#2D3E50] text-white rounded-2xl font-black hover:bg-slate-700 shadow-xl flex items-center gap-2 transition-all"
        >
          <Save size={18} /> 儲存變更
        </button>
      </div>

      <div className="space-y-10">
        {/* 1. 計畫基本資料 */}
        <section className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="section-header">
            <div className="section-icon"><Building size={24} /></div>
            <h3 className="text-2xl font-black tracking-tight">計畫基本資料</h3>
          </div>
          <div className="p-10 space-y-8">
            {/* 計畫代表人 */}
            <ContactSection title="計畫代表人" field="representative" icon={UserCircle} />
            
            {/* 計畫聯絡人 */}
            <ContactSection title="計畫聯絡人" field="liaison" icon={Users} />

            {/* 地址資訊 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">立案地址</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="請輸入立案地址..."
                  value={formData.legalAddress || ''}
                  onChange={e => setFormData({ ...formData, legalAddress: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">聯絡地址</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="請輸入聯絡地址..."
                  value={formData.contactAddress || ''}
                  onChange={e => setFormData({ ...formData, contactAddress: e.target.value })}
                />
              </div>
            </div>

            {/* 實施地點 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-500" /> 實施地點
                </label>
                <button onClick={addSite} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black hover:bg-emerald-100 flex items-center gap-1">
                  <Plus size={14} /> 新增地點
                </button>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm font-bold text-slate-600">類型：</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={formData.siteType === '原鄉'} onChange={() => setFormData({ ...formData, siteType: '原鄉' })} />
                  <span className="font-bold">原鄉</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={formData.siteType === '都市'} onChange={() => setFormData({ ...formData, siteType: '都市' })} />
                  <span className="font-bold">都市</span>
                </label>
              </div>
              <div className="space-y-3">
                {(formData.sites || ['']).map((site, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-xs font-black">{idx + 1}</span>
                    <input 
                      type="text" 
                      className="form-input flex-1"
                      placeholder={`請輸入${formData.siteType === '原鄉' ? '原鄉' : '都市'}地點...`}
                      value={site}
                      onChange={e => updateSite(idx, e.target.value)}
                    />
                    {(formData.sites?.length || 0) > 1 && (
                      <button onClick={() => removeSite(idx)} className="p-2 text-red-300 hover:text-red-500">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 金額資訊 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-3">
                <label className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <DollarSign size={16} /> 申請金額
                </label>
                <input 
                  type="number" 
                  className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-2xl font-black text-blue-600 outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={formData.appliedAmount || 0}
                  onChange={e => setFormData({ ...formData, appliedAmount: Number(e.target.value) })}
                />
              </div>
              <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 space-y-3">
                <label className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                  <DollarSign size={16} /> 核定金額
                </label>
                <input 
                  type="number" 
                  className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 text-2xl font-black text-emerald-600 outline-none focus:ring-4 focus:ring-emerald-500/10"
                  value={formData.approvedAmount || 0}
                  onChange={e => setFormData({ ...formData, approvedAmount: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* 輔導委員 */}
            <ContactSection title="輔導委員" field="commissioner" icon={UserCircle} />
            
            {/* 主責人員 */}
            <ContactSection title="主責人員" field="chiefStaff" icon={UserCircle} />
          </div>
        </section>

        {/* 2. 計畫願景 (Vision) */}
        <section className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="section-header">
            <div className="section-icon"><Eye size={24} /></div>
            <h3 className="text-2xl font-black tracking-tight">計畫願景 (Vision)</h3>
          </div>
          <div className="p-10">
             <textarea 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-xl font-black text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 min-h-[120px] transition-all"
              placeholder="請輸入計畫的長期發展願景..."
              value={formData.vision || ''}
              onChange={e => setFormData({...formData, vision: e.target.value})}
             />
          </div>
        </section>

        {/* 3. OKR 執行管控 */}
        <section className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
           <div className="bg-[#1a1a1a] p-8 flex items-center justify-between text-white border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border-2 border-[#FFC107] rounded-full flex items-center justify-center text-[#FFC107]">
                <Target size={24} />
              </div>
              <h3 className="text-2xl font-black tracking-tight">計畫目標與關鍵結果 (OKR)</h3>
            </div>
            <button onClick={addObjective} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-black flex items-center gap-2">
              <PlusCircle size={18} /> 新增目標
            </button>
          </div>
          <div className="p-0 divide-y divide-slate-100">
             {formData.objectives?.map((obj, oIdx) => (
                <div key={obj.id} className="p-10 space-y-6">
                   <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-xs font-black text-slate-400 whitespace-nowrap">目標 {oIdx + 1}</span>
                        <input 
                          type="text" 
                          className="w-full bg-transparent border-b-2 border-slate-200 py-3 text-xl font-black text-slate-800 outline-none focus:border-amber-500 transition-all"
                          placeholder="請輸入目標名稱..."
                          value={obj.title}
                          onChange={e => updateObjective(obj.id, 'title', e.target.value)}
                        />
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="text-xs font-bold text-slate-400">權重</span>
                          <input 
                            type="number" 
                            className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center font-bold"
                            value={obj.weight}
                            onChange={e => updateObjective(obj.id, 'weight', Number(e.target.value))}
                          />
                          <span className="text-xs font-bold text-slate-400">%</span>
                        </div>
                      </div>
                      <button onClick={() => removeObjective(obj.id)} className="p-3 text-red-200 hover:text-red-500"><Trash2 size={20} /></button>
                   </div>
                   
                   {/* 關鍵結果表格 */}
                   <div className="bg-slate-50/50 rounded-2xl overflow-hidden border border-slate-100">
                     <table className="w-full text-sm">
                       <thead>
                         <tr className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                           <th className="px-4 py-3 text-left">關鍵結果</th>
                           <th className="px-4 py-3 text-center w-32">預計完成日期</th>
                           <th className="px-4 py-3 text-right w-28">預算金額</th>
                           <th className="px-4 py-3 text-right w-28">實際執行金額</th>
                           <th className="px-4 py-3 w-12"></th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {obj.keyResults.map((kr, krIdx) => (
                           <tr key={kr.id} className="bg-white hover:bg-slate-50/50">
                             <td className="px-4 py-3">
                               <input 
                                 type="text" 
                                 className="w-full bg-transparent border-none outline-none font-bold text-slate-700"
                                 placeholder={`關鍵結果 ${krIdx + 1}`}
                                 value={kr.description}
                                 onChange={e => updateKeyResult(obj.id, kr.id, 'description', e.target.value)}
                               />
                             </td>
                             <td className="px-4 py-3">
                               <input 
                                 type="date" 
                                 className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center"
                                 value={kr.expectedDate}
                                 onChange={e => updateKeyResult(obj.id, kr.id, 'expectedDate', e.target.value)}
                               />
                             </td>
                             <td className="px-4 py-3">
                               <input 
                                 type="number" 
                                 className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-right font-mono text-blue-600"
                                 value={kr.budgetAmount || 0}
                                 onChange={e => updateKeyResult(obj.id, kr.id, 'budgetAmount', Number(e.target.value))}
                               />
                             </td>
                             <td className="px-4 py-3">
                               <input 
                                 type="number" 
                                 className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-right font-mono text-emerald-600"
                                 value={kr.actualAmount || 0}
                                 onChange={e => updateKeyResult(obj.id, kr.id, 'actualAmount', Number(e.target.value))}
                               />
                             </td>
                             <td className="px-4 py-3">
                               <button onClick={() => removeKeyResult(obj.id, kr.id)} className="text-red-200 hover:text-red-500">
                                 <Trash2 size={16} />
                               </button>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                     <div className="p-4 border-t border-slate-100">
                       <button 
                         onClick={() => addKeyResult(obj.id)} 
                         className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1"
                       >
                         <Plus size={14} /> 新增關鍵結果
                       </button>
                     </div>
                   </div>
                </div>
             ))}
             {(!formData.objectives || formData.objectives.length === 0) && (
               <div className="p-20 text-center text-slate-300 font-bold">
                 尚未設定目標，請點擊上方「新增目標」按鈕
               </div>
             )}
          </div>
        </section>

        {/* 4. 經費預算明細 */}
        <section className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
           <div className="bg-[#2E7D5D] p-8 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                 <Calculator size={28} />
                 <h3 className="text-2xl font-black tracking-tight">經費預算編列</h3>
              </div>
              <button onClick={addBudgetItem} className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-black flex items-center gap-2">
                 <Plus size={18} /> 新增細目
              </button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                 <thead>
                    <tr className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-widest text-left">
                       <th className="px-8 py-5">類別</th>
                       <th className="px-8 py-5">項目名稱</th>
                       <th className="px-8 py-5 text-center">數量/單位</th>
                       <th className="px-8 py-5 text-right">預算金額 (單價)</th>
                       <th className="px-8 py-5 text-right">總價</th>
                       <th className="px-8 py-5"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {formData.budgetItems?.map((item) => (
                       <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-8 py-4">
                             <select className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold" value={item.category} onChange={e => updateBudgetItem(item.id, 'category', e.target.value as BudgetCategory)}>
                                {Object.values(BudgetCategory).map(v => <option key={v} value={v}>{v}</option>)}
                             </select>
                          </td>
                          <td className="px-8 py-4">
                             <input type="text" className="w-full bg-transparent border-b border-slate-100 font-bold text-slate-700 outline-none focus:border-emerald-500" value={item.name} onChange={e => updateBudgetItem(item.id, 'name', e.target.value)} />
                          </td>
                          <td className="px-8 py-4 text-center">
                             <div className="flex items-center justify-center gap-2">
                                <input type="number" className="w-12 text-center bg-slate-50 rounded p-1 font-mono" value={item.quantity} onChange={e => updateBudgetItem(item.id, 'quantity', Number(e.target.value))} />
                                <input type="text" className="w-12 text-center bg-slate-50 rounded p-1" placeholder="單位" value={item.unit} onChange={e => updateBudgetItem(item.id, 'unit', e.target.value)} />
                             </div>
                          </td>
                          <td className="px-8 py-4 text-right">
                             <input type="number" className="w-24 text-right bg-slate-50 rounded p-1 font-mono" value={item.unitPrice} onChange={e => updateBudgetItem(item.id, 'unitPrice', Number(e.target.value))} />
                          </td>
                          <td className="px-8 py-4 text-right">
                             <span className="font-black text-emerald-600 font-mono">${item.totalPrice.toLocaleString()}</span>
                          </td>
                          <td className="px-8 py-4">
                             <button onClick={() => setFormData({...formData, budgetItems: formData.budgetItems?.filter(i => i.id !== item.id)})} className="text-red-200 hover:text-red-500"><Trash2 size={16} /></button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
              {(!formData.budgetItems || formData.budgetItems.length === 0) && (
                <div className="p-10 text-center text-slate-300 font-bold">
                  尚未編列預算，請點擊上方「新增細目」按鈕
                </div>
              )}
           </div>
        </section>

        {/* 5. 撥付截止日期管理 */}
        <section className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-blue-600 p-8 flex items-center gap-4 text-white">
            <Clock size={32} />
            <h3 className="text-2xl font-black tracking-tight">撥付截止日期 (Deadline) 管理</h3>
          </div>
          <div className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-3">
                   <div className="flex items-center gap-2 text-blue-700 font-black">
                      <span className="w-6 h-6 bg-blue-700 text-white rounded-lg flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      第 {idx + 1} 期撥款
                   </div>
                   <input 
                    type="text" 
                    className="w-full bg-white border border-blue-100 rounded-xl px-4 py-2.5 text-sm font-bold text-blue-600 focus:ring-4 focus:ring-blue-500/10 outline-none"
                    placeholder="如: 115/2/15"
                    value={formData.grants?.[idx]?.deadline || ''}
                    onChange={(e) => updateGrantDeadline(idx, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProjectForm;
