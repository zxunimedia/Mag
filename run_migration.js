import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmhehsdzwhhprhxpmgrx.supabase.co';
const supabaseKey = 'sb_publishable_HqzTTbGEHv2rMB-tT6KCxg_dbK0rDZ3';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🔧 執行 project_code 唯一索引 Migration');
  
  try {
    // 管理員登入以獲得更高權限
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: 'mag@atipd.tw',
      password: 'admin123'
    });
    
    if (loginError) {
      console.error('❌ 登入失敗:', loginError.message);
      return;
    }
    
    // 註：由於使用的是 anon key，我們無法直接執行 DDL
    // 這個 migration 需要在 Supabase Dashboard > SQL Editor 手動執行
    
    console.log('⚠️  Migration 需要在 Supabase Dashboard 手動執行');
    console.log('📝 請複製以下 SQL 到 Supabase Dashboard > SQL Editor 執行：');
    console.log('');
    console.log('-- Create unique index on project_code');
    console.log('CREATE UNIQUE INDEX IF NOT EXISTS projects_project_code_unique');
    console.log('ON public.projects (project_code)');
    console.log('WHERE project_code IS NOT NULL;');
    console.log('');
    
    // 測試現有資料
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('project_code')
      .not('project_code', 'is', null);
    
    console.log(`📊 現有包含 project_code 的計畫數量: ${existingProjects?.length || 0}`);
    
    if (existingProjects && existingProjects.length > 0) {
      const duplicates = existingProjects
        .map(p => p.project_code)
        .filter((code, index, arr) => arr.indexOf(code) !== index);
      
      if (duplicates.length > 0) {
        console.log('⚠️  發現重複的 project_code，需要清理後才能建立唯一索引:');
        duplicates.forEach(code => console.log(`   - ${code}`));
      } else {
        console.log('✅ 沒有重複的 project_code，可以安全建立唯一索引');
      }
    }
    
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('❌ Migration 檢查失敗:', error);
  }
}

runMigration();