import React, { useState } from 'react';
import { 
  PlusCircle, 
  Building2, 
  User, 
  Users, 
  Calendar, 
  Hash,
  Save, 
  ArrowLeft,
  AlertCircle,
  Settings,
  CheckCircle,
  Clock
} from 'lucide-react';
import { UserRole, ProjectStatus } from '../types';

interface ProjectSubmissionProps {
  onBack: () => void;
  onSave: (data: any) => void;
  currentUserRole: string;
}

interface ProjectData {
  projectCode: string;
  name: string;
  executiveUnit: string;
  coachName: string;
  managerName: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  // 操作人員填寫的欄位
  description: string;
  budget: number;
  objectives: string[];
  expectedOutcomes: string;
}

const ProjectSubmission: React.FC<ProjectSubmissionProps> = ({ onBack, onSave, currentUserRole }) => {
  const isAdmin = currentUserRole === UserRole.ADMIN;
  const isOperator = currentUserRole === UserRole.OPERATOR;
  
  const [formData, setFormData] = useState<ProjectData>({
    projectCode: '',
    name: '',
    executiveUnit: '',
    coachName: '',
    managerName: '',
    startDate: '',
    endDate: '',
    status: ProjectStatus.PLANNING,
    description: '',
    budget: 0,
    objectives: [''],
    expectedOutcomes: ''
  });
  
  const [batchDates, setBatchDates] = useState({
    enabled: false,
    baseStartDate: '',
    duration: 12 // 預設12個月
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'admin' | 'operator' | 'review'>('admin');

  const handleInputChange = (field: keyof ProjectData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除對應欄位的錯誤
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index] = value;
    setFormData(prev => ({
      ...prev,
      objectives: newObjectives
    }));
  };

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      objectives: [...prev.objectives, '']
    }));
  };

  const removeObjective = (index: number) => {
    if (formData.objectives.length > 1) {
      setFormData(prev => ({
        ...prev,
        objectives: prev.objectives.filter((_, i) => i !== index)
      }));
    }
  };

  const handleBatchDateCalculate = () => {
    if (batchDates.baseStartDate && batchDates.duration) {
      const startDate = new Date(batchDates.baseStartDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + batchDates.duration);
      
      setFormData(prev => ({
        ...prev,
        startDate: batchDates.baseStartDate,
        endDate: endDate.toISOString().split('T')[0]
      }));
      
      setBatchDates(prev => ({ ...prev, enabled: false }));
    }
  };

  const validateAdminFields = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.projectCode.trim()) {
      newErrors.projectCode = '計畫編號為必填項目';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = '計畫名稱為必填項目';
    }
    
    if (!formData.executiveUnit.trim()) {
      newErrors.executiveUnit = '執行單位為必填項目';
    }
    
    if (!formData.coachName.trim()) {
      newErrors.coachName = '輔導老師為必填項目';
    }
    
    if (!formData.managerName.trim()) {
      newErrors.managerName = '主責人員為必填項目';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = '計畫開始日為必填項目';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = '計畫結束日為必填項目';
    }
    
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = '結束日期不能早於開始日期';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOperatorFields = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.description.trim()) {
      newErrors.description = '計畫描述為必填項目';
    }
    
    if (formData.budget <= 0) {
      newErrors.budget = '預算金額必須大於0';
    }
    
    if (formData.objectives.some(obj => !obj.trim())) {
      newErrors.objectives = '所有目標項目都必須填寫';
    }
    
    if (!formData.expectedOutcomes.trim()) {
      newErrors.expectedOutcomes = '預期成果為必填項目';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (step === 'admin' && validateAdminFields()) {
      setStep('operator');
    } else if (step === 'operator' && validateOperatorFields()) {
      setStep('review');
    } else if (step === 'review') {
      onSave(formData);
    }
  };

  const renderAdminForm = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          管理員開案階段
        </h3>
        <p className="text-sm text-blue-700">
          請填寫計畫基本資訊，完成後將進入操作人員協作填寫階段
        </p>
      </div>

      {/* 計畫編號 */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          <Hash className="w-4 h-4 inline mr-1" />
          計畫編號 *
        </label>
        <input
          type="text"
          value={formData.projectCode}
          onChange={(e) => handleInputChange('projectCode', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.projectCode ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="例如：MOC-2026-001"
        />
        {errors.projectCode && (
          <p className="text-red-500 text-xs mt-1">{errors.projectCode}</p>
        )}
      </div>

      {/* 計畫名稱 */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          <PlusCircle className="w-4 h-4 inline mr-1" />
          計畫名稱 *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.name ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="請輸入計畫名稱"
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      {/* 執行單位 */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          <Building2 className="w-4 h-4 inline mr-1" />
          執行單位 *
        </label>
        <input
          type="text"
          value={formData.executiveUnit}
          onChange={(e) => handleInputChange('executiveUnit', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.executiveUnit ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="請輸入執行單位名稱"
        />
        {errors.executiveUnit && (
          <p className="text-red-500 text-xs mt-1">{errors.executiveUnit}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 輔導老師 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            輔導老師 *
          </label>
          <input
            type="text"
            value={formData.coachName}
            onChange={(e) => handleInputChange('coachName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.coachName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="輔導老師姓名"
          />
          {errors.coachName && (
            <p className="text-red-500 text-xs mt-1">{errors.coachName}</p>
          )}
        </div>

        {/* 主責人員 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            主責人員 *
          </label>
          <input
            type="text"
            value={formData.managerName}
            onChange={(e) => handleInputChange('managerName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.managerName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="主責人員姓名"
          />
          {errors.managerName && (
            <p className="text-red-500 text-xs mt-1">{errors.managerName}</p>
          )}
        </div>
      </div>

      {/* 批次日期設定 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="batchDates"
            checked={batchDates.enabled}
            onChange={(e) => setBatchDates(prev => ({ ...prev, enabled: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="batchDates" className="text-sm font-bold text-gray-700">
            <Calendar className="w-4 h-4 inline mr-1" />
            批次日期計算
          </label>
        </div>

        {batchDates.enabled && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">基準開始日</label>
                <input
                  type="date"
                  value={batchDates.baseStartDate}
                  onChange={(e) => setBatchDates(prev => ({ ...prev, baseStartDate: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">執行期間（月）</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={batchDates.duration}
                  onChange={(e) => setBatchDates(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleBatchDateCalculate}
              className="w-full bg-blue-100 text-blue-800 py-2 px-3 rounded text-sm hover:bg-blue-200 transition-colors"
            >
              計算並填入日期
            </button>
          </div>
        )}
      </div>

      {/* 日期範圍 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            計畫開始日 *
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.startDate ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.startDate && (
            <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            計畫結束日 *
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.endDate ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.endDate && (
            <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* 計畫狀態 */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          <CheckCircle className="w-4 h-4 inline mr-1" />
          計畫狀態
        </label>
        <select
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value as ProjectStatus)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={ProjectStatus.PLANNING}>規劃中</option>
          <option value={ProjectStatus.ACTIVE}>進行中</option>
          <option value={ProjectStatus.ON_HOLD}>暫停</option>
          <option value={ProjectStatus.COMPLETED}>已完成</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          💡 提示：系統也會根據進度自動判斷狀態，此設定為初始狀態
        </p>
      </div>
    </div>
  );

  const renderOperatorForm = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
          <Users className="w-5 h-5" />
          操作人員填寫階段
        </h3>
        <p className="text-sm text-green-700">
          管理員已完成基本資訊設定，請補充詳細計畫內容
        </p>
      </div>

      {/* 計畫描述 */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          計畫描述 *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="請詳細描述計畫內容、背景與重要性..."
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description}</p>
        )}
      </div>

      {/* 預算金額 */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          預算金額（元）*
        </label>
        <input
          type="number"
          min="0"
          value={formData.budget}
          onChange={(e) => handleInputChange('budget', parseInt(e.target.value) || 0)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.budget ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="請輸入預算金額"
        />
        {errors.budget && (
          <p className="text-red-500 text-xs mt-1">{errors.budget}</p>
        )}
      </div>

      {/* 計畫目標 */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          計畫目標 *
        </label>
        {formData.objectives.map((objective, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={objective}
              onChange={(e) => handleObjectiveChange(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`目標 ${index + 1}`}
            />
            {formData.objectives.length > 1 && (
              <button
                type="button"
                onClick={() => removeObjective(index)}
                className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              >
                移除
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addObjective}
          className="w-full py-2 px-3 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm"
        >
          + 新增目標
        </button>
        {errors.objectives && (
          <p className="text-red-500 text-xs mt-1">{errors.objectives}</p>
        )}
      </div>

      {/* 預期成果 */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          預期成果 *
        </label>
        <textarea
          value={formData.expectedOutcomes}
          onChange={(e) => handleInputChange('expectedOutcomes', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
            errors.expectedOutcomes ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="請描述計畫預期達成的成果與效益..."
        />
        {errors.expectedOutcomes && (
          <p className="text-red-500 text-xs mt-1">{errors.expectedOutcomes}</p>
        )}
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          最終確認
        </h3>
        <p className="text-sm text-purple-700">
          請檢查所有資訊是否正確，確認後將創建新計畫
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <h4 className="font-bold text-gray-800">基本資訊</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><strong>計畫編號:</strong> {formData.projectCode}</div>
          <div><strong>計畫名稱:</strong> {formData.name}</div>
          <div><strong>執行單位:</strong> {formData.executiveUnit}</div>
          <div><strong>輔導老師:</strong> {formData.coachName}</div>
          <div><strong>主責人員:</strong> {formData.managerName}</div>
          <div><strong>執行期間:</strong> {formData.startDate} ~ {formData.endDate}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <h4 className="font-bold text-gray-800">詳細內容</h4>
        <div className="text-sm space-y-2">
          <div><strong>預算:</strong> NT$ {formData.budget?.toLocaleString()}</div>
          <div><strong>描述:</strong> {formData.description}</div>
          <div><strong>目標:</strong> 
            <ul className="ml-4 mt-1">
              {formData.objectives.map((obj, index) => (
                <li key={index} className="list-disc">{obj}</li>
              ))}
            </ul>
          </div>
          <div><strong>預期成果:</strong> {formData.expectedOutcomes}</div>
        </div>
      </div>
    </div>
  );

  const getStepName = () => {
    switch (step) {
      case 'admin': return '管理員開案';
      case 'operator': return '操作人員填寫';
      case 'review': return '最終確認';
      default: return '';
    }
  };

  const getNextButtonText = () => {
    switch (step) {
      case 'admin': return '進入操作人員階段';
      case 'operator': return '進入最終確認';
      case 'review': return '創建計畫';
      default: return '繼續';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <PlusCircle className="w-6 h-6 text-blue-600" />
                新案提案申請
              </h1>
              <p className="text-gray-600 mt-1">協作式計畫創建流程</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">當前階段</div>
              <div className="font-bold text-blue-600">{getStepName()}</div>
            </div>
          </div>
          
          {/* 進度條 */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>管理員開案</span>
              <span>操作人員填寫</span>
              <span>最終確認</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: step === 'admin' ? '33%' : step === 'operator' ? '67%' : '100%' 
                }}
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          {Object.keys(errors).length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">請修正以下錯誤：</p>
                <ul className="text-red-700 text-sm mt-1 space-y-1">
                  {Object.values(errors).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 如果不是管理員且在管理員階段，顯示等待訊息 */}
          {!isAdmin && step === 'admin' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <Clock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <h3 className="font-bold text-amber-800">等待管理員開案</h3>
              <p className="text-amber-700 text-sm mt-1">
                此階段需要管理員填寫基本資訊，完成後您可以繼續填寫詳細內容
              </p>
            </div>
          )}

          {/* 如果是操作人員且在操作人員階段，或是管理員，顯示對應表單 */}
          {((isAdmin && step === 'admin') || (isOperator && step === 'operator') || step === 'review') && (
            <>
              {step === 'admin' && renderAdminForm()}
              {step === 'operator' && renderOperatorForm()}
              {step === 'review' && renderReview()}
            </>
          )}

          {/* 如果是管理員但在操作人員階段，顯示等待訊息 */}
          {isAdmin && step === 'operator' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-bold text-green-800">等待操作人員填寫</h3>
              <p className="text-green-700 text-sm mt-1">
                基本資訊已設定完成，等待操作人員補充詳細內容
              </p>
              <button
                onClick={() => setStep('review')}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                跳過並直接完成（管理員權限）
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </button>
            
            <div className="flex gap-3">
              {step !== 'admin' && (
                <button
                  onClick={() => setStep(step === 'review' ? 'operator' : 'admin')}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  上一步
                </button>
              )}
              
              {/* 只有在對應角色的階段才顯示繼續按鈕 */}
              {((isAdmin && step === 'admin') || (isOperator && step === 'operator') || step === 'review') && (
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {getNextButtonText()}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSubmission;