import React, { useState, useEffect } from 'react';
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
  Clock,
  Lock,
  Unlock
} from 'lucide-react';
import { UserRole, ProjectStatus, Project } from '../types';
import { supabase } from '../services/supabaseClient';

interface ProjectSubmissionProps {
  onBack: () => void;
  onSave: (data: any) => void;
  currentUserRole: string;
  editingProject?: { id: string; project_code?: string }; // 編輯模式時的專案資訊
}

interface ProjectFormData {
  // 管理員欄位
  project_code: string;
  name: string;
  executing_unit: string;
  advisor_name: string;
  advisor_email: string;
  advisor_phone: string;
  manager_name: string;
  manager_email: string;
  manager_phone: string;
  assigned_user_id: string;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
  
  // 操作人員欄位
  description: string;
  budget: number;
  applied_amount: number;
  approved_amount: number;
  village: string;
  legal_address: string;
  contact_address: string;
  site_types: string[];
  sites: string[];
  category: string;
  year: string;
  period: string;
}

interface User {
  id: string;
  name: string;
  role: string;
  unit_name: string;
}

const ProjectSubmission: React.FC<ProjectSubmissionProps> = ({ onBack, onSave, currentUserRole, editingProject }) => {
  const isAdmin = currentUserRole === UserRole.ADMIN;
  const isOperator = currentUserRole === UserRole.OPERATOR;
  const isCoach = currentUserRole === UserRole.COACH;
  
  // 如果是輔導老師，直接返回無權限訊息
  if (isCoach) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <Clock className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-amber-800 mb-2">無權限使用此功能</h3>
          <p className="text-amber-700">輔導老師無法使用「新案提案申請」功能</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }
  
  const [formData, setFormData] = useState<ProjectFormData>({
    project_code: '',
    name: '',
    executing_unit: '',
    advisor_name: '',
    advisor_email: '',
    advisor_phone: '',
    manager_name: '',
    manager_email: '',
    manager_phone: '',
    assigned_user_id: '',
    start_date: '',
    end_date: '',
    status: ProjectStatus.PLANNING,
    description: '',
    budget: 0,
    applied_amount: 0,
    approved_amount: 0,
    village: '',
    legal_address: '',
    contact_address: '',
    site_types: [],
    sites: [],
    category: '原鄉文化行動',
    year: new Date().getFullYear().toString(),
    period: '第一期'
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 批次日期功能
  const [quickDateSetup, setQuickDateSetup] = useState({
    enabled: false,
    start_date: '',
    duration_months: 12,
    end_date: ''
  });

  // 載入用戶列表（用於指派）
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, role, unit_name')
          .order('name');
        
        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('載入用戶列表失敗:', error);
      }
    };
    
    loadUsers();
  }, []);

  // project_code 即時檢查
  const [projectCodeChecking, setProjectCodeChecking] = useState(false);
  const [projectCodeDebounce, setProjectCodeDebounce] = useState<NodeJS.Timeout | null>(null);
  
  const handleProjectCodeChange = (value: string) => {
    handleInputChange('project_code', value);
    
    // 清除之前的錯誤訊息
    if (errors.project_code) {
      setErrors(prev => ({ ...prev, project_code: '' }));
    }
    
    // 設定防抖動，500ms 後檢查
    if (projectCodeDebounce) {
      clearTimeout(projectCodeDebounce);
    }
    
    if (value.trim()) {
      const timeout = setTimeout(async () => {
        setProjectCodeChecking(true);
        const isUnique = await checkProjectCodeUniqueness(value);
        if (!isUnique) {
          setErrors(prev => ({ ...prev, project_code: '計畫編號已存在，請使用其他編號' }));
        }
        setProjectCodeChecking(false);
      }, 500);
      
      setProjectCodeDebounce(timeout);
    }
  };

  const handleInputChange = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除錯誤
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleQuickDateCalculate = () => {
    if (quickDateSetup.start_date && quickDateSetup.duration_months > 0) {
      const startDate = new Date(quickDateSetup.start_date);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + quickDateSetup.duration_months);
      
      const endDateStr = endDate.toISOString().split('T')[0];
      
      setFormData(prev => ({
        ...prev,
        start_date: quickDateSetup.start_date,
        end_date: endDateStr
      }));
      
      setQuickDateSetup(prev => ({
        ...prev,
        end_date: endDateStr,
        enabled: false
      }));
    }
  };

  const handleQuickDateByEndDate = () => {
    if (quickDateSetup.start_date && quickDateSetup.end_date) {
      setFormData(prev => ({
        ...prev,
        start_date: quickDateSetup.start_date,
        end_date: quickDateSetup.end_date
      }));
      
      setQuickDateSetup(prev => ({
        ...prev,
        enabled: false
      }));
    }
  };

  // project_code 唯一性檢查
  const checkProjectCodeUniqueness = async (projectCode: string): Promise<boolean> => {
    if (!projectCode.trim()) return true; // 空值不檢查
    
    try {
      let query = supabase
        .from('projects')
        .select('id')
        .eq('project_code', projectCode.trim());
      
      // 編輯模式時排除自身
      if (editingProject?.id) {
        query = query.neq('id', editingProject.id);
      }
      
      const { data, error } = await query.limit(1);
      
      if (error) {
        console.error('檢查計畫編號唯一性時發生錯誤:', error);
        return true; // 發生錯誤時允許通過，避免阻擋正常流程
      }
      
      return !data || data.length === 0; // 沒有找到重複 = 唯一
    } catch (error) {
      console.error('計畫編號唯一性檢查失敗:', error);
      return true; // 錯誤時允許通過
    }
  };

  const validateAdminFields = async () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.project_code.trim()) {
      newErrors.project_code = '計畫編號為必填欄位';
    } else {
      // 檢查 project_code 唯一性
      const isUnique = await checkProjectCodeUniqueness(formData.project_code);
      if (!isUnique) {
        newErrors.project_code = '計畫編號已存在，請使用其他編號';
      }
    }
    
    if (!formData.name.trim()) {
      newErrors.name = '計畫名稱為必填欄位';
    }
    
    if (!formData.executing_unit.trim()) {
      newErrors.executing_unit = '執行單位為必填欄位';
    }
    
    if (!formData.start_date) {
      newErrors.start_date = '計畫開始日為必填欄位';
    }
    
    if (!formData.end_date) {
      newErrors.end_date = '計畫結束日為必填欄位';
    }
    
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = '結束日不能早於開始日';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOperatorFields = () => {
    const newErrors: Record<string, string> = {};
    
    if (formData.budget <= 0) {
      newErrors.budget = '預算金額必須大於0';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '計畫描述為必填欄位';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // 管理員驗證（異步）
      if (isAdmin && !(await validateAdminFields())) {
        setLoading(false);
        return;
      }
      
      // 操作人員驗證
      if (isOperator && !validateOperatorFields()) {
        setLoading(false);
        return;
      }
      
      // 準備儲存的資料
      const projectData = {
        project_code: formData.project_code,
        name: formData.name,
        executing_unit: formData.executing_unit,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status,
        description: formData.description,
        budget: formData.budget,
        applied_amount: formData.applied_amount,
        approved_amount: formData.approved_amount,
        village: formData.village,
        legal_address: formData.legal_address,
        contact_address: formData.contact_address,
        site_types: formData.site_types,
        sites: formData.sites,
        category: formData.category,
        year: formData.year,
        period: formData.period,
        // 聯絡資訊以 JSON 格式儲存
        representative: {
          name: formData.manager_name,
          email: formData.manager_email,
          phone: formData.manager_phone
        },
        commissioner: {
          name: formData.advisor_name,
          email: formData.advisor_email,
          phone: formData.advisor_phone
        },
        assigned_operators: formData.assigned_user_id ? [formData.assigned_user_id] : [],
        progress: 0,
        spent: 0
      };
      
      // 執行保存並捕獲 Supabase 錯誤
      try {
        onSave(projectData);
      } catch (saveError: any) {
        // 捕獲 Supabase 唯一性約束錯誤
        if (saveError?.message?.includes('duplicate key') || 
            saveError?.message?.includes('already exists') || 
            saveError?.code === '23505') {
          setErrors({ project_code: '計畫編號已存在，請使用其他編號' });
        } else {
          setErrors({ general: '儲存失敗，請稍後重試' });
        }
        setLoading(false);
        return;
      }
      
    } catch (error) {
      console.error('儲存失敗:', error);
      setErrors({ general: '儲存失敗，請稍後重試' });
    } finally {
      setLoading(false);
    }
  };

  const renderAdminSection = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-blue-800">
            🔷 管理員開案區域
            {!isAdmin && <span className="text-sm font-normal text-blue-600 ml-2">（僅管理員可編輯）</span>}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {!isAdmin && (
            <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
              <Lock className="w-3 h-3" />
              <span>等待管理員開案完成</span>
            </div>
          )}
          {isAdmin && (
            <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-200 px-2 py-1 rounded">
              <Unlock className="w-3 h-3" />
              <span>可編輯</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 計畫編號 */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <Hash className="w-4 h-4 inline mr-1" />
            計畫編號 *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.project_code}
              onChange={(e) => handleProjectCodeChange(e.target.value)}
              disabled={!isAdmin}
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
              } ${errors.project_code ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="例如：MOC-2026-001"
            />
            {projectCodeChecking && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
          {errors.project_code && (
            <p className="text-red-500 text-xs mt-1">{errors.project_code}</p>
          )}
          {!isAdmin && (
            <p className="text-blue-600 text-xs mt-1">💡 此欄位由管理員填寫，必填且需唯一</p>
          )}
        </div>

        {/* 計畫名稱 */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <PlusCircle className="w-4 h-4 inline mr-1" />
            計畫名稱 *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            disabled={!isAdmin}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            } ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="請輸入計畫名稱"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        {/* 執行單位 */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <Building2 className="w-4 h-4 inline mr-1" />
            執行單位 *
          </label>
          <input
            type="text"
            value={formData.executing_unit}
            onChange={(e) => handleInputChange('executing_unit', e.target.value)}
            disabled={!isAdmin}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            } ${errors.executing_unit ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="請輸入執行單位名稱"
          />
          {errors.executing_unit && (
            <p className="text-red-500 text-xs mt-1">{errors.executing_unit}</p>
          )}
        </div>

        {/* 輔導老師資訊 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            輔導老師姓名
          </label>
          <input
            type="text"
            value={formData.advisor_name}
            onChange={(e) => handleInputChange('advisor_name', e.target.value)}
            disabled={!isAdmin}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="輔導老師姓名"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">輔導老師信箱</label>
          <input
            type="email"
            value={formData.advisor_email}
            onChange={(e) => handleInputChange('advisor_email', e.target.value)}
            disabled={!isAdmin}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="輔導老師信箱"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">輔導老師電話</label>
          <input
            type="tel"
            value={formData.advisor_phone}
            onChange={(e) => handleInputChange('advisor_phone', e.target.value)}
            disabled={!isAdmin}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="輔導老師電話"
          />
        </div>

        {/* 主責人員資訊 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            主責人員姓名
          </label>
          <input
            type="text"
            value={formData.manager_name}
            onChange={(e) => handleInputChange('manager_name', e.target.value)}
            disabled={!isAdmin}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="主責人員姓名"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">主責人員信箱</label>
          <input
            type="email"
            value={formData.manager_email}
            onChange={(e) => handleInputChange('manager_email', e.target.value)}
            disabled={!isAdmin}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="主責人員信箱"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">主責人員電話</label>
          <input
            type="tel"
            value={formData.manager_phone}
            onChange={(e) => handleInputChange('manager_phone', e.target.value)}
            disabled={!isAdmin}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="主責人員電話"
          />
        </div>

        {/* 指派操作人員 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">指派操作人員</label>
          <select
            value={formData.assigned_user_id}
            onChange={(e) => handleInputChange('assigned_user_id', e.target.value)}
            disabled={!isAdmin}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          >
            <option value="">請選擇操作人員</option>
            {users.filter(user => user.role === 'UNIT_OPERATOR').map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.unit_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 🗓️ 管理員專用：批次填入期程工具 */}
      {isAdmin && (
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="quickDate"
                checked={quickDateSetup.enabled}
                onChange={(e) => setQuickDateSetup(prev => ({ ...prev, enabled: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="quickDate" className="text-sm font-bold text-gray-700">
                <Calendar className="w-4 h-4 inline mr-1" />
                🚀 批次填入期程工具
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">管理員專用</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mb-3">💡 快速設定計畫期程，支援兩種方式：依月數計算或直接指定結束日</p>

          {quickDateSetup.enabled && (
            <div className="space-y-4 bg-white rounded-lg p-4 border border-blue-100">
              {/* 方式 1：開始日 + 月數 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  📅 方式 1：依月數自動計算
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">開始日期</label>
                    <input
                      type="date"
                      value={quickDateSetup.start_date}
                      onChange={(e) => setQuickDateSetup(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">執行月數</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={quickDateSetup.duration_months}
                      onChange={(e) => setQuickDateSetup(prev => ({ ...prev, duration_months: parseInt(e.target.value) || 12 }))}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleQuickDateCalculate}
                      disabled={!quickDateSetup.start_date}
                      className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      🎯 計算並套用
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 方式 2：直接指定 */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  🎥 方式 2：直接指定結束日
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">結束日期</label>
                    <input
                      type="date"
                      value={quickDateSetup.end_date}
                      onChange={(e) => setQuickDateSetup(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleQuickDateByEndDate}
                      disabled={!quickDateSetup.start_date || !quickDateSetup.end_date}
                      className="w-full bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      📦 套用日期區間
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 使用說明 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-xs text-yellow-800">
                  ℹ️ <strong>使用說明</strong>：點擊任一「套用」按鈕將自動填入上方「計畫開始日」和「計畫結束日」欄位
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 計畫日期 */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            計畫開始日 *
          </label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => handleInputChange('start_date', e.target.value)}
            disabled={!isAdmin}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            } ${errors.start_date ? 'border-red-300' : 'border-gray-300'}`}
          />
          {errors.start_date && (
            <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            計畫結束日 *
          </label>
          <input
            type="date"
            value={formData.end_date}
            onChange={(e) => handleInputChange('end_date', e.target.value)}
            disabled={!isAdmin}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            } ${errors.end_date ? 'border-red-300' : 'border-gray-300'}`}
          />
          {errors.end_date && (
            <p className="text-red-500 text-xs mt-1">{errors.end_date}</p>
          )}
        </div>
      </div>

      {/* 計畫狀態 */}
      <div className="mt-4">
        <label className="block text-sm font-bold text-gray-700 mb-2">
          <CheckCircle className="w-4 h-4 inline mr-1" />
          計畫狀態
        </label>
        <select
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value as ProjectStatus)}
          disabled={!isAdmin}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        >
          <option value={ProjectStatus.PLANNING}>規劃中</option>
          <option value={ProjectStatus.ONGOING}>執行中</option>
          <option value={ProjectStatus.REVIEWING}>考評中</option>
          <option value={ProjectStatus.COMPLETED}>已結案</option>
          <option value={ProjectStatus.STALLED}>進度落後</option>
        </select>
        <p className="text-xs mt-1">
          💡 <span className="font-semibold text-blue-700">管理員手動設定</span>：依管考進度調整工作流程狀態（未來可再做自動判斷）
        </p>
        {!isAdmin && (
          <p className="text-xs text-blue-600 mt-1">
            🔒 僅管理員可調整這個狀態欄位
          </p>
        )}
      </div>
    </div>
  );

  const renderOperatorSection = () => (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-bold text-green-800">
            📋 操作人員填寫區域
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {!isOperator && !isAdmin ? (
            <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
              <Lock className="w-3 h-3" />
              <span>僅操作人員可編輯</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {isOperator && (
                <div className="flex items-center gap-1 text-xs text-green-700 bg-green-200 px-2 py-1 rounded">
                  <Unlock className="w-3 h-3" />
                  <span>操作人員可編輯</span>
                </div>
              )}
              {isAdmin && (
                <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-200 px-2 py-1 rounded">
                  <Unlock className="w-3 h-3" />
                  <span>管理員全部可編輯</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 計畫描述 */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            計畫描述 *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            disabled={!isOperator && !isAdmin}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none ${
              !isOperator && !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            } ${errors.description ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="請詳細描述計畫內容、背景與重要性..."
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">{errors.description}</p>
          )}
          {!isOperator && !isAdmin && (
            <p className="text-green-600 text-xs mt-1">💡 此欄位由操作人員負責填寫，請等待開案完成後填寫</p>
          )}
        </div>

        {/* 預算相關 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            預算金額（元）*
          </label>
          <input
            type="number"
            min="0"
            value={formData.budget}
            onChange={(e) => handleInputChange('budget', parseInt(e.target.value) || 0)}
            disabled={!isOperator && !isAdmin}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              !isOperator && !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            } ${errors.budget ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="請輸入預算金額"
          />
          {errors.budget && (
            <p className="text-red-500 text-xs mt-1">{errors.budget}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">申請金額（元）</label>
          <input
            type="number"
            min="0"
            value={formData.applied_amount}
            onChange={(e) => handleInputChange('applied_amount', parseInt(e.target.value) || 0)}
            disabled={!isOperator && !isAdmin}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              !isOperator && !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="申請金額"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mess2">核定金額（元）</label>
          <input
            type="number"
            min="0"
            value={formData.approved_amount}
            onChange={(e) => handleInputChange('approved_amount', parseInt(e.target.value) || 0)}
            disabled={!isOperator && !isAdmin}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              !isOperator && !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="核定金額"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">實施村里</label>
          <input
            type="text"
            value={formData.village}
            onChange={(e) => handleInputChange('village', e.target.value)}
            disabled={!isOperator && !isAdmin}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              !isOperator && !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="實施村里"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">計畫分類</label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            disabled={!isOperator && !isAdmin}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              !isOperator && !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          >
            <option value="原鄉文化行動">原鄉文化行動</option>
            <option value="都市文化行動">都市文化行動</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">執行年度</label>
          <input
            type="text"
            value={formData.year}
            onChange={(e) => handleInputChange('year', e.target.value)}
            disabled={!isOperator && !isAdmin}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              !isOperator && !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="執行年度"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">執行期別</label>
          <select
            value={formData.period}
            onChange={(e) => handleInputChange('period', e.target.value)}
            disabled={!isOperator && !isAdmin}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              !isOperator && !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          >
            <option value="第一期">第一期</option>
            <option value="第二期">第二期</option>
            <option value="第三期">第三期</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">法人立案地址</label>
          <input
            type="text"
            value={formData.legal_address}
            onChange={(e) => handleInputChange('legal_address', e.target.value)}
            disabled={!isOperator && !isAdmin}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              !isOperator && !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="法人立案地址"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">通訊地址</label>
          <input
            type="text"
            value={formData.contact_address}
            onChange={(e) => handleInputChange('contact_address', e.target.value)}
            disabled={!isOperator && !isAdmin}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              !isOperator && !isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="通訊地址"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <PlusCircle className="w-6 h-6 text-blue-600" />
                新案提案申請
              </h1>
              <p className="text-gray-600 mt-1">
                分工協作式計畫建立 - 
                {isAdmin && '管理員開案模式'}
                {isOperator && '操作人員協作模式'}
              </p>
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

          {/* 管理員區域 */}
          {renderAdminSection()}

          {/* 操作人員區域 */}
          {renderOperatorSection()}
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
            
            {/* 只有管理員或操作人員可以儲存 */}
            {(isAdmin || isOperator) && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading ? '儲存中...' : '建立計畫'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSubmission;