// 測試權限管理功能
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bmhehsdzwhhprhxpmgrx.supabase.co'
const supabaseKey = 'sb_publishable_HqzTTbGEHv2rMB-tT6KCxg_dbK0rDZ3'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 測試權限管理 - 載入用戶列表...')

// 模擬登入
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: 'mag@atipd.tw',
  password: 'admin123'
})

if (authError) {
  console.log('❌ 登入失敗:', authError.message)
  process.exit(1)
}

console.log('✅ 已登入，測試載入用戶列表...')

// 測試 loadUsers 功能
try {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, role, unit_id, unit_name, created_at')
    .order('created_at')
  
  if (error) {
    console.log('❌ 載入用戶失敗:', error.message)
    console.log('📝 錯誤詳情:', error)
  } else {
    console.log('✅ 成功載入用戶列表!')
    console.log('👥 用戶數量:', data.length)
    console.log('📊 用戶列表:')
    data.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.role}) - ${user.unit_name || 'N/A'}`)
    })
  }
} catch (e) {
  console.log('❌ 異常:', e.message)
}

// 登出
await supabase.auth.signOut()
console.log('🔓 已登出')
