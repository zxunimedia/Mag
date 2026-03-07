import React, { useState } from 'react';
import { Project, CoachingRecord } from '../types';
import { Calendar, FileText, Save, X, Upload, AlertTriangle, Plus, Trash2 } from 'lucide-react';

interface FinalReportFormProps {
  project: Project;
  report?: Partial<FinalReport>;
  onSave: (report: FinalReport) => void;
  onCancel: () => void;
  isEditing: boolean;
}

interface ConsultationItem {
  id: string;
  date: string;
  method: '電話' | '電郵' | '其他';
  content: string;
  methodOther?: string;
}

interface FinalReport {
  id: string;
  projectId: string;
  coachName: string;
  submissionDate: string;
  supervisedUnit: string;
  projectName: string;
  consultationItems: ConsultationItem[];
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

const FinalReportForm: React.FC<FinalReportFormProps> = ({ 
  project, 
  report = {}, 
  onSave, 
  onCancel, 
  isEditing 
}) => {
  const [formData, setFormData] = useState<FinalReport>({
    id: report.id || `final-report-${Date.now()}`,
    projectId: project.id,
    coachName: report.coachName || '輔導老師',
    submissionDate: report.submissionDate || new Date().toISOString().split('T')[0],
    supervisedUnit: report.supervisedUnit || project.executingUnit || '',
    projectName: report.projectName || project.name || '',
    consultationItems: report.consultationItems || [
      {
        id: `consultation-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        method: '電話',
        content: ''
      }
    ],
    comprehensiveOpinion: report.comprehensiveOpinion || '',
    photos: report.photos || [],
    createdAt: report.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString()
    }));
  };

  const addConsultationItem = () => {
    const newItem: ConsultationItem = {
      id: `consultation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString().split('T')[0],
      method: '電話',
      content: ''
    };
    
    handleInputChange('consultationItems', [...formData.consultationItems, newItem]);
  };

  const updateConsultationItem = (id: string, field: string, value: any) => {
    const updatedItems = formData.consultationItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    handleInputChange('consultationItems', updatedItems);
  };

  const removeConsultationItem = (id: string) => {
    const filteredItems = formData.consultationItems.filter(item => item.id !== id);
    handleInputChange('consultationItems', filteredItems);
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

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleSubmit = () => {
    // 驗證必填欄位
    if (!formData.coachName || !formData.submissionDate) {
      alert('請填寫輔導老師姓名和提交日期');
      return;
    }
    
    if (formData.consultationItems.length === 0 || formData.consultationItems.some(item => !item.content.trim())) {
      alert('請至少填寫一項諮詢建議內容');
      return;
    }

    const wordCount = countWords(formData.comprehensiveOpinion);
    if (wordCount < 1000) {
      alert(`綜合輔導意見需要至少1000字，目前僅有${wordCount}字`);
      return;
    }
    
    if (formData.photos.length < 3) {
      alert('請至少上傳3張500萬畫素以上的照片');
      return;
    }

    onSave(formData);
  };

  const wordCount = countWords(formData.comprehensiveOpinion);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* 表頭 */}
        <div className="sticky top-0 bg-white border-b-2 border-slate-200 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h2 className="text-lg font-black text-slate-700">文化部114年「原住民村落文化發展計畫」</h2>
              <h1 className="text-2xl font-black tracking-[0.2em] text-slate-700 mt-1">輔導老師委託案期末結案表</h1>
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
          {/* 第一行：輔導老師 + 提交日期 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">輔導老師</label>
              <input
                type="text"
                value={formData.coachName}
                onChange={(e) => handleInputChange('coachName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">提交日期</label>
              <input
                type="date"
                value={formData.submissionDate}
                onChange={(e) => handleInputChange('submissionDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 第二行：輔導單位及計畫名稱 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">輔導單位</label>
              <input
                type="text"
                value={formData.supervisedUnit}
                onChange={(e) => handleInputChange('supervisedUnit', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">計畫名稱</label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 諮詢建議內容 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-slate-700">
                一、依受補助單位實際需求，以電話、電郵或其他方式提供諮詢及建議之內容
                <br />
                <span className="text-xs text-blue-600">(不須重複實地訪視已紀錄之內容)</span>
              </label>
              <button
                onClick={addConsultationItem}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
              >
                <Plus size={14} />
                新增
              </button>
            </div>

            <div className="space-y-4">
              {formData.consultationItems.map((item, index) => (
                <div key={item.id} className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-slate-700">諮詢記錄 {index + 1}</span>
                    {formData.consultationItems.length > 1 && (
                      <button
                        onClick={() => removeConsultationItem(item.id)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">日期</label>
                      <input
                        type="date"
                        value={item.date}
                        onChange={(e) => updateConsultationItem(item.id, 'date', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">方式</label>
                      <select
                        value={item.method}
                        onChange={(e) => updateConsultationItem(item.id, 'method', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="電話">電話</option>
                        <option value="電郵">電郵</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                    {item.method === '其他' && (
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">其他方式</label>
                        <input
                          type="text"
                          value={item.methodOther || ''}
                          onChange={(e) => updateConsultationItem(item.id, 'methodOther', e.target.value)}
                          placeholder="請說明"
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">諮詢及建議內容</label>
                    <textarea
                      value={item.content}
                      onChange={(e) => updateConsultationItem(item.id, 'content', e.target.value)}
                      rows={4}
                      placeholder="請詳細描述提供的諮詢及建議內容..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 綜合輔導意見 */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-slate-700">
                二、綜合輔導意見
                <br />
                <span className="text-xs text-green-600">
                  (至少1,000字以上，並佐以至少3張500萬畫素以上之照片；內容應符合政策方向，並以正面鼓勵方式論述。)
                </span>
              </label>
              <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                wordCount >= 1000 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {wordCount} / 1,000 字
              </div>
            </div>

            <textarea
              value={formData.comprehensiveOpinion}
              onChange={(e) => handleInputChange('comprehensiveOpinion', e.target.value)}
              rows={12}
              placeholder="請撰寫綜合輔導意見，至少1000字。內容應符合政策方向，並以正面鼓勵方式論述..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            {wordCount < 1000 && (
              <div className="mt-2 flex items-center gap-2 text-amber-600">
                <AlertTriangle size={16} />
                <span className="text-xs">還需要 {1000 - wordCount} 字</span>
              </div>
            )}
          </div>

          {/* 照片上傳 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="text-slate-600" size={16} />
              <label className="text-sm font-bold text-slate-700">
                佐證照片 <span className="text-red-500">(至少3張500萬畫素以上)</span>
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
                id="final-photo-upload"
              />
              <label
                htmlFor="final-photo-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer transition-colors"
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
              儲存結案表
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalReportForm;