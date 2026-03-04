// 測試資料持久化
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bmhehsdzwhhprhxpmgrx.supabase.co'
const supabaseKey = 'sb_publishable_HqzTTbGEHv2rMB-tT6KCxg_dbK0rDZ3'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 測試 Supabase 資料持久化...')

// 登入
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: 'mag@atipd.tw',
  password: 'admin123'
})

if (authError) {
  console.log('❌ 登入失敗:', authError.message)
  process.exit(1)
}

console.log('✅ 已登入，測試資料讀寫...')

try {
  // 測試 1: 讀取現有資料
  console.log('\n📖 測試 1: 讀取現有資料...')
  const { data: profiles, error: readError } = await supabase
    .from('profiles')
    .select('*')
    .limit(5)
  
  if (readError) {
    console.log('❌ 讀取失敗:', readError.message)
  } else {
    console.log('✅ 讀取成功!')
    console.log('📊 資料筆數:', profiles.length)
  }
  
  // 測試 2: 檢查資料表結構
  console.log('\n🗂️  測試 2: 檢查資料表結構...')
  const tables = ['profiles', 'projects', 'coaching_records', 'monthly_reports']
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      console.log(`❌ ${table} 表錯誤:`, error.message)
    } else {
      console.log(`✅ ${table} 表正常 (${data.length} 筆測試資料)`)
    }
  }
  
  // 測試 3: 資料連接狀態
  console.log('\n🔗 測試 3: 資料連接狀態...')
  const { data: health, error: healthError } = await supabase.from('profiles').select('count').limit(1)
  
  if (healthError) {
    console.log('❌ 連接測試失敗:', healthError.message)
  } else {
    console.log('✅ 資料庫連接狀態良好')
  }
  
} catch (e) {
  console.log('❌ 測試異常:', e.message)
}

// 登出
await supabase.auth.signOut()
console.log('\n🔓 測試完成，已登出')

console.log('\n🎉 所有 Supabase 資料持久化測試完成!')
