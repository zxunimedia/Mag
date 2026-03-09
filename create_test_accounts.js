/**
 * 測試帳號創建腳本
 * 模擬客戶註冊流程來創建測試帳號
 */

import { supabase, signUpUser } from './src/services/supabaseClient.js';

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
  console.log('🚀 開始創建測試帳號...\n');
  
  for (const account of testAccounts) {
    console.log(`📝 創建帳號: ${account.email}`);
    
    try {
      // 1. 註冊 Auth 用戶
      const { data: authData, error: authError } = await signUpUser(
        account.email,
        account.password,
        {
          name: account.name,
          role: account.role
        }
      );
      
      if (authError) {
        if (authError.message?.includes('User already registered')) {
          console.log(`   ⚠️  帳號已存在: ${account.email}`);
          continue;
        } else {
          console.log(`   ❌ 創建失敗: ${authError.message}`);
          continue;
        }
      }
      
      if (authData.user) {
        // 2. 創建 profile 記錄
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
          console.log(`   ⚠️  Profile 創建警告: ${profileError.message}`);
        }
        
        console.log(`   ✅ 成功創建: ${account.email} / ${account.password}`);
        
        // 3. 保存到 localStorage（模擬註冊成功後的保存）
        try {
          const registrationRecord = {
            id: authData.user.id,
            email: account.email,
            password: account.password,
            name: account.name,
            role: account.role,
            unitId: account.unitId,
            unitName: account.unitName,
            registeredAt: new Date().toISOString(),
            status: 'pending_verification'
          };
          
          // 這裡在 Node.js 環境中無法使用 localStorage，但在瀏覽器中會自動保存
          console.log(`   💾 記錄已準備保存到 localStorage`);
          
        } catch (storageError) {
          console.log(`   ⚠️  本地存儲警告: ${storageError.message}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ 創建過程發生錯誤: ${error.message}`);
    }
    
    console.log(''); // 空行分隔
  }
  
  console.log('🎉 測試帳號創建完成！');
  console.log('\n📋 客戶可使用的測試帳號：');
  console.log('================================');
  
  testAccounts.forEach((account, index) => {
    console.log(`${index + 1}. ${account.name}`);
    console.log(`   Email: ${account.email}`);
    console.log(`   密碼: ${account.password}`);
    console.log(`   角色: ${account.role === 'MOC_ADMIN' ? '系統管理員' : 
                         account.role === 'COACH' ? '輔導老師' : '操作人員'}`);
    console.log(`   單位: ${account.unitName}`);
    console.log('');
  });
  
  console.log('⚠️  重要提醒：');
  console.log('1. 這些帳號需要完成 Email 驗證才能登入');
  console.log('2. 請檢查對應的信箱並點擊驗證連結');
  console.log('3. 如果沒有收到驗證信，可能需要在 Supabase Dashboard 手動確認用戶');
}

// 執行腳本
createTestAccounts().catch(console.error);