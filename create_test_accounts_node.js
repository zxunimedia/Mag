/**
 * 為客戶創建測試帳號的 Node.js 腳本
 */
import { createClient } from '@supabase/supabase-js';

// 需要配置 Supabase 環境變數
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
  console.log('❌ 請先配置 Supabase 環境變數:');
  console.log('   export VITE_SUPABASE_URL=你的Supabase網址');
  console.log('   export VITE_SUPABASE_ANON_KEY=你的Supabase匿名金鑰');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const testAccounts = [
  {
    name: '系統管理員',
    email: 'admin-test@mocwork.com',
    password: 'admin123456', 
    role: 'MOC_ADMIN',
    unitId: 'MOC',
    unitName: '文化部'
  },
  {
    name: '輔導老師',
    email: 'coach-test@mocwork.com',
    password: 'coach123456',
    role: 'COACH', 
    unitId: 'MOC',
    unitName: '文化部'
  },
  {
    name: '操作人員',
    email: 'operator-test@mocwork.com',
    password: 'operator123456',
    role: 'UNIT_OPERATOR',
    unitId: 'TEST001', 
    unitName: '測試執行單位'
  }
];

async function createTestAccounts() {
  console.log('🚀 開始為客戶創建測試帳號...\n');
  
  const createdAccounts = [];
  
  for (const account of testAccounts) {
    console.log(`📝 創建帳號: ${account.email}`);
    
    try {
      // 1. 註冊 Supabase Auth 用戶
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: {
            name: account.name,
            role: account.role
          }
        }
      });
      
      if (authError) {
        if (authError.message?.includes('User already registered')) {
          console.log(`   ⚠️  帳號已存在，跳過: ${account.email}`);
          createdAccounts.push(account); // 仍然加入清單
          continue;
        } else {
          console.log(`   ❌ Auth 創建失敗: ${authError.message}`);
          continue;
        }
      }
      
      if (authData.user) {
        console.log(`   ✅ Auth 用戶創建成功: ${authData.user.id}`);
        
        // 2. 創建 profiles 記錄
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            name: account.name,
            email: account.email, 
            role: account.role,
            unit_id: account.unitId,
            unit_name: account.unitName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (profileError) {
          console.log(`   ⚠️  Profile 創建失敗: ${profileError.message}`);
          console.log(`   💡 這可能是正常的，如果有 trigger 會自動創建 profile`);
        } else {
          console.log(`   ✅ Profile 記錄創建成功`);
        }
        
        createdAccounts.push(account);
        console.log(`   🎯 帳號完全創建成功！`);
      }
      
    } catch (error) {
      console.log(`   ❌ 創建過程發生錯誤: ${error.message}`);
    }
    
    console.log(''); // 空行分隔
    
    // 避免過於頻繁的請求
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (createdAccounts.length > 0) {
    console.log('🎉 測試帳號創建完成！');
    console.log('\n📋 請提供給客戶的測試帳號清單：');
    console.log('================================================');
    
    createdAccounts.forEach((account, index) => {
      const roleDisplay = {
        'MOC_ADMIN': '系統管理員',
        'COACH': '輔導老師', 
        'UNIT_OPERATOR': '操作人員'
      }[account.role];
      
      console.log(`${index + 1}. ${roleDisplay}帳號`);
      console.log(`   Email: ${account.email}`);
      console.log(`   密碼: ${account.password}`);
      console.log(`   角色: ${roleDisplay}`);
      console.log(`   單位: ${account.unitName} (${account.unitId})`);
      console.log('');
    });
    
    console.log('⚠️  重要提醒給客戶：');
    console.log('1. 這些帳號需要完成 Email 驗證才能登入');
    console.log('2. 請檢查信箱並點擊驗證連結啟用帳號'); 
    console.log('3. 如果沒收到驗證信，請聯繫技術支援');
    console.log('4. 驗證完成後即可使用上述帳密登入測試');
    
    // 生成客戶使用的格式化清單
    console.log('\n📄 客戶使用格式 (可直接複製給客戶):');
    console.log('===========================================');
    createdAccounts.forEach((account, index) => {
      const roleDisplay = {
        'MOC_ADMIN': '系統管理員',
        'COACH': '輔導老師',
        'UNIT_OPERATOR': '操作人員'  
      }[account.role];
      
      console.log(`# ${index + 1}. ${roleDisplay}帳號`);
      console.log(`Email: ${account.email}`);
      console.log(`密碼: ${account.password}`);
      console.log(`角色: ${roleDisplay}`);
      if (account.unitId !== 'MOC') {
        console.log(`單位: ${account.unitName} (${account.unitId})`);
      }
      console.log('');
    });
    
  } else {
    console.log('❌ 沒有成功創建任何測試帳號');
  }
}

// 執行腳本
createTestAccounts().catch(console.error);