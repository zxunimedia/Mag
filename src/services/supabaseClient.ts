import { createClient } from '@supabase/supabase-js';

// ─── 環境變數讀取（加入診斷保護，避免 env 未載入時白屏）────────────
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '';

/** 若 false，代表環境變數未正確設定，所有 Supabase 呼叫將回傳錯誤 */
export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') && 
  !supabaseAnonKey.includes('placeholder'));

if (!supabaseConfigured) {
  console.warn('[Supabase] ⚠️ VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY 未正確設定。請在 Vercel Dashboard > Settings > Environment Variables 確認已新增這兩個變數，並重新部署。');
  console.warn('[Supabase] 當前值:', { supabaseUrl: supabaseUrl ? '已設定' : '未設定', supabaseAnonKey: supabaseAnonKey ? '已設定' : '未設定' });
}

// 設定正確的重導向 URL
const getRedirectURL = () => {
  if (typeof window !== 'undefined') {
    // 在瀏覽器中，使用當前的 origin
    return `${window.location.origin}/auth/callback`;
  }
  
  // 在 production 環境使用正式域名
  if (import.meta.env.PROD) {
    return 'https://mocwork.atipd.tw/auth/callback';
  }
  
  // 開發環境
  return 'http://localhost:3000/auth/callback';
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder', 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // 使用更安全的 PKCE 流程
    },
  }
);

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

// ─── Auth 相關工具函數 ────────────────────────────────────────

/** 檢查用戶是否為管理員（基於 JWT claims） */
export function isUserAdmin(user: any): boolean {
  if (!user) return false;
  
  // 檢查 JWT metadata 中的 role
  const userRole = user.user_metadata?.role || user.raw_user_meta_data?.role;
  return userRole === 'MOC_ADMIN';
}

/** 用戶註冊 */
export async function signUpUser(email: string, password: string, userData?: Record<string, any>) {
  if (!supabaseConfigured) {
    return { 
      data: null, 
      error: { message: 'Supabase 未正確配置，請檢查環境變數' } 
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: userData || {},
        emailRedirectTo: getRedirectURL()
      }
    });

    return { data, error };
  } catch (err) {
    console.error('SignUp error:', err);
    return { 
      data: null, 
      error: { message: err instanceof Error ? err.message : '註冊時發生未知錯誤' } 
    };
  }
}

/** 用戶登入 */
export async function signInUser(email: string, password: string) {
  if (!supabaseConfigured) {
    return { 
      data: null, 
      error: { message: 'Supabase 未正確配置，請檢查環境變數' } 
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    return { data, error };
  } catch (err) {
    console.error('SignIn error:', err);
    return { 
      data: null, 
      error: { message: err instanceof Error ? err.message : '登入時發生未知錯誤' } 
    };
  }
}

/** 發送密碼重設信 */
export async function resetPassword(email: string) {
  if (!supabaseConfigured) {
    return { 
      data: null, 
      error: { message: 'Supabase 未正確配置，請檢查環境變數' } 
    };
  }

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: getRedirectURL()
    });

    return { data, error };
  } catch (err) {
    console.error('Reset password error:', err);
    return { 
      data: null, 
      error: { message: err instanceof Error ? err.message : '重設密碼時發生未知錯誤' } 
    };
  }
}

/** 登出 */
export async function signOutUser() {
  if (!supabaseConfigured) {
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (err) {
    console.error('SignOut error:', err);
    return { error: err instanceof Error ? err : new Error('登出時發生未知錯誤') };
  }
}

/** 重新發送驗證信 */
export async function resendConfirmation(email: string) {
  if (!supabaseConfigured) {
    return { 
      data: null, 
      error: { message: 'Supabase 未正確配置，請檢查環境變數' } 
    };
  }

  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: getRedirectURL()
      }
    });

    return { data, error };
  } catch (err) {
    console.error('Resend confirmation error:', err);
    return { 
      data: null, 
      error: { message: err instanceof Error ? err.message : '重新發送驗證信時發生未知錯誤' } 
    };
  }
}

/** 設定新密碼（用於密碼重設流程） */
export async function updatePassword(newPassword: string) {
  if (!supabaseConfigured) {
    return { 
      data: null, 
      error: { message: 'Supabase 未正確配置，請檢查環境變數' } 
    };
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    return { data, error };
  } catch (err) {
    console.error('Update password error:', err);
    return { 
      data: null, 
      error: { message: err instanceof Error ? err.message : '更新密碼時發生未知錯誤' } 
    };
  }
}

/** 監聽 Auth 狀態變化 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  if (!supabaseConfigured) {
    console.warn('[Supabase] Cannot setup auth listener: not configured');
    return { data: { subscription: { unsubscribe: () => {} } } };
  }

  return supabase.auth.onAuthStateChange(callback);
}

/** 取得當前 session */
export async function getSession() {
  if (!supabaseConfigured) {
    return { data: { session: null }, error: null };
  }

  return await supabase.auth.getSession();
}

/** 管理員建立使用者帳號（透過 Supabase Admin API） */
export async function adminCreateUser(email: string, password: string, userData: {
  name: string;
  role: 'MOC_ADMIN' | 'COACH' | 'UNIT_OPERATOR';
  unit_id?: string | null;
  unit_name?: string | null;
}) {
  if (!supabaseConfigured) {
    return { 
      data: null, 
      error: { message: 'Supabase 未正確配置，請檢查環境變數' } 
    };
  }

  try {
    // 先建立 Auth 使用者
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { 
          name: userData.name,
          role: userData.role
        },
        emailRedirectTo: getRedirectURL()
      }
    });

    if (authError || !authData.user) {
      return { data: null, error: authError || { message: '建立使用者失敗' } };
    }

    // 建立對應的 profile 記錄
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        name: userData.name,
        role: userData.role,
        unit_id: userData.unit_id,
        unit_name: userData.unit_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // 不要拋出錯誤，因為 Auth 使用者已經建立成功
      // Trigger function 會自動建立基本的 profile
    }

    return { data: authData, error: null };

  } catch (err) {
    console.error('Admin create user error:', err);
    return { 
      data: null, 
      error: { message: err instanceof Error ? err.message : '建立使用者時發生未知錯誤' } 
    };
  }
}
