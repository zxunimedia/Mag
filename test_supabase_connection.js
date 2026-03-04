// 測試 Supabase 連接狀態
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bmhehsdzwhhprhxpmgrx.supabase.co'
const supabaseKey = 'sb_publishable_HqzTTbGEHv2rMB-tT6KCxg_dbK0rDZ3'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 測試 Supabase 連接...')
console.log('URL:', supabaseUrl)
console.log('Key 前綴:', supabaseKey.substring(0, 30) + '...')

// 測試基本連接
try {
  const { data, error } = await supabase.from('profiles').select('*').limit(1)
  if (error) {
    console.log('❌ 連接錯誤:', error.message)
  } else {
    console.log('✅ Supabase 連接成功')
    console.log('📊 Profiles 表查詢結果:', data)
  }
} catch (e) {
  console.log('❌ 異常:', e.message)
}
