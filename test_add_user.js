// 測試新增用戶功能
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bmhehsdzwhhprhxpmgrx.supabase.co'
const supabaseKey = 'sb_publishable_HqzTTbGEHv2rMB-tT6KCxg_dbK0rDZ3'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 測試權限管理 - 新增用戶功能...')

// 管理員登入
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: 'mag@atipd.tw',
  password: 'admin123'
})

if (authError) {
  console.log('❌ 管理員登入失敗:', authError.message)
  process.exit(1)
}

console.log('✅ 管理員已登入，測試新增用戶...')

// 生成測試用戶資料
const timestamp = Date.now()
const testUser = {
  email: `testuser${timestamp}@example.com`,
  password: 'testpass123',
  name: '測試輔導老師',
  role: 'COACH',
  unitId: 'unit-test',
  unitName: '測試協會'
}

console.log('👤 測試用戶資料:', {
  email: testUser.email,
  name: testUser.name,
  role: testUser.role,
  unitName: testUser.unitName
})

// 模擬 handleAddUser 功能
try {
  // Step 1: 建立 Auth 用戶
  console.log('📝 建立 Auth 用戶...')
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testUser.email,
    password: testUser.password,
    options: {
      data: {
        name: testUser.name
      }
    }
  })
  
  if (signUpError) {
    console.log('❌ 建立 Auth 用戶失敗:', signUpError.message)
    process.exit(1)
  }
  
  console.log('✅ Auth 用戶建立成功:', signUpData.user.id)
  
  // Step 2: 建立 Profile
  console.log('📝 建立 Profile...')
  const roleMapping = {
    ADMIN: 'MOC_ADMIN',
    COACH: 'COACH', 
    OPERATOR: 'UNIT_OPERATOR'
  }
  
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: signUpData.user.id,
      name: testUser.name,
      role: roleMapping[testUser.role],
      unit_id: testUser.unitId,
      unit_name: testUser.unitName,
      created_at: new Date().toISOString()
    }, { 
      onConflict: 'id' 
    })
  
  if (profileError) {
    console.log('❌ 建立 Profile 失敗:', profileError.message)
  } else {
    console.log('✅ Profile 建立成功!')
  }
  
  // Step 3: 驗證新用戶
  console.log('🔍 驗證新增用戶...')
  const { data: users, error: loadError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at')
  
  if (loadError) {
    console.log('❌ 載入用戶失敗:', loadError.message)
  } else {
    console.log('✅ 用戶驗證成功!')
    console.log('👥 總用戶數:', users.length)
    const newUser = users.find(u => u.id === signUpData.user.id)
    if (newUser) {
      console.log('🎉 新用戶資料:', {
        name: newUser.name,
        role: newUser.role,
        unit: newUser.unit_name
      })
    }
  }
  
} catch (e) {
  console.log('❌ 新增用戶異常:', e.message)
}

// 登出
await supabase.auth.signOut()
console.log('🔓 已登出')
