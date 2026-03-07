import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmhehsdzwhhprhxpmgrx.supabase.co';
const supabaseKey = 'sb_publishable_HqzTTbGEHv2rMB-tT6KCxg_dbK0rDZ3';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailConfirmation() {
  console.log('🔍 檢查確認信設定...');
  
  try {
    // 1. 檢查當前用戶狀態
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.log('❌ Session 錯誤:', sessionError.message);
      return;
    }
    
    console.log('📧 當前 session:', session ? '已登入' : '未登入');
    
    // 2. 測試新增用戶（使用真實格式的 email）
    const testEmail = `test${Date.now()}@moctest.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('👤 測試新增用戶...');
    console.log('📧 Email:', testEmail);
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: '測試用戶',
          role: 'COACH'
        }
      }
    });
    
    if (error) {
      console.log('❌ 新增用戶錯誤:', error.message);
      console.log('🔍 錯誤詳情:', error);
      
      // 檢查是否為速率限制
      if (error.message.includes('rate limit')) {
        console.log('⚠️  遇到速率限制，這表示 Supabase 正常運作');
      }
      
      return;
    }
    
    console.log('✅ 新增用戶成功');
    console.log('👤 用戶資料:', data.user ? '已建立' : '未建立');
    console.log('📧 需要確認:', data.user && !data.user.email_confirmed_at);
    
    if (data.user) {
      console.log('🆔 用戶 ID:', data.user.id);
      console.log('📧 用戶 Email:', data.user.email);
      console.log('✅ 確認狀態:', data.user.email_confirmed_at ? '已確認' : '待確認');
    }
    
    // 3. 檢查是否有 session（某些配置下會直接登入）
    if (data.session) {
      console.log('🔑 自動登入:', '是');
    } else {
      console.log('📧 確認信狀態:', '需要確認 email');
    }
    
  } catch (err) {
    console.log('❌ 測試過程發生錯誤:', err.message);
  }
}

testEmailConfirmation();
