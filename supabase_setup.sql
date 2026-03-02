-- ============================================================
-- 文化部原村計畫管考系統 - Supabase 資料表建立 SQL
-- 執行順序：在 Supabase Dashboard > SQL Editor 貼上執行
-- ============================================================

-- 1. profiles（用戶角色擴充表）
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text,
  role        text NOT NULL DEFAULT 'UNIT_OPERATOR'
                CHECK (role IN ('MOC_ADMIN', 'UNIT_OPERATOR', 'COACH')),
  unit_id     text,
  unit_name   text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- profiles RLS：用戶可讀自己；管理員可讀寫全部
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'MOC_ADMIN'
    )
  );

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'MOC_ADMIN'
    )
  );

-- 2. projects（主計畫表）
CREATE TABLE IF NOT EXISTS public.projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code    text,
  name            text NOT NULL DEFAULT '',
  executing_unit  text NOT NULL DEFAULT '',
  unit_id         text,
  unit_name       text,
  year            text DEFAULT '',
  period          text DEFAULT '',
  category        text DEFAULT '',
  start_date      text DEFAULT '',
  end_date        text DEFAULT '',
  status          text DEFAULT '規劃中',
  village         text DEFAULT '',
  legal_address   text DEFAULT '',
  contact_address text DEFAULT '',
  site_types      text[] DEFAULT '{}',
  sites           text[] DEFAULT '{}',
  applied_amount  numeric DEFAULT 0,
  approved_amount numeric DEFAULT 0,
  budget          numeric DEFAULT 0,
  spent           numeric DEFAULT 0,
  progress        integer DEFAULT 0,
  description     text DEFAULT '',
  representative  jsonb DEFAULT '{}',
  liaison         jsonb DEFAULT '{}',
  commissioner    jsonb DEFAULT '{}',
  chief_staff     jsonb DEFAULT '{}',
  visions         jsonb DEFAULT '[]',
  budget_items    jsonb DEFAULT '[]',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- projects RLS：管理員可讀寫全部；操作人員只能讀寫被指派的計畫
CREATE POLICY "projects_admin_all" ON public.projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'MOC_ADMIN'
    )
  );

CREATE POLICY "projects_operator_select" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_assignments pa
      WHERE pa.project_id = id AND pa.user_id = auth.uid()
    )
  );

CREATE POLICY "projects_operator_update" ON public.projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_assignments pa
      WHERE pa.project_id = id AND pa.user_id = auth.uid()
    )
  );

-- 3. project_assignments（計畫指派關聯表）
CREATE TABLE IF NOT EXISTS public.project_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'UNIT_OPERATOR',
  created_at  timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assignments_admin_all" ON public.project_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'MOC_ADMIN'
    )
  );

CREATE POLICY "assignments_operator_select" ON public.project_assignments
  FOR SELECT USING (user_id = auth.uid());

-- 4. grant_stages（撥付進度表）
CREATE TABLE IF NOT EXISTS public.grant_stages (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  stage                   text NOT NULL,
  deadline                text,
  submission_date         text,
  document_sent_date      text,
  payment_received_date   text,
  payment_date            text,
  moc_final_check         text DEFAULT '—',
  moc_remark              text DEFAULT '',
  documents               jsonb DEFAULT '[]',
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

ALTER TABLE public.grant_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grant_stages_admin_all" ON public.grant_stages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'MOC_ADMIN'
    )
  );

CREATE POLICY "grant_stages_operator_select" ON public.grant_stages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_assignments pa
      WHERE pa.project_id = project_id AND pa.user_id = auth.uid()
    )
  );

CREATE POLICY "grant_stages_operator_update" ON public.grant_stages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_assignments pa
      WHERE pa.project_id = project_id AND pa.user_id = auth.uid()
    )
  );

-- 5. Storage bucket（文件上傳）
-- 在 Supabase Dashboard > Storage 手動建立名為 "grant-documents" 的 bucket
-- 設定為 Private（需驗證才能存取）

-- ============================================================
-- 初始管理員帳號設定（在 Supabase Auth 建立帳號後執行）
-- 將 'YOUR_ADMIN_UUID' 替換為 mag@atipd.tw 的 auth.users.id
-- ============================================================
-- INSERT INTO public.profiles (id, name, role, unit_id, unit_name)
-- VALUES ('YOUR_ADMIN_UUID', '文化部管理員', 'MOC_ADMIN', 'MOC', '文化部');

-- ============================================================
-- 自動建立 profile 的 trigger（新用戶註冊時自動建立）
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'UNIT_OPERATOR')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
