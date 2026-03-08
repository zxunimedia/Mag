-- ========================================
-- Supabase Auth + RLS 修復腳本
-- 目標：解決 profiles 表的 RLS 遞迴問題
-- ========================================

-- 1. 先暫時禁用 profiles 表的 RLS（以便清理舊 policies）
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. 刪除所有現有的 profiles policies（避免衝突）
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_update" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;

-- 3. 建立安全的 helper function（使用 SECURITY DEFINER 避免遞迴）
-- 此 function 直接檢查 JWT 內的 claims，不查詢 profiles 表
CREATE OR REPLACE FUNCTION public.is_moc_admin_jwt()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    user_role text;
BEGIN
    -- 直接從 JWT claims 讀取 role（由 auth trigger 設定）
    user_role := auth.jwt() ->> 'role';
    
    -- 如果 JWT 中沒有 role，檢查是否為 service_role
    IF user_role IS NULL THEN
        -- service_role 可以執行所有操作（管理員在後台操作時）
        IF auth.role() = 'service_role' THEN
            return true;
        end if;
        return false;
    END IF;
    
    -- 管理員角色
    return user_role = 'MOC_ADMIN';
END;
$$;

-- 4. 建立 trigger function，在 auth.users 新增時自動同步 JWT claims
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_role text := 'UNIT_OPERATOR'; -- 預設角色
BEGIN
    -- 檢查是否已存在 profile（管理員先建立的情況）
    SELECT role INTO profile_role
    FROM public.profiles 
    WHERE id = NEW.id;
    
    -- 如果 profile 不存在，建立預設 profile
    IF NOT FOUND THEN
        INSERT INTO public.profiles (id, name, role, unit_id, unit_name, created_at, updated_at)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
            'UNIT_OPERATOR',
            null,
            null,
            NOW(),
            NOW()
        );
        profile_role := 'UNIT_OPERATOR';
    END IF;
    
    -- 更新 auth.users 的 raw_user_meta_data 加入 role
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', profile_role)
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;

-- 5. 建立 trigger function，當 profiles.role 更新時同步到 JWT
CREATE OR REPLACE FUNCTION public.sync_user_role_to_jwt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 同步 role 到 auth.users 的 metadata
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;

-- 6. 建立 triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_profile_role_updated ON public.profiles;
CREATE TRIGGER on_profile_role_updated
    AFTER UPDATE OF role ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_to_jwt();

-- 7. 重新啟用 profiles 表的 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 8. 建立新的 RLS policies（使用 JWT-based function 避免遞迴）

-- Policy 1: 允許使用者查看自己的 profile
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: 允許使用者更新自己的 profile（限制欄位）
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE
TO authenticated  
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = OLD.role); -- 使用者不能變更自己的角色

-- Policy 3: 管理員可以查看所有 profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_moc_admin_jwt());

-- Policy 4: 管理員可以插入新 profiles
CREATE POLICY "Admins can insert new profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (public.is_moc_admin_jwt());

-- Policy 5: 管理員可以更新所有 profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_moc_admin_jwt())
WITH CHECK (public.is_moc_admin_jwt());

-- Policy 6: 管理員可以刪除 profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.is_moc_admin_jwt());

-- Policy 7: service_role 可以執行所有操作（系統內部使用）
CREATE POLICY "Service role can do anything"
ON public.profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 9. 確保 profiles 表結構正確
-- 檢查並新增缺少的欄位
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 更新 updated_at 的 trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 10. 確保初始管理員帳號存在
-- 這裡我們不直接插入，而是準備一個 function 供第一次部署時使用
CREATE OR REPLACE FUNCTION public.create_initial_admin(admin_email text, admin_name text DEFAULT 'System Admin')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user_id uuid;
    result_message text;
BEGIN
    -- 檢查 admin 是否已存在於 auth.users
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = admin_email;
    
    IF admin_user_id IS NULL THEN
        return 'Admin user not found in auth.users. Please create the admin account first via Supabase Auth.';
    END IF;
    
    -- 更新或插入 admin profile
    INSERT INTO public.profiles (id, name, role, unit_id, unit_name, created_at, updated_at)
    VALUES (admin_user_id, admin_name, 'MOC_ADMIN', 'MOC', '文化部', NOW(), NOW())
    ON CONFLICT (id) 
    DO UPDATE SET 
        role = 'MOC_ADMIN',
        unit_id = 'MOC', 
        unit_name = '文化部',
        updated_at = NOW();
    
    -- 同步 role 到 JWT
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'MOC_ADMIN')
    WHERE id = admin_user_id;
    
    return 'Admin profile created/updated successfully for: ' || admin_email;
END;
$$;

-- ========================================
-- 測試查詢（可選執行）
-- ========================================

-- 查看當前 profiles policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'profiles';

-- 測試 is_moc_admin_jwt() function
-- SELECT public.is_moc_admin_jwt() as is_admin;

-- 查看 profiles 表結構
-- \d+ public.profiles;

-- ========================================
-- 部署後的管理員帳號設定說明
-- ========================================

/*
1. 請先在 Supabase Auth 中手動建立管理員帳號：
   Email: mag@atipd.tw
   Password: [設定安全密碼]

2. 然後執行以下 SQL 來設定管理員權限：
   SELECT public.create_initial_admin('mag@atipd.tw', 'MOC Admin');

3. 重要設定項目（請在 Supabase Dashboard 檢查）：
   - Authentication > Settings > Site URL: https://mocwork.atipd.tw
   - Authentication > URL Configuration > Redirect URLs: https://mocwork.atipd.tw/auth/callback
   - Authentication > Email Templates: 設定為繁體中文
   
4. 環境變數設定（Vercel Dashboard）：
   - VITE_SUPABASE_URL: [您的 Supabase Project URL]
   - VITE_SUPABASE_ANON_KEY: [您的 Supabase Anon Key]

5. 測試步驟：
   - 使用管理員帳號登入
   - 在權限管理新增使用者（測試 RLS 修復）
   - 測試一般使用者註冊和驗證流程
*/