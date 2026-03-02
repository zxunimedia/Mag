import { createClient } from '@supabase/supabase-js';

// ─── 環境變數讀取（加入診斷保護，避免 env 未載入時白屏）────────────
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '';

/** 若 false，代表環境變數未正確設定，所有 Supabase 呼叫將回傳錯誤 */
export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!supabaseConfigured) {
  console.warn('[Supabase] ⚠️ VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY 未設定。請在 Vercel Dashboard > Settings > Environment Variables 確認已新增這兩個變數，並重新部署。');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ─── 型別定義（對應資料庫欄位）───────────────────────────────

export interface DBProfile {
  id: string;
  name: string | null;
  role: 'MOC_ADMIN' | 'UNIT_OPERATOR' | 'COACH';
  unit_id: string | null;
  unit_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBProject {
  id: string;
  project_code: string | null;
  name: string;
  executing_unit: string;
  unit_id: string | null;
  unit_name: string | null;
  year: string;
  period: string;
  category: string;
  start_date: string;
  end_date: string;
  status: string;
  village: string;
  legal_address: string;
  contact_address: string;
  site_types: string[];
  sites: string[];
  applied_amount: number;
  approved_amount: number;
  budget: number;
  spent: number;
  progress: number;
  description: string;
  representative: Record<string, unknown>;
  liaison: Record<string, unknown>;
  commissioner: Record<string, unknown>;
  chief_staff: Record<string, unknown>;
  visions: unknown[];
  budget_items: unknown[];
  created_at: string;
  updated_at: string;
}

export interface DBGrantStage {
  id: string;
  project_id: string;
  stage: string;
  deadline: string | null;
  submission_date: string | null;
  document_sent_date: string | null;
  payment_received_date: string | null;
  payment_date: string | null;
  moc_final_check: string;
  moc_remark: string;
  documents: unknown[];
  created_at: string;
  updated_at: string;
}

// ─── 工具函數 ────────────────────────────────────────────────

/** 取得目前登入用戶的 profile */
export async function getCurrentProfile(): Promise<DBProfile | null> {
  if (!supabaseConfigured) {
    console.error('[Supabase] Cannot get profile: environment variables not configured');
    return null;
  }
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('[Supabase] getUser error:', userError.message);
    return null;
  }
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('[Supabase] Failed to get profile:', error.code, error.message, '| user.id:', user.id);
    return null;
  }
  return data as DBProfile;
}

/** 取得所有計畫（管理員）或被指派的計畫（操作人員） */
export async function fetchProjects(): Promise<DBProject[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch projects:', error);
    return [];
  }
  return (data ?? []) as DBProject[];
}

/** 取得指定計畫的撥付進度 */
export async function fetchGrantStages(projectId: string): Promise<DBGrantStage[]> {
  const { data, error } = await supabase
    .from('grant_stages')
    .select('*')
    .eq('project_id', projectId)
    .order('stage', { ascending: true });

  if (error) {
    console.error('Failed to fetch grant stages:', error);
    return [];
  }
  return (data ?? []) as DBGrantStage[];
}

/** 上傳文件到 Supabase Storage，回傳公開 URL */
export async function uploadGrantDocument(
  projectId: string,
  stageId: string,
  file: File
): Promise<string | null> {
  const filePath = `${projectId}/${stageId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage
    .from('grant-documents')
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.error('Failed to upload file:', error);
    return null;
  }

  const { data } = supabase.storage
    .from('grant-documents')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
