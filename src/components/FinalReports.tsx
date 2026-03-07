import React, { useState } from 'react';
import { Project, UserRole } from '../types';
import { FileText, Plus, Calendar, Pencil, Trash2, Eye, Download } from 'lucide-react';
import FinalReportForm from './FinalReportForm';

interface FinalReport {
  id: string;
  projectId: string;
  coachName: string;
  submissionDate: string;
  supervisedUnit: string;
  projectName: string;
  consultationItems: Array<{
    id: string;
    date: string;
    method: '電話' | '電郵' | '其他';
    content: string;
    methodOther?: string;
  }>;
  comprehensiveOpinion: string;
  photos: Array<{
    id: string;
    name: string;
    url: string;
    file?: File;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface FinalReportsProps {
  projects: Project[];
  finalReports: FinalReport[];
  onSaveReport: (report: FinalReport) => void;
  onDeleteReport?: (reportId: string) => void;
  currentUserRole: UserRole;
  currentUserUnitId?: string;
}

const FinalReports: React.FC<FinalReportsProps> = ({ 
  projects, 
  finalReports, 
  onSaveReport, 
  onDeleteReport, 
  currentUserRole, 
  currentUserUnitId 
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<Partial<FinalReport> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const isAdmin = currentUserRole === UserRole.ADMIN;
  const isCoach = currentUserRole === UserRole.COACH;
  const isOperator = currentUserRole === UserRole.OPERATOR;

  // 根據角色過濾可見專案
  const visibleProjects = projects.filter(project => {
    if (isAdmin) return true;
    if (isOperator && currentUserUnitId) return project.unitId === currentUserUnitId;
    if (isCoach) return true; // 輔導老師可以看到所有專案（實際上應該根據指派關係過濾）
    return false;
  });

  const selectedProject = visibleProjects.find(p => p.id === selectedProjectId);
  const projectReports = finalReports.filter(r => r.projectId === selectedProjectId);

  const handleOpenNew = () => {
    if (!isAdmin && !isCoach) return;
    setEditingReport({});
    setShowForm(true);
  };

  const handleEdit = (report: FinalReport) => {
    if (!isAdmin && !isCoach) return;
    setEditingReport({ ...report });
    setShowForm(true);
  };

  const handleView = (report: FinalReport) => {
    setEditingReport({ ...report });
    setShowForm(true);
  };

  const handleSave = (report: FinalReport) => {
    onSaveReport(report);
    setShowForm(false);
    setEditingReport(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingReport(null);
  };

  const handleDelete = (reportId: string) => {
    if (onDeleteReport) {
      onDeleteReport(reportId);
    }
    setDeleteConfirm(null);
  };

  const canEdit = (report: FinalReport) => {
    return isAdmin || isCoach;
  };

  const exportReport = (report: FinalReport) => {
    // 這裡可以實現導出功能
    console.log('導出期末結案表:', report.id);
  };

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500 px-4">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        {/* 頁面標題 */}
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-green-500 text-white rounded-2xl">
              <FileText size={28} />
            </div>
            期末結案表管理
          </h2>
          <div className="flex gap-4">
            <select 
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 font-black text-slate-800 outline-none shadow-sm"
            >
              {visibleProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {(isAdmin || isCoach) && (
              <button 
                onClick={handleOpenNew} 
                className="px-8 py-3 bg-green-600 text-white rounded-2xl font-black shadow-lg hover:bg-green-700 transition-all flex items-center gap-2"
              >
                <Plus size={20} />
                新增期末結案表
              </button>
            )}
          </div>
        </div>

        {/* 專案資訊 */}
        {selectedProject && (
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-bold text-slate-600">執行單位：</span>
                <span>{selectedProject.executingUnit}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">計畫期程：</span>
                <span>{selectedProject.period}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">計畫類別：</span>
                <span>{selectedProject.category}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">核定金額：</span>
                <span>{selectedProject.approvedAmount?.toLocaleString()} 元</span>
              </div>
            </div>
          </div>
        )}

        {/* 結案表列表 */}
        <div className="space-y-4">
          {projectReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-slate-300 mb-4" size={64} />
              <p className="text-slate-500 text-lg">尚未建立期末結案表</p>
              {(isAdmin || isCoach) && (
                <button
                  onClick={handleOpenNew}
                  className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  建立第一個結案表
                </button>
              )}
            </div>
          ) : (
            projectReports.map(report => (
              <div key={report.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-bold text-slate-800">
                        期末結案表
                      </h3>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        已提交
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600 mb-4">
                      <div>
                        <span className="font-medium">輔導老師：</span>
                        {report.coachName}
                      </div>
                      <div>
                        <span className="font-medium">提交日期：</span>
                        {report.submissionDate}
                      </div>
                      <div>
                        <span className="font-medium">諮詢次數：</span>
                        {report.consultationItems.length} 次
                      </div>
                      <div>
                        <span className="font-medium">意見字數：</span>
                        {countWords(report.comprehensiveOpinion)} 字
                      </div>
                    </div>

                    <div className="text-sm text-slate-600">
                      <span className="font-medium">輔導單位：</span>
                      {report.supervisedUnit}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(report)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="查看詳情"
                    >
                      <Eye size={16} />
                    </button>
                    {canEdit(report) && (
                      <button
                        onClick={() => handleEdit(report)}
                        className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                        title="編輯"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => exportReport(report)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="導出"
                    >
                      <Download size={16} />
                    </button>
                    {isAdmin && onDeleteReport && (
                      <button
                        onClick={() => setDeleteConfirm(report.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="刪除"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 期末結案表表單 */}
      {showForm && selectedProject && (
        <FinalReportForm
          project={selectedProject}
          report={editingReport}
          onSave={handleSave}
          onCancel={handleCancel}
          isEditing={!!editingReport?.id}
        />
      )}

      {/* 刪除確認對話框 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">確認刪除</h3>
            <p className="text-slate-600 mb-6">確定要刪除這個期末結案表嗎？此操作無法復原。</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalReports;