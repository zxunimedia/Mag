// 密碼強度驗證
function validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('密碼長度至少需要 8 個字元');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密碼必須包含至少一個大寫字母');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密碼必須包含至少一個小寫字母');
  }
  
  if (!/\d/.test(password)) {
    errors.push('密碼必須包含至少一個數字');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('密碼必須包含至少一個特殊字元');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    strength: calculatePasswordStrength(password)
  };
}

// 計算密碼強度
function calculatePasswordStrength(password) {
  let score = 0;
  
  // 長度評分
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // 字元類型評分
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  
  // 複雜性評分
  if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) score += 1;
  if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) score += 1;
  
  if (score < 4) return 'weak';
  if (score < 7) return 'medium';
  return 'strong';
}

// Email 格式驗證
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  
  const errors = [];
  if (!isValid) {
    errors.push('請輸入有效的 Email 地址');
  }
  
  // 檢查常見的錯誤格式
  if (email.includes('..')) {
    errors.push('Email 地址不能包含連續的點號');
  }
  
  if (email.startsWith('.') || email.endsWith('.')) {
    errors.push('Email 地址不能以點號開始或結束');
  }
  
  // 長度限制
  if (email.length > 254) {
    errors.push('Email 地址長度不能超過 254 個字元');
  }
  
  const localPart = email.split('@')[0];
  if (localPart && localPart.length > 64) {
    errors.push('Email 地址本地部分長度不能超過 64 個字元');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// 一般輸入驗證
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // 移除可能的 HTML 標籤
    .substring(0, 500); // 限制長度
}

// 註冊表單驗證
function validateRegistrationForm(email, password, confirmPassword) {
  const errors = [];
  
  // Email 驗證
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.push(...emailValidation.errors);
  }
  
  // 密碼驗證
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }
  
  // 確認密碼
  if (password !== confirmPassword) {
    errors.push('密碼與確認密碼不符');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    passwordStrength: passwordValidation.strength
  };
}

// 檢查是否為常見弱密碼
function isCommonPassword(password) {
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    '1234567890', 'dragon', 'master', 'shadow', 'qwertyuiop'
  ];
  
  return commonPasswords.includes(password.toLowerCase());
}

// 生成安全的隨機 Token
function generateSecureToken() {
  const { v4: uuidv4 } = require('uuid');
  const crypto = require('crypto');
  
  // 結合 UUID 和隨機字節生成更安全的 token
  const uuid = uuidv4();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  
  return `${uuid}-${randomBytes}`;
}

// 計算 Token 過期時間
function calculateTokenExpiry(hours = 24) {
  const now = new Date();
  now.setHours(now.getHours() + hours);
  return now.toISOString();
}

// 格式化錯誤回應
function formatErrorResponse(errors, message = '驗證失敗') {
  return {
    success: false,
    message: message,
    errors: Array.isArray(errors) ? errors : [errors],
    timestamp: new Date().toISOString()
  };
}

// 格式化成功回應
function formatSuccessResponse(data = {}, message = '操作成功') {
  return {
    success: true,
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  };
}

// 記錄用戶活動
function logUserActivity(action, email, ip, userAgent) {
  console.log(`[${new Date().toISOString()}] ${action} - Email: ${email}, IP: ${ip}, UserAgent: ${userAgent}`);
}

// 檢查 IP 是否在黑名單
function isBlockedIP(ip) {
  const blockedIPs = [
    // 在這裡添加需要封鎖的 IP
    // '192.168.1.100',
  ];
  
  return blockedIPs.includes(ip);
}

// 清理過期的 Token
function cleanExpiredTokens(db) {
  return new Promise((resolve, reject) => {
    db.db.run(
      'DELETE FROM verification_tokens WHERE expires_at < datetime(\'now\')',
      function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`🧹 Cleaned ${this.changes} expired tokens`);
          resolve(this.changes);
        }
      }
    );
  });
}

module.exports = {
  validatePassword,
  calculatePasswordStrength,
  validateEmail,
  sanitizeInput,
  validateRegistrationForm,
  isCommonPassword,
  generateSecureToken,
  calculateTokenExpiry,
  formatErrorResponse,
  formatSuccessResponse,
  logUserActivity,
  isBlockedIP,
  cleanExpiredTokens
};