-- ============================================================
-- 文化部原村計畫管考系統 - project_code 唯一索引 Migration
-- 執行方式：在 Supabase Dashboard > SQL Editor 貼上執行
-- ============================================================

-- 檢查是否已存在 project_code 唯一索引
-- 如果沒有，則建立
DO $$
BEGIN
    -- 檢查索引是否已存在
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'projects' 
        AND indexname = 'projects_project_code_unique'
    ) THEN
        -- 建立唯一索引（允許 NULL 值）
        CREATE UNIQUE INDEX projects_project_code_unique 
        ON public.projects (project_code) 
        WHERE project_code IS NOT NULL;
        
        RAISE NOTICE 'Created unique index on project_code';
    ELSE
        RAISE NOTICE 'Unique index on project_code already exists';
    END IF;
END $$;