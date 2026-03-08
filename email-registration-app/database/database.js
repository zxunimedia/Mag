import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 建立資料庫連接
const dbPath = path.join(__dirname, 'users.db');
const db = new sqlite3.Database(dbPath);

// Promise化資料庫操作
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// 初始化資料庫表格
export async function initDatabase() {
  try {
    // 建立使用者表格
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        verification_token TEXT,
        is_verified BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        verified_at DATETIME
      )
    `);
    
    console.log('資料庫初始化完成');
    return true;
  } catch (error) {
    console.error('資料庫初始化失敗:', error);
    return false;
  }
}

// 新增使用者
export async function createUser(email, passwordHash, verificationToken) {
  try {
    const result = await dbRun(
      `INSERT INTO users (email, password_hash, verification_token) 
       VALUES (?, ?, ?)`,
      [email, passwordHash, verificationToken]
    );
    return { success: true, userId: result.lastID };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return { success: false, error: 'EMAIL_EXISTS' };
    }
    console.error('新增使用者失敗:', error);
    return { success: false, error: 'DATABASE_ERROR' };
  }
}

// 根據 email 查詢使用者
export async function getUserByEmail(email) {
  try {
    const user = await dbGet(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );
    return user;
  } catch (error) {
    console.error('查詢使用者失敗:', error);
    return null;
  }
}

// 驗證使用者 email
export async function verifyUser(verificationToken) {
  try {
    const result = await dbRun(
      `UPDATE users SET is_verified = 1, verified_at = CURRENT_TIMESTAMP 
       WHERE verification_token = ? AND is_verified = 0`,
      [verificationToken]
    );
    
    return result.changes > 0;
  } catch (error) {
    console.error('驗證使用者失敗:', error);
    return false;
  }
}

// 獲取所有已驗證的使用者
export async function getVerifiedUsers() {
  try {
    const users = await dbAll(
      `SELECT id, email, created_at, verified_at FROM users WHERE is_verified = 1`
    );
    return users;
  } catch (error) {
    console.error('查詢已驗證使用者失敗:', error);
    return [];
  }
}

// 刪除未驗證的使用者（清理功能）
export async function cleanupUnverifiedUsers(hoursOld = 24) {
  try {
    const result = await dbRun(
      `DELETE FROM users 
       WHERE is_verified = 0 
       AND datetime(created_at, '+${hoursOld} hours') < datetime('now')`
    );
    
    console.log(`清理了 ${result.changes} 個未驗證的使用者帳號`);
    return result.changes;
  } catch (error) {
    console.error('清理未驗證使用者失敗:', error);
    return 0;
  }
}

export { db };