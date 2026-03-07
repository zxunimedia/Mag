import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmhehsdzwhhprhxpmgrx.supabase.co';
const supabaseKey = 'sb_publishable_HqzTTbGEHv2rMB-tT6KCxg_dbK0rDZ3';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteUserFlow() {
  console.log('🧪 測試完整的用戶創建和載入流程...\n');
  
  try {
    // 1. 管理員登入
    console.log('1️⃣ 管理員登入');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'mag@atipd.tw',
      password: 'admin123'
    });
    
    if (loginError) {
      console.error('❌ 登入失敗:', loginError.message);
      return;
    }
    console.log('✅ 管理員登入成功');
    
    // 2. 查看登入前的用戶數量
    console.log('\n2️⃣ 查看現有用戶');
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('*');
    console.log(`📊 現有用戶數量: ${existingProfiles?.length || 0}`);
    
    // 3. 創建測試用戶（模擬 handleAddUser）
    console.log('\n3️⃣ 創建新用戶（輔導老師）');
    const testUserData = {
      name: '測試輔導老師',
      email: `testcoach@gmail.com`,
      password: 'testpass123',
      role: 'COACH'
    };
    
    console.log(`   👤 用戶資料: ${testUserData.name} (${testUserData.email})`);
    
    // 3a. 創建 Auth 用戶
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testUserData.email,
      password: testUserData.password,
      email_confirm: true,
      user_metadata: { name: testUserData.name }
    });
    
    if (authError) {
      console.error('❌ Auth 用戶創建失敗:', authError.message);
      
      // 嘗試使用一般 signUp
      console.log('   🔄 嘗試使用一般註冊方式...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testUserData.email,
        password: testUserData.password,
        options: { data: { name: testUserData.name } }
      });
      
      if (signUpError) {
        console.error('❌ 註冊也失敗:', signUpError.message);
        return;
      }
      
      console.log('✅ 使用註冊方式成功');
      var userId = signUpData.user?.id;
    } else {
      console.log('✅ Auth 用戶創建成功');
      var userId = authData.user?.id;
    }
    
    if (!userId) {
      console.error('❌ 無法取得用戶 ID');
      return;
    }
    
    console.log(`   🆔 用戶 ID: ${userId}`);
    
    // 3b. 創建 Profile
    console.log('   📝 創建用戶資料...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        name: testUserData.name,
        role: 'COACH',
        unit_id: 'MOC',
        unit_name: '文化部',
        created_at: new Date().toISOString()
      });
    
    if (profileError) {
      console.error('❌ Profile 創建失敗:', profileError.message);
      return;
    }
    console.log('✅ Profile 創建成功');
    
    // 4. 驗證用戶已被創建
    console.log('\n4️⃣ 驗證用戶創建結果');
    const { data: newProfiles } = await supabase
      .from('profiles')
      .select('*');
    console.log(`📊 更新後用戶數量: ${newProfiles?.length || 0}`);
    
    if (newProfiles) {
      console.log('📋 所有用戶列表:');
      newProfiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.name} (${profile.role}) - ID: ${profile.id.slice(0, 8)}...`);
      });
    }
    
    // 5. 模擬 loadUsers 函數
    console.log('\n5️⃣ 模擬 loadUsers 載入流程');
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, role, unit_id, unit_name, created_at')
      .order('created_at', { ascending: true });
    
    if (profiles) {
      const roleMap = {
        'MOC_ADMIN': 'ADMIN',
        'COACH': 'COACH',
        'UNIT_OPERATOR': 'OPERATOR',
      };
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const mappedUsers = profiles.map((profile) => {
        const userEmail = (currentUser && currentUser.id === profile.id) 
          ? (currentUser.email || '') 
          : `user-${profile.id.slice(0, 8)}@system.local`;
        
        return {
          id: profile.id,
          name: profile.name || '未命名',
          email: userEmail,
          role: roleMap[profile.role] || 'OPERATOR',
          unitId: profile.unit_id || '',
          unitName: profile.unit_name || '',
          createdAt: profile.created_at,
        };
      });
      
      console.log('✅ loadUsers 模擬結果:');
      mappedUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.role}) - ${user.email}`);
      });
    }
    
    // 6. 清理測試資料
    console.log('\n6️⃣ 清理測試資料');
    if (userId) {
      await supabase.from('profiles').delete().eq('id', userId);
      console.log('🧹 測試用戶資料已清理');
    }
    
    console.log('\n✅ 測試完成！');
    
  } catch (error) {
    console.error('❌ 測試過程發生錯誤:', error);
  } finally {
    await supabase.auth.signOut();
  }
}

testCompleteUserFlow();