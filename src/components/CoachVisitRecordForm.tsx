import React, { useState } from 'react';
import { Project, CoachingRecord, KRStatus } from '../types';
import { Calendar, Camera, Save, X, Upload, AlertTriangle } from 'lucide-react';

interface CoachVisitRecordFormProps {
  project: Project;
  record?: Partial<CoachingRecord>;
  onSave: (record: CoachingRecord) => void;
  onCancel: () => void;
  isEditing: boolean;
}

const CoachVisitRecordForm: React.FC<CoachVisitRecordFormProps> = ({ 
  project, 
  record = {}, 
  onSave, 
  onCancel, 
  isEditing 
}) => {
  const [formData, setFormData] = useState({
    // 基本信息
    id: record.id || `coach-${Date.now()}`,
    projectId: project.id,
    recordType: 'coach' as const,
    writer: record.writer || '輔導老師',
    date: record.date || new Date().toISOString().split('T')[0],
    
    // 輔導老師表單專屬欄位
    visitDate: record.visitDate || new Date().toISOString().split('T')[0],
    visitLocation: record.visitLocation || '',
    visitedUnit: project.executingUnit || '',
    projectName: project.name || '',
    executionLocation: record.executionLocation || project.implementationLocation || '',
    
    // 參與人員
    coachName: record.coachName || '輔導老師',
    unitStaff: record.unitStaff || '',
    otherStaff: record.otherStaff || '',
    
    // 計畫摘要（本部窗口協助填寫）
    projectPeriod: record.projectPeriod || project.period || '',
    okrSummary: record.okrSummary || project.okrSummary || '',
    reviewMechanism: record.reviewMechanism || '定期檢討機制：每月進度檢核、季度成果檢視',
    
    // 輔導老師觀察紀錄及建議
    progressStatus: record.progressStatus || KRStatus.ON_TRACK,
    executionDescription: record.executionDescription || '',
    teamSuggestions: record.teamSuggestions || '',
    mocSuggestions: record.mocSuggestions || '',
    
    // 現場照片
    photos: record.photos || [],
    
    // 其他必要欄位
    location: record.visitLocation || '',
    content: record.content || '',
    status: record.status || KRStatus.ON_TRACK,
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const progressOptions = [
    { value: 'severely_behind', label: '嚴重落後', color: 'text-red-600' },
    { value: 'slightly_behind', label: '稍微落後', color: 'text-orange-600' },
    { value: KRStatus.ON_TRACK, label: '符合進度', color: 'text-green-600' },
    { value: KRStatus.AHEAD, label: '超前進度', color: 'text-blue-600' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString()
    }));
  };

  const handlePhotoUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newPhotos = Array.from(files).map(file => ({
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      url: URL.createObjectURL(file),
      file: file
    }));
    
    handleInputChange('photos', [...formData.photos, ...newPhotos]);
  };

  const removePhoto = (photoId: string) => {
    handleInputChange('photos', formData.photos.filter(p => p.id !== photoId));
  };

  const handleSubmit = () => {
    // 驗證必填欄位
    if (!formData.visitDate || !formData.visitLocation) {
      alert('請填寫訪視時間和訪視地點');
      return;
    }
    
    if (formData.photos.length < 3) {
      alert('請至少上傳3張現場照片');
      return;
    }

    // 構建完整的 CoachingRecord
    const coachingRecord: CoachingRecord = {
      ...formData,
      // 同步必要欄位
      location: formData.visitLocation,
      content: `執行狀況：${formData.executionDescription}\n團隊建議：${formData.teamSuggestions}\n本部建議：${formData.mocSuggestions}`,
      status: formData.progressStatus
    };

    onSave(coachingRecord);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 表頭 */}
        <div className="sticky top-0 bg-white border-b-2 border-slate-200 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h2 className="text-lg font-black text-slate-700">文化部「原住民村落文化發展計畫」</h2>
              <h1 className="text-2xl font-black tracking-[0.2em] text-slate-700 mt-1">輔導老師訪視紀錄表</h1>
            </div>
            <button
              onClick={onCancel}
              className="ml-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* 表單內容 */}
        <div className="p-6 space-y-6">
          {/* 第一行：訪視時間 + 訪視地點 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">訪視時間</label>
              <input
                type="date"
                value={formData.visitDate}
                onChange={(e) => handleInputChange('visitDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">訪視地點</label>
              <input
                type="text"
                value={formData.visitLocation}
                onChange={(e) => handleInputChange('visitLocation', e.target.value)}
                placeholder="請填寫訪視地點"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 第二行：受訪單位 + 計畫名稱 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">受訪單位</label>
              <input
                type="text"
                value={formData.visitedUnit}
                onChange={(e) => handleInputChange('visitedUnit', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">計畫名稱</label>
              <input
                type="text"
                value={formData.projectName}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                readOnly
              />
            </div>
          </div>

          {/* 第三行：計畫執行地點 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">計畫執行地點</label>
            <input
              type="text"
              value={formData.executionLocation}
              onChange={(e) => handleInputChange('executionLocation', e.target.value)}
              placeholder="請填寫計畫執行地點"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 第四行：參與人員 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">參與人員</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">輔導老師</label>
                <input
                  type="text"
                  value={formData.coachName}
                  onChange={(e) => handleInputChange('coachName', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">受訪單位人員</label>
                <input
                  type="text"
                  value={formData.unitStaff}
                  onChange={(e) => handleInputChange('unitStaff', e.target.value)}
                  placeholder="請填寫受訪單位人員"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">其他單位人員</label>
                <input
                  type="text"
                  value={formData.otherStaff}
                  onChange={(e) => handleInputChange('otherStaff', e.target.value)}
                  placeholder="請填寫其他單位人員"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 第五行：計畫摘要 (本部窗口協助填寫) */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              計畫摘要 <span className="text-xs text-blue-600">(本部窗口協助填寫)</span>
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">計畫期程</label>
                <input
                  type="text"
                  value={formData.projectPeriod}
                  onChange={(e) => handleInputChange('projectPeriod', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">計畫 OKR 簡表</label>
                <textarea
                  value={formData.okrSummary}
                  onChange={(e) => handleInputChange('okrSummary', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">定期檢討機制</label>
                <textarea
                  value={formData.reviewMechanism}
                  onChange={(e) => handleInputChange('reviewMechanism', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 第六行：輔導老師觀察紀錄及提供本部建議 */}
          <div className="bg-green-50 p-4 rounded-lg">
            <label className="block text-sm font-bold text-slate-700 mb-3">輔導老師觀察紀錄及提供本部建議</label>
            
            {/* 進度達成情形 */}
            <div className="mb-4">
              <label className="block text-xs text-slate-600 mb-2">本案進度達成情形 (請於訪視時勾選)</label>
              <div className="flex flex-wrap gap-4">
                {progressOptions.map(option => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="progressStatus"
                      value={option.value}
                      checked={formData.progressStatus === option.value}
                      onChange={(e) => handleInputChange('progressStatus', e.target.value)}
                      className="w-4 h-4 accent-green-600"
                    />
                    <span className={`text-sm font-medium ${option.color}`}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">計畫執行狀況說明</label>
                <textarea
                  value={formData.executionDescription}
                  onChange={(e) => handleInputChange('executionDescription', e.target.value)}
                  rows={3}
                  placeholder="請詳細說明計畫執行狀況..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">提供團隊建議（含適時引介相關資源）</label>
                <textarea
                  value={formData.teamSuggestions}
                  onChange={(e) => handleInputChange('teamSuggestions', e.target.value)}
                  rows={3}
                  placeholder="請提供對團隊的建議..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">提供本部建議</label>
                <textarea
                  value={formData.mocSuggestions}
                  onChange={(e) => handleInputChange('mocSuggestions', e.target.value)}
                  rows={3}
                  placeholder="請提供對本部的建議..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* 第七行：現場照片 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Camera className="text-slate-600" size={16} />
              <label className="text-sm font-bold text-slate-700">
                現場照片 <span className="text-red-500">(至少3張)</span>
              </label>
            </div>
            
            {/* 上傳按鈕 */}
            <div className="mb-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handlePhotoUpload(e.target.files)}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors"
              >
                <Upload size={16} />
                上傳照片
              </label>
            </div>

            {/* 照片預覽 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {formData.photos.map(photo => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-32 object-cover rounded-lg border border-slate-300"
                  />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            {formData.photos.length < 3 && (
              <div className="mt-2 flex items-center gap-2 text-amber-600">
                <AlertTriangle size={16} />
                <span className="text-xs">還需要上傳 {3 - formData.photos.length} 張照片</span>
              </div>
            )}
          </div>
        </div>

        {/* 表尾按鈕 */}
        <div className="sticky bottom-0 bg-white border-t-2 border-slate-200 p-6 rounded-b-2xl">
          <div className="flex justify-end gap-4">
            <button
              onClick={onCancel}
              className="px-6 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              儲存紀錄
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachVisitRecordForm;