import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmhehsdzwhhprhxpmgrx.supabase.co';
const supabaseKey = 'sb_publishable_HqzTTbGEHv2rMB-tT6KCxg_dbK0rDZ3';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserPersistence() {
  console.log('🔍 檢查用戶資料持久性問題...\n');
  
  try {
    // 1. 管理員登入
    console.log('1️⃣ 管理員登入...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'mag@atipd.tw',
      password: 'admin123'
    });
    
    if (loginError) {
      console.log('❌ 管理員登入失敗:', loginError.message);
      return;
    }
    
    console.log('✅ 管理員登入成功');
    
    // 2. 檢查 profiles 表中的用戶資料
    console.log('\n2️⃣ 檢查 profiles 表資料...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      console.log('❌ 讀取 profiles 錯誤:', profilesError.message);
    } else {
      console.log(`✅ profiles 表共有 ${profiles.length} 筆資料:`);
      profiles.forEach((profile, index) => {
        console.log(`  ${index + 1}. ${profile.name || '(無名稱)'} - ${profile.email || '(無 Email)'} - ${profile.role}`);
        console.log(`     ID: ${profile.id}`);
        console.log(`     狀態: ${profile.status || '(未設定)'}`);
        console.log(`     建立時間: ${profile.created_at || '(未記錄)'}`);
        console.log('');
      });
    }
    
    // 3. 檢查 Supabase Auth 用戶
    console.log('3️⃣ 檢查 Supabase Auth 用戶...');
    
    // 只有管理員可以列出所有用戶（需要 service_role key）
    // 我們改為檢查當前登入用戶的資訊
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ 讀取當前用戶錯誤:', userError.message);
    } else {
      console.log('👤 當前登入用戶資訊:');
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Email 確認: ${user.email_confirmed_at ? '已確認' : '未確認'}`);
      console.log(`  建立時間: ${user.created_at}`);
      console.log(`  最後登入: ${user.last_sign_in_at}`);
    }
    
    // 4. 檢查 App.tsx 中的 loadUsers 函數邏輯
    console.log('\n4️⃣ 問題分析：');
    console.log('📋 可能的問題原因：');
    console.log('  1. 新增用戶時沒有正確儲存到 Supabase profiles 表');
    console.log('  2. loadUsers 函數沒有正確讀取 Supabase 資料');
    console.log('  3. 用戶資料存在本地狀態但沒有持久化');
    console.log('  4. 重新登入時覆蓋了本地新增的資料');
    
    console.log('\n🔧 建議解決方案：');
    console.log('  1. 修改 PermissionManagement 確保新增用戶時儲存到 Supabase');
    console.log('  2. 修改 loadUsers 函數優先讀取 Supabase profiles 資料');
    console.log('  3. 確保本地新增的用戶也會同步到 Supabase');
    console.log('  4. 改善錯誤處理，避免靜默失敗');
    
    await supabase.auth.signOut();
    
  } catch (err) {
    console.log('❌ 測試過程發生錯誤:', err.message);
  }
}

testUserPersistence();
