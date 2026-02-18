/**
 * 初始化用戶數據腳本
 * 
 * 這個腳本用於在瀏覽器的 localStorage 中創建初始用戶數據
 * 
 * 使用方法：
 * 1. 打開 https://mocwork.atipd.tw/
 * 2. 打開瀏覽器開發者工具（F12）
 * 3. 切換到 Console 標籤
 * 4. 複製並執行以下代碼
 */

// 初始用戶數據
const initialUsers = [
  {
    id: 'admin-mag',
    name: '系統管理員',
    email: 'mag@atipd.tw',
    password: 'chin286',  // 實際系統應使用加密密碼
    role: 'MOC_ADMIN',
    unitId: 'MOC',
    unitName: '文化部',
    assignedProjectIds: [],  // 管理員可以看到所有計畫
    createdAt: '2025-01-01',
    lastLogin: new Date().toISOString().split('T')[0]
  },
  {
    id: 'op-magchin',
    name: '操作人員',
    email: 'magchin@gmail.com',
    password: '123456',  // 請根據實際情況修改密碼
    role: 'UNIT_OPERATOR',
    unitId: 'unit-原村',
    unitName: '社團法人台灣原住民族學院促進會',
    assignedProjectIds: [],  // 需要在下一步中填入實際的計畫 ID
    createdAt: '2026-02-01',
    lastLogin: new Date().toISOString().split('T')[0]
  }
];

// 保存到 localStorage
localStorage.setItem('registeredUsers', JSON.stringify(initialUsers));

console.log('✅ 用戶數據已初始化！');
console.log('已創建的用戶：');
initialUsers.forEach(user => {
  console.log(`- ${user.email} (${user.role})`);
});

console.log('\n⚠️ 重要：需要為 magchin@gmail.com 分配計畫 ID');
console.log('請執行以下步驟：');
console.log('1. 查看所有計畫：');
console.log('   JSON.parse(localStorage.getItem("projects"))');
console.log('2. 找到「115年度原村計畫」的 id');
console.log('3. 執行以下代碼更新用戶的 assignedProjectIds：');
console.log('   const users = JSON.parse(localStorage.getItem("registeredUsers"));');
console.log('   const user = users.find(u => u.email === "magchin@gmail.com");');
console.log('   user.assignedProjectIds = ["計畫ID"];  // 替換為實際的計畫 ID');
console.log('   localStorage.setItem("registeredUsers", JSON.stringify(users));');
