-- ============================================================
-- 文化部原村計畫管考系統 - C. DB / Supabase 完整實現
-- 執行方式：複製貼上至 Supabase Dashboard > SQL Editor 執行
-- ============================================================

-- 1) 確保 project_code 欄位存在（若已存在可重複執行，不會壞）
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS project_code text;

-- 2) 建立唯一索引：只限制非 NULL 值（允許 NULL，但有值就不能重複）
CREATE UNIQUE INDEX IF NOT EXISTS projects_project_code_unique
ON public.projects (project_code)
WHERE project_code IS NOT NULL;

-- 3)（建議）常用查詢加速 - 執行年度索引
CREATE INDEX IF NOT EXISTS projects_execution_year_idx
ON public.projects (year);

-- 4)（額外優化）其他常用查詢索引
CREATE INDEX IF NOT EXISTS projects_status_idx
ON public.projects (status);

CREATE INDEX IF NOT EXISTS projects_unit_id_idx
ON public.projects (unit_id);

-- 5) 驗證索引建立狀況
DO $$
BEGIN
    -- 檢查 project_code 欄位
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'project_code'
    ) THEN
        RAISE NOTICE '✅ project_code 欄位已存在';
    ELSE
        RAISE NOTICE '❌ project_code 欄位不存在';
    END IF;

    -- 檢查唯一索引
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'projects' 
        AND indexname = 'projects_project_code_unique'
        AND schemaname = 'public'
    ) THEN
        RAISE NOTICE '✅ project_code 唯一索引已建立';
    ELSE
        RAISE NOTICE '❌ project_code 唯一索引不存在';
    END IF;
    
    -- 檢查年度索引
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'projects' 
        AND indexname = 'projects_execution_year_idx'
        AND schemaname = 'public'
    ) THEN
        RAISE NOTICE '✅ 執行年度索引已建立';
    ELSE
        RAISE NOTICE '❌ 執行年度索引不存在';
    END IF;
END $$;

-- 6) 顯示最終結果
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'projects' 
  AND column_name = 'project_code';

SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'projects' 
  AND schemaname = 'public'
  AND indexname LIKE '%project_code%';

-- ============================================================
-- 完成！請複製以上全部 SQL 至 Supabase Dashboard > SQL Editor 執行
-- ============================================================