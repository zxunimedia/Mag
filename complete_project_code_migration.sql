-- ============================================================
-- 文化部原村計畫管考系統 - project_code 欄位與唯一索引檢查
-- 目標：確保 project_code 欄位存在且具備唯一性約束
-- ============================================================

-- 檢查並新增 project_code 欄位（如果不存在）
DO $$
BEGIN
    -- 檢查欄位是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'project_code'
    ) THEN
        -- 新增 project_code 欄位
        ALTER TABLE public.projects 
        ADD COLUMN project_code text;
        
        RAISE NOTICE '✅ 已新增 project_code 欄位';
    ELSE
        RAISE NOTICE '✅ project_code 欄位已存在';
    END IF;
END $$;

-- 檢查並建立唯一索引
DO $$
BEGIN
    -- 檢查索引是否已存在
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'projects' 
        AND indexname = 'projects_project_code_unique'
        AND schemaname = 'public'
    ) THEN
        -- 建立唯一索引（允許 NULL 值）
        CREATE UNIQUE INDEX projects_project_code_unique 
        ON public.projects (project_code) 
        WHERE project_code IS NOT NULL;
        
        RAISE NOTICE '✅ 已建立 project_code 唯一索引';
    ELSE
        RAISE NOTICE '✅ project_code 唯一索引已存在';
    END IF;
END $$;

-- 驗證結果
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'projects' 
  AND column_name = 'project_code';

-- 列出相關索引
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'projects' 
  AND indexname LIKE '%project_code%'
  AND schemaname = 'public';