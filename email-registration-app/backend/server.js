import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

// 導入自定義模組
import { 
  initDatabase, 
  createUser, 
  getUserByEmail, 
  verifyUser, 
  getVerifiedUsers, 
  cleanupUnverifiedUsers 
} from '../database/database.js';
import { validateRegistrationForm } from './validators.js';
import { 
  sendVerificationEmail, 
  sendWelcomeEmail, 
  verifySmtpConnection 
} from './emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 中介軟體
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 請求日誌
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 健康檢查端點
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'email-registration-api'
  });
});

// 註冊 API
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 輸入驗證
    const validation = validateRegistrationForm(email, password, password);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        details: {
          email: validation.email.message,
          password: validation.password.message
        }
      });
    }
    
    // 檢查 email 是否已存在
    const existingUser = await getUserByEmail(email.trim().toLowerCase());
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'EMAIL_EXISTS',
        message: '此 Email 已經註冊過了'
      });
    }
    
    // 產生驗證 token
    const verificationToken = uuidv4();
    
    // 加密密碼
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // 建立使用者記錄
    const createResult = await createUser(
      email.trim().toLowerCase(),
      passwordHash,
      verificationToken
    );
    
    if (!createResult.success) {
      if (createResult.error === 'EMAIL_EXISTS') {
        return res.status(409).json({
          success: false,
          error: 'EMAIL_EXISTS',
          message: '此 Email 已經註冊過了'
        });
      }
      
      throw new Error(createResult.error || '建立使用者失敗');
    }
    
    // 發送驗證郵件
    const baseUrl = req.get('origin') || `http://localhost:3000`;
    const emailResult = await sendVerificationEmail(email, verificationToken, baseUrl);
    
    if (!emailResult.success) {
      console.error('驗證郵件發送失敗:', emailResult.error);
      
      // 郵件發送失敗，但使用者已建立
      return res.status(201).json({
        success: true,
        warning: 'EMAIL_SEND_FAILED',
        message: '帳號建立成功，但驗證郵件發送失敗。請聯繫客服重新發送驗證郵件。',
        userId: createResult.userId,
        // 開發模式下提供驗證連結
        ...(process.env.NODE_ENV === 'development' && { 
          verificationLink: emailResult.verificationLink 
        })
      });
    }
    
    // 成功響應
    res.status(201).json({
      success: true,
      message: '註冊成功！請檢查您的信箱以完成驗證。',
      userId: createResult.userId,
      // 開發模式下提供驗證連結
      ...(process.env.NODE_ENV === 'development' && { 
        verificationLink: emailResult.verificationLink 
      })
    });
    
  } catch (error) {
    console.error('註冊錯誤:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '伺服器內部錯誤'
    });
  }
});

// Email 驗證 API
app.get('/api/verify', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: '缺少驗證 token'
      });
    }
    
    // 執行驗證
    const verificationResult = await verifyUser(token);
    
    if (!verificationResult) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: '驗證 token 無效或已過期'
      });
    }
    
    // 驗證成功，發送歡迎郵件 (可選)
    // 這裡我們不取得用戶 email，因為驗證函數沒有回傳
    // 在實際應用中，您可能需要修改驗證函數來回傳用戶資訊
    
    res.json({
      success: true,
      message: 'Email 驗證成功！'
    });
    
  } catch (error) {
    console.error('驗證錯誤:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '驗證過程發生錯誤'
    });
  }
});

// 獲取已驗證使用者列表 API
app.get('/api/users', async (req, res) => {
  try {
    const users = await getVerifiedUsers();
    
    res.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        verified_at: user.verified_at
      }))
    });
    
  } catch (error) {
    console.error('獲取使用者列表錯誤:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '無法載入使用者列表'
    });
  }
});

// 清理未驗證使用者 API (管理用途)
app.post('/api/cleanup', async (req, res) => {
  try {
    const { hours = 24 } = req.body;
    const cleanedCount = await cleanupUnverifiedUsers(hours);
    
    res.json({
      success: true,
      message: `清理了 ${cleanedCount} 個未驗證的使用者帳號`,
      cleanedCount
    });
    
  } catch (error) {
    console.error('清理錯誤:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '清理過程發生錯誤'
    });
  }
});

// SMTP 狀態檢查 API
app.get('/api/smtp-status', async (req, res) => {
  try {
    const result = await verifySmtpConnection();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'SMTP 服務正常'
      });
    } else {
      res.status(503).json({
        success: false,
        error: 'SMTP_ERROR',
        message: `SMTP 服務異常: ${result.error}`
      });
    }
    
  } catch (error) {
    console.error('SMTP 檢查錯誤:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'SMTP 狀態檢查失敗'
    });
  }
});

// 404 錯誤處理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: '找不到請求的資源'
  });
});

// 全域錯誤處理
app.use((error, req, res, next) => {
  console.error('未處理的錯誤:', error);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: '伺服器內部錯誤'
  });
});

// 初始化資料庫並啟動伺服器
async function startServer() {
  try {
    console.log('🚀 啟動 Email 註冊 API 服務...');
    
    // 初始化資料庫
    console.log('📊 初始化資料庫...');
    const dbInitResult = await initDatabase();
    if (!dbInitResult) {
      throw new Error('資料庫初始化失敗');
    }
    
    // 檢查 SMTP 連接 (不阻塞啟動)
    console.log('📧 檢查 SMTP 服務...');
    const smtpResult = await verifySmtpConnection();
    if (smtpResult.success) {
      console.log('✅ SMTP 服務連接正常');
    } else {
      console.warn('⚠️  SMTP 服務連接失敗:', smtpResult.error);
      console.warn('📝 請檢查 SMTP 配置。郵件功能將無法使用。');
    }
    
    // 啟動 HTTP 伺服器
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🎯 API 伺服器已啟動`);
      console.log(`🌐 本地存取: http://localhost:${PORT}`);
      console.log(`📊 健康檢查: http://localhost:${PORT}/api/health`);
      console.log(`📧 SMTP 狀態: http://localhost:${PORT}/api/smtp-status`);
      console.log(`\n📋 可用的 API 端點:`);
      console.log(`   POST /api/register     - 註冊新使用者`);
      console.log(`   GET  /api/verify       - 驗證 Email`);
      console.log(`   GET  /api/users        - 獲取已驗證使用者列表`);
      console.log(`   POST /api/cleanup      - 清理未驗證使用者`);
      console.log(`   GET  /api/smtp-status  - 檢查 SMTP 狀態`);
      console.log(`   GET  /api/health       - 健康檢查`);
      console.log(`\n🔧 環境配置:`);
      console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   PORT: ${PORT}`);
    });
    
    // 每小時自動清理未驗證使用者
    setInterval(async () => {
      try {
        const cleaned = await cleanupUnverifiedUsers(24);
        if (cleaned > 0) {
          console.log(`🧹 自動清理: 移除了 ${cleaned} 個過期的未驗證帳號`);
        }
      } catch (error) {
        console.error('自動清理失敗:', error);
      }
    }, 60 * 60 * 1000); // 每小時執行一次
    
  } catch (error) {
    console.error('❌ 伺服器啟動失敗:', error);
    process.exit(1);
  }
}

// 優雅關閉
process.on('SIGINT', () => {
  console.log('\n👋 正在關閉伺服器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 正在關閉伺服器...');
  process.exit(0);
});

// 啟動伺服器
startServer();