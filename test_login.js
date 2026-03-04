// 測試登入功能
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bmhehsdzwhhprhxpmgrx.supabase.co'
const supabaseKey = 'sb_publishable_HqzTTbGEHv2rMB-tT6KCxg_dbK0rDZ3'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 測試登入帳號 mag@atipd.tw...')

// 測試登入
try {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'mag@atipd.tw',
    password: 'admin123'  // 嘗試常見密碼
  })
  
  if (error) {
    console.log('❌ 登入失敗:', error.message)
    console.log('📝 錯誤代碼:', error.status)
  } else {
    console.log('✅ 登入成功!')
    console.log('👤 用戶資訊:', data.user.email)
    console.log('🔑 Session:', data.session ? 'Valid' : 'Invalid')
  }
} catch (e) {
  console.log('❌ 登入異常:', e.message)
}
