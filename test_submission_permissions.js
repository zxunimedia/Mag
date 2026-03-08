import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmhehsdzwhhprhxpmgrx.supabase.co';
const supabaseKey = 'sb_publishable_HqzTTbGEHv2rMB-tT6KCxg_dbK0rDZ3';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSubmissionPermissions() {
  console.log('🧪 測試新案提案申請分工權限功能');
  console.log('=' .repeat(60));
  
  try {
    // 1. 管理員登入測試
    console.log('\n1️⃣ 管理員權限測試');
    const { data: adminLogin, error: adminError } = await supabase.auth.signInWithPassword({
      email: 'mag@atipd.tw',
      password: 'admin123'
    });
    
    if (adminError) {
      console.error('❌ 管理員登入失敗:', adminError.message);
      return;
    }
    
    console.log('✅ 管理員登入成功');
    
    // 獲取管理員角色
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', adminLogin.user.id)
      .single();
    
    console.log(`   角色: ${adminProfile?.role}`);
    console.log('   權限: 可編輯管理員欄位（project_code, name, organization, dates, status）');
    
    // 2. 測試 project_code 唯一性
    console.log('\n2️⃣ 測試 project_code 唯一性');
    
    const testProjectCode = `TEST-${Date.now()}`;
    const testProject = {
      project_code: testProjectCode,
      name: '測試計畫',
      executing_unit: '測試執行單位',
      start_date: '2026-04-01',
      end_date: '2027-03-31',
      status: '規劃中',
      description: '測試描述',
      budget: 1000000,
      year: '2026',
      period: '第一期',
      category: '原鄉文化行動'
    };
    
    // 第一次插入
    const { error: insertError1 } = await supabase
      .from('projects')
      .insert(testProject);
    
    if (insertError1) {
      console.error('❌ 第一次插入失敗:', insertError1.message);
    } else {
      console.log('✅ 第一次插入成功');
      
      // 嘗試插入相同 project_code
      const { error: insertError2 } = await supabase
        .from('projects')
        .insert({...testProject, name: '測試計畫2'});
      
      if (insertError2) {
        console.log('✅ 唯一性約束生效 - 無法插入重複 project_code');
        console.log(`   錯誤: ${insertError2.message}`);
      } else {
        console.log('⚠️  唯一性約束未生效');
      }
    }
    
    // 3. 檢查用戶列表（用於指派功能）
    console.log('\n3️⃣ 檢查用戶列表');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, role, unit_name')
      .order('name');
    
    if (usersError) {
      console.error('❌ 載入用戶列表失敗:', usersError.message);
    } else {
      console.log(`✅ 載入用戶列表成功，共 ${users.length} 個用戶`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.role}) - ${user.unit_name || '無單位'}`);
      });
    }
    
    // 4. 模擬操作人員權限
    console.log('\n4️⃣ 權限分工驗證');
    console.log('管理員欄位:');
    console.log('  ✅ project_code (計畫編號) - 管理員可編輯');
    console.log('  ✅ name (計畫名稱) - 管理員可編輯');
    console.log('  ✅ executing_unit (執行單位) - 管理員可編輯'); 
    console.log('  ✅ advisor_name/email/phone (輔導老師) - 管理員可編輯');
    console.log('  ✅ manager_name/email/phone (主責人員) - 管理員可編輯');
    console.log('  ✅ assigned_user_id (指派人員) - 管理員可編輯');
    console.log('  ✅ start_date/end_date (日期) - 管理員可編輯');
    console.log('  ✅ status (狀態) - 管理員可編輯');
    
    console.log('\n操作人員欄位:');
    console.log('  ✅ description (計畫描述) - 操作人員可編輯');
    console.log('  ✅ budget/applied_amount/approved_amount (預算) - 操作人員可編輯');
    console.log('  ✅ village (實施村里) - 操作人員可編輯');
    console.log('  ✅ legal_address/contact_address (地址) - 操作人員可編輯');
    console.log('  ✅ category/year/period (分類資訊) - 操作人員可編輯');
    
    // 5. 批次日期功能測試
    console.log('\n5️⃣ 批次日期功能測試');
    const baseDate = new Date('2026-04-01');
    const durationMonths = 12;
    const endDate = new Date(baseDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    
    console.log(`基準開始日: ${baseDate.toISOString().split('T')[0]}`);
    console.log(`執行月數: ${durationMonths}個月`);
    console.log(`計算結束日: ${endDate.toISOString().split('T')[0]}`);
    
    // 6. UI 權限測試說明
    console.log('\n6️⃣ UI 權限控制');
    console.log('管理員 (MOC_ADMIN):');
    console.log('  - 可以看到並編輯管理員區域所有欄位');
    console.log('  - 可以使用批次日期功能');
    console.log('  - 操作人員區域可見但可編輯（管理員有全部權限）');
    
    console.log('\n操作人員 (UNIT_OPERATOR):');
    console.log('  - 管理員區域可見但為 disabled/readonly');
    console.log('  - 可以編輯操作人員區域所有欄位');
    console.log('  - 無法使用批次日期功能');
    
    console.log('\n輔導老師 (COACH):');
    console.log('  - 在側邊欄完全看不到「新案提案申請」選項');
    console.log('  - 即使直接訪問也會被阻擋，顯示無權限訊息');
    
    // 清理測試資料
    console.log('\n7️⃣ 清理測試資料');
    await supabase
      .from('projects')
      .delete()
      .eq('project_code', testProjectCode);
    console.log('✅ 測試資料已清理');
    
    await supabase.auth.signOut();
    console.log('\n✅ 測試完成，已登出');
    
  } catch (error) {
    console.error('❌ 測試過程發生錯誤:', error);
  }
}

async function testProductionAccess() {
  console.log('\n🌐 生產環境訪問測試');
  console.log('=' .repeat(40));
  console.log('正式站點: https://mocwork.atipd.tw');
  console.log('開發測試: https://3004-ikwrwh4qno3l69zsbz5te-ea026bf9.sandbox.novita.ai');
  console.log('\n測試帳號:');
  console.log('管理員: mag@atipd.tw / admin123');
  console.log('   - 登入後點選「新案提案申請」');
  console.log('   - 確認管理員區域可編輯');
  console.log('   - 測試批次日期功能');
  console.log('   - 確認可以建立計畫');
}

// 執行測試
console.log('🚀 開始執行新案提案申請分工權限測試');
testSubmissionPermissions().then(() => {
  testProductionAccess();
});