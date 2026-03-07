import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmhehsdzwhhprhxpmgrx.supabase.co';
const supabaseKey = 'sb_publishable_HqzTTbGEHv2rMB-tT6KCxg_dbK0rDZ3';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesSchema() {
  console.log('🔍 檢查 profiles 表結構...');
  
  try {
    // 管理員登入
    await supabase.auth.signInWithPassword({
      email: 'mag@atipd.tw',
      password: 'admin123'
    });
    
    // 獲取現有資料來了解表結構
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ 查詢失敗:', error.message);
      return;
    }
    
    if (profiles && profiles.length > 0) {
      console.log('✅ profiles 表結構分析：');
      const profile = profiles[0];
      Object.keys(profile).forEach((key, index) => {
        console.log(`   ${index + 1}. ${key}: ${typeof profile[key]} = ${profile[key]}`);
      });
    }
    
    // 嘗試不使用 email 欄位的插入測試
    console.log('\n🧪 測試不包含 email 的插入：');
    const testId = `test-${Date.now()}`;
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testId,
        name: '測試輔導老師',
        role: 'COACH',
        unit_id: 'MOC',
        unit_name: '文化部',
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('❌ 插入失敗:', insertError.message);
    } else {
      console.log('✅ 插入成功');
      
      // 驗證插入結果
      const { data: inserted } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testId);
      
      if (inserted && inserted.length > 0) {
        console.log('   插入的資料:', inserted[0]);
      }
      
      // 清理測試資料
      await supabase.from('profiles').delete().eq('id', testId);
      console.log('🧹 測試資料已清理');
    }
    
    await supabase.auth.signOut();
    console.log('\n✅ 檢查完成');
    
  } catch (error) {
    console.error('❌ 檢查過程發生錯誤:', error);
  }
}

checkProfilesSchema();