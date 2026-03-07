import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmhehsdzwhhprhxpmgrx.supabase.co';
const supabaseKey = 'sb_publishable_HqzTTbGEHv2rMB-tT6KCxg_dbK0rDZ3';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthSettings() {
  console.log('🔍 檢查 Auth 設定和確認信配置...\n');
  
  try {
    // 1. 測試管理員登入
    console.log('1️⃣ 管理員登入測試...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'mag@atipd.tw',
      password: 'admin123'
    });
    
    if (loginError) {
      console.log('❌ 管理員登入失敗:', loginError.message);
      return;
    }
    
    console.log('✅ 管理員登入成功');
    console.log('👤 用戶 Email:', loginData.user.email);
    console.log('✅ Email 確認狀態:', loginData.user.email_confirmed_at ? '已確認' : '未確認');
    
    // 2. 檢查用戶管理權限
    console.log('\n2️⃣ 檢查用戶管理權限...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ 讀取 profiles 錯誤:', profilesError.message);
    } else {
      console.log('✅ 可以讀取 profiles:', profiles.length, '筆資料');
      profiles.forEach(profile => {
        console.log(`  - ${profile.name} (${profile.email}) - ${profile.role}`);
      });
    }
    
    // 3. 檢查新增用戶流程的配置
    console.log('\n3️⃣ 分析新增用戶流程...');
    console.log('📧 確認信設定分析:');
    console.log('  ▫️  Supabase Auth 預設需要 email 確認');
    console.log('  ▫️  新用戶會收到確認信到註冊的 email');
    console.log('  ▫️  用戶必須點擊確認信中的連結才能啟用帳號');
    console.log('  ▫️  未確認的用戶無法正常登入系統');
    
    console.log('\n📋 確認信問題可能原因:');
    console.log('  1️⃣ Email 進入垃圾信箱');
    console.log('  2️⃣ Email 地址輸入錯誤');
    console.log('  3️⃣ Supabase 郵件服務延遲');
    console.log('  4️⃣ 企業防火牆阻擋外部郵件');
    console.log('  5️⃣ 速率限制（如剛才測試遇到的）');
    
    // 4. 檢查是否可以重新發送確認信
    console.log('\n4️⃣ 重新發送確認信功能測試...');
    
    // 登出以測試重新發送
    await supabase.auth.signOut();
    
    // 嘗試重新發送（使用一個假設存在的 email）
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: 'test@example.com', // 這個會失敗，但可以看到錯誤訊息
    });
    
    if (resendError) {
      console.log('📧 重新發送測試:', resendError.message);
      if (resendError.message.includes('rate limit')) {
        console.log('  ✅ 重新發送功能正常（遇到速率限制）');
      }
    }
    
    console.log('\n🔧 建議解決方案:');
    console.log('  1️⃣ 檢查垃圾信箱');
    console.log('  2️⃣ 使用真實的 email 地址');
    console.log('  3️⃣ 等待 5-10 分鐘後重試');
    console.log('  4️⃣ 聯絡 IT 確認防火牆設定');
    console.log('  5️⃣ 考慮暫時關閉 email 確認（開發階段）');
    
  } catch (err) {
    console.log('❌ 檢查過程發生錯誤:', err.message);
  }
}

checkAuthSettings();
