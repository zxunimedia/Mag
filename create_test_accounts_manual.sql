-- ========================================
-- 簡化版初始測試帳號創建腳本  
-- 使用 Supabase Admin 面板手動創建用戶後執行
-- ========================================

-- 方法一：通過 Supabase Admin 面板創建用戶
-- 1. 前往 Supabase Dashboard > Authentication > Users
-- 2. 點擊 "Add user" 按鈕
-- 3. 創建以下三個用戶（請手動創建）：
--    Email: admin@mocwork.com,    Password: admin123,    Auto Confirm: true  
--    Email: coach@mocwork.com,    Password: coach123,    Auto Confirm: true
--    Email: operator@mocwork.com, Password: operator123, Auto Confirm: true

-- 方法二：執行以下 SQL 創建 profiles 記錄
-- （注意：需要先在 Admin 面板創建對應的 auth 用戶）

-- 清理現有 profiles（如果存在）
DELETE FROM public.profiles WHERE email IN (
  'admin@mocwork.com',
  'coach@mocwork.com',
  'operator@mocwork.com'
);

-- 創建管理員 profile
-- 注意：需要替換 'USER_ID_FROM_AUTH_PANEL' 為實際的用戶 ID
INSERT INTO public.profiles (
  id,
  name,
  email, 
  role,
  unit_id,
  unit_name,
  created_at,
  updated_at
) VALUES 
-- 管理員帳號
(
  'REPLACE_WITH_ADMIN_USER_ID',  -- 需要手動替換為 auth.users 中的實際 ID
  '系統管理員',
  'admin@mocwork.com',
  'MOC_ADMIN',
  'MOC',
  '文化部',
  NOW(),
  NOW()
),
-- 輔導老師帳號  
(
  'REPLACE_WITH_COACH_USER_ID',  -- 需要手動替換為 auth.users 中的實際 ID
  '輔導老師',
  'coach@mocwork.com',
  'COACH', 
  'MOC',
  '文化部',
  NOW(),
  NOW()
),
-- 操作人員帳號
(
  'REPLACE_WITH_OPERATOR_USER_ID',  -- 需要手動替換為 auth.users 中的實際 ID
  '操作人員', 
  'operator@mocwork.com',
  'UNIT_OPERATOR',
  'TEST001',
  '測試執行單位',
  NOW(), 
  NOW()
);

-- 驗證結果
SELECT 
  name,
  email,
  role,
  unit_name,
  created_at
FROM public.profiles 
WHERE email IN (
  'admin@mocwork.com',
  'coach@mocwork.com',
  'operator@mocwork.com'
)
ORDER BY email;