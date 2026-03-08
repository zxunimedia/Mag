const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    // 確保 database 目錄存在
    const dbDir = path.dirname(process.env.DB_PATH || './database/users.db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new sqlite3.Database(process.env.DB_PATH || './database/users.db');
    this.init();
  }

  init() {
    // 創建 users 表
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        verification_token TEXT,
        is_verified BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        verified_at DATETIME NULL
      )
    `;

    // 創建 verification_tokens 表
    const createTokensTable = `
      CREATE TABLE IF NOT EXISTS verification_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;

    this.db.serialize(() => {
      this.db.run(createUsersTable);
      this.db.run(createTokensTable);
    });

    console.log('✅ Database initialized');
  }

  // 新增用戶
  createUser(email, hashedPassword, verificationToken) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO users (email, password, verification_token)
        VALUES (?, ?, ?)
      `);
      
      stmt.run([email, hashedPassword, verificationToken], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      stmt.finalize();
    });
  }

  // 檢查 Email 是否已存在
  checkEmailExists(email) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id FROM users WHERE email = ?',
        [email],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(!!row);
          }
        }
      );
    });
  }

  // 儲存驗證 Token
  saveVerificationToken(userId, token, expiresAt) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO verification_tokens (user_id, token, expires_at)
        VALUES (?, ?, ?)
      `);
      
      stmt.run([userId, token, expiresAt], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      stmt.finalize();
    });
  }

  // 驗證 Token
  verifyToken(token) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT vt.*, u.email, u.id as user_id 
        FROM verification_tokens vt
        JOIN users u ON vt.user_id = u.id
        WHERE vt.token = ? AND vt.used = 0 AND vt.expires_at > datetime('now')
      `;
      
      this.db.get(query, [token], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // 標記 Token 已使用並驗證用戶
  markTokenUsedAndVerifyUser(tokenId, userId) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // 標記 token 已使用
        this.db.run(
          'UPDATE verification_tokens SET used = 1 WHERE id = ?',
          [tokenId]
        );
        
        // 標記用戶已驗證
        this.db.run(
          'UPDATE users SET is_verified = 1, verified_at = datetime(\'now\') WHERE id = ?',
          [userId],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve(true);
            }
          }
        );
      });
    });
  }

  // 獲取用戶資訊
  getUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id, email, is_verified, created_at, verified_at FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  // 獲取所有用戶（管理用途）
  getAllUsers() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT id, email, is_verified, created_at, verified_at FROM users ORDER BY created_at DESC',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;