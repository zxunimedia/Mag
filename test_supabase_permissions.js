import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmhehsdzwhhprhxpmgrx.supabase.co';
const supabaseKey = 'sb_publishable_HqzTTbGEHv2rMB-tT6KCxg_dbK0rDZ3';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabasePermissions() {
  console.log('🔍 測試 Supabase 資料庫權限...');
  
  try {
    // 1. 管理員登入測試
    console.log('\n1. 管理員登入測試');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'mag@atipd.tw',
      password: 'admin123'
    });
    
    if (loginError) {
      console.error('❌ 登入失敗:', loginError.message);
      return;
    }
    console.log('✅ 管理員登入成功');
    
    // 2. 讀取權限測試
    console.log('\n2. 讀取 profiles 表測試');
    const { data: profiles, error: readError } = await supabase
      .from('profiles')
      .select('*');
    
    if (readError) {
      console.error('❌ 讀取失敗:', readError.message);
    } else {
      console.log(`✅ 讀取成功，共 ${profiles.length} 筆記錄`);
      profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.name} (${profile.role}) - ${profile.email || '無 email'}`);
      });
    }
    
    // 3. 寫入權限測試
    console.log('\n3. 寫入權限測試');
    const testProfile = {
      id: `test-${Date.now()}`,
      name: '測試用戶',
      email: `test${Date.now()}@test.com`,
      role: 'COACH',
      unit_id: 'MOC',
      unit_name: '文化部',
      created_at: new Date().toISOString()
    };
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert(testProfile);
    
    if (insertError) {
      console.error('❌ 插入測試失敗:', insertError.message);
      console.error('錯誤詳細:', insertError);
    } else {
      console.log('✅ 插入測試成功');
      
      // 清理測試資料
      await supabase
        .from('profiles')
        .delete()
        .eq('id', testProfile.id);
      console.log('🧹 測試資料已清理');
    }
    
    // 4. Upsert 權限測試
    console.log('\n4. Upsert 權限測試');
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: loginData.user.id,
        name: '文化部管理員',
        email: loginData.user.email,
        role: 'MOC_ADMIN',
        unit_id: 'MOC',
        unit_name: '文化部',
        updated_at: new Date().toISOString()
      });
    
    if (upsertError) {
      console.error('❌ Upsert 測試失敗:', upsertError.message);
    } else {
      console.log('✅ Upsert 測試成功');
    }
    
    // 5. 登出
    await supabase.auth.signOut();
    console.log('\n✅ 測試完成，已登出');
    
  } catch (error) {
    console.error('❌ 測試過程發生錯誤:', error);
  }
}

testSupabasePermissions();