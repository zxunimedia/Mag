-- ========================================
-- 初始測試帳號創建腳本
-- 用途：為客戶提供立即可用的測試帳號
-- 使用方法：在 Supabase SQL Editor 中執行
-- ========================================

-- 1. 先清理可能存在的測試用戶（避免衝突）
DELETE FROM auth.users WHERE email IN (
  'admin-test@mocwork.com',
  'coach-test@mocwork.com', 
  'operator-test@mocwork.com',
  'admin@mocwork.com',
  'coach@mocwork.com',
  'operator@mocwork.com'
);

DELETE FROM public.profiles WHERE email IN (
  'admin-test@mocwork.com',
  'coach-test@mocwork.com',
  'operator-test@mocwork.com', 
  'admin@mocwork.com',
  'coach@mocwork.com',
  'operator@mocwork.com'
);

-- 2. 創建測試用戶（已驗證 email，可直接登入）

-- 管理員測試帳號
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@mocwork.com',
  crypt('admin123', gen_salt('bf')), -- 密碼: admin123
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "系統管理員", "role": "MOC_ADMIN"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 輔導老師測試帳號  
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 
  'authenticated',
  'coach@mocwork.com',
  crypt('coach123', gen_salt('bf')), -- 密碼: coach123
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "輔導老師", "role": "COACH"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 操作人員測試帳號
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated', 
  'operator@mocwork.com',
  crypt('operator123', gen_salt('bf')), -- 密碼: operator123
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "操作人員", "role": "UNIT_OPERATOR"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 3. 創建對應的 profiles 記錄

-- 管理員 profile
INSERT INTO public.profiles (
  id,
  name,
  email,
  role,
  unit_id,
  unit_name,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@mocwork.com'),
  '系統管理員',
  'admin@mocwork.com',
  'MOC_ADMIN',
  'MOC',
  '文化部',
  NOW(),
  NOW()
);

-- 輔導老師 profile  
INSERT INTO public.profiles (
  id,
  name,
  email,
  role,
  unit_id,
  unit_name,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'coach@mocwork.com'),
  '輔導老師',
  'coach@mocwork.com', 
  'COACH',
  'MOC',
  '文化部',
  NOW(),
  NOW()
);

-- 操作人員 profile
INSERT INTO public.profiles (
  id,
  name,
  email,
  role,
  unit_id,
  unit_name,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'operator@mocwork.com'),
  '操作人員',
  'operator@mocwork.com',
  'UNIT_OPERATOR',
  'TEST001', 
  '測試執行單位',
  NOW(),
  NOW()
);

-- 4. 驗證腳本執行結果
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL as email_verified,
  p.name,
  p.role,
  p.unit_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id  
WHERE u.email IN (
  'admin@mocwork.com',
  'coach@mocwork.com', 
  'operator@mocwork.com'
)
ORDER BY u.email;

-- 完成訊息
SELECT '✅ 初始測試帳號創建完成！客戶現在可以使用以下帳密登入：' as message;
SELECT 'admin@mocwork.com / admin123 (系統管理員)' as account_1;
SELECT 'coach@mocwork.com / coach123 (輔導老師)' as account_2;  
SELECT 'operator@mocwork.com / operator123 (操作人員)' as account_3;