import React, { useState } from 'react';

// 客戶端驗證函數 (與後端同步)
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || email.trim() === '') {
    return { valid: false, message: 'Email 不能為空' };
  }
  
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Email 格式不正確' };
  }
  
  if (email.length > 254) {
    return { valid: false, message: 'Email 長度不能超過 254 個字符' };
  }
  
  return { valid: true, message: 'Email 格式正確' };
};

const validatePassword = (password) => {
  const validations = {
    length: { test: password.length >= 8, message: '密碼長度至少 8 個字符' },
    uppercase: { test: /[A-Z]/.test(password), message: '至少包含一個大寫字母' },
    lowercase: { test: /[a-z]/.test(password), message: '至少包含一個小寫字母' },
    number: { test: /\d/.test(password), message: '至少包含一個數字' },
    special: { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), message: '至少包含一個特殊字符 (!@#$%^&* 等)' }
  };
  
  const failed = [];
  const passed = [];
  
  Object.keys(validations).forEach(key => {
    if (validations[key].test) {
      passed.push(validations[key].message);
    } else {
      failed.push(validations[key].message);
    }
  });
  
  // 計算密碼強度分數
  const score = passed.length;
  let strength = '';
  let color = '';
  
  if (score < 2) {
    strength = '非常弱';
    color = '#ff4444';
  } else if (score < 3) {
    strength = '弱';
    color = '#ff8800';
  } else if (score < 4) {
    strength = '中等';
    color = '#ffaa00';
  } else if (score < 5) {
    strength = '強';
    color = '#88cc00';
  } else {
    strength = '非常強';
    color = '#00cc44';
  }
  
  return {
    valid: failed.length === 0,
    score,
    strength,
    color,
    passed,
    failed,
    message: failed.length === 0 ? '密碼強度符合要求' : `需要改進: ${failed.join(', ')}`
  };
};

function RegistrationForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [validation, setValidation] = useState({
    email: { valid: true, message: '' },
    password: { valid: true, score: 0, strength: '', color: '', failed: [], passed: [] },
    confirmPassword: { valid: true, message: '' }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', message: '' });
  
  // 即時驗證
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除提交訊息
    setSubmitMessage({ type: '', message: '' });
    
    // 即時驗證
    const newValidation = { ...validation };
    
    if (field === 'email') {
      newValidation.email = validateEmail(value);
    } else if (field === 'password') {
      newValidation.password = validatePassword(value);
      // 同時檢查密碼確認
      if (formData.confirmPassword) {
        newValidation.confirmPassword = {
          valid: value === formData.confirmPassword,
          message: value === formData.confirmPassword ? '密碼確認正確' : '密碼確認不一致'
        };
      }
    } else if (field === 'confirmPassword') {
      newValidation.confirmPassword = {
        valid: value === formData.password,
        message: value === formData.password ? '密碼確認正確' : '密碼確認不一致'
      };
    }
    
    setValidation(newValidation);
  };
  
  // 表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 最終驗證
    const emailVal = validateEmail(formData.email);
    const passwordVal = validatePassword(formData.password);
    const confirmVal = {
      valid: formData.password === formData.confirmPassword,
      message: formData.password === formData.confirmPassword ? '密碼確認正確' : '密碼確認不一致'
    };
    
    setValidation({
      email: emailVal,
      password: passwordVal,
      confirmPassword: confirmVal
    });
    
    // 檢查是否所有欄位都有效
    if (!emailVal.valid || !passwordVal.valid || !confirmVal.valid) {
      setSubmitMessage({
        type: 'error',
        message: '請修正表單中的錯誤後再提交'
      });
      return;
    }
    
    setIsSubmitting(true);
    setSubmitMessage({ type: '', message: '' });
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSubmitMessage({
          type: 'success',
          message: '註冊成功！請檢查您的信箱以完成驗證。'
        });
        
        // 清空表單
        setFormData({
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        // 重置驗證狀態
        setValidation({
          email: { valid: true, message: '' },
          password: { valid: true, score: 0, strength: '', color: '', failed: [], passed: [] },
          confirmPassword: { valid: true, message: '' }
        });
        
        // 通知父組件註冊成功
        setTimeout(() => {
          onSuccess();
        }, 2000);
        
      } else {
        let errorMessage = '註冊失敗，請稍後再試';
        
        if (result.error === 'EMAIL_EXISTS') {
          errorMessage = '此 Email 已經註冊過了';
        } else if (result.error === 'VALIDATION_ERROR') {
          errorMessage = result.details || '資料驗證失敗';
        } else if (result.error === 'EMAIL_SEND_FAILED') {
          errorMessage = '帳號建立成功，但驗證郵件發送失敗，請聯繫客服';
        }
        
        setSubmitMessage({
          type: 'error',
          message: errorMessage
        });
      }
    } catch (error) {
      console.error('註冊錯誤:', error);
      setSubmitMessage({
        type: 'error',
        message: '網路連接錯誤，請檢查您的網路連接'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 表單是否可以提交
  const canSubmit = validation.email.valid && 
                   validation.password.valid && 
                   validation.confirmPassword.valid &&
                   formData.email && 
                   formData.password && 
                   formData.confirmPassword &&
                   !isSubmitting;

  return (
    <form onSubmit={handleSubmit}>
      {submitMessage.message && (
        <div className={`alert ${submitMessage.type}`}>
          {submitMessage.message}
        </div>
      )}
      
      {/* Email 欄位 */}
      <div className="form-group">
        <label htmlFor="email">Email 地址 *</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className={formData.email ? (validation.email.valid ? 'success' : 'error') : ''}
          placeholder="請輸入您的 Email 地址"
          required
        />
        {formData.email && (
          <div className={`validation-message ${validation.email.valid ? 'success' : 'error'}`}>
            {validation.email.message}
          </div>
        )}
      </div>
      
      {/* 密碼欄位 */}
      <div className="form-group">
        <label htmlFor="password">密碼 *</label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          className={formData.password ? (validation.password.valid ? 'success' : 'error') : ''}
          placeholder="請輸入密碼"
          required
        />
        
        {formData.password && (
          <div className="password-strength">
            <div className="password-strength-bar">
              <div 
                className="password-strength-fill"
                style={{
                  width: `${(validation.password.score / 5) * 100}%`,
                  backgroundColor: validation.password.color
                }}
              ></div>
            </div>
            <div style={{ color: validation.password.color, fontSize: '14px', fontWeight: '600' }}>
              密碼強度: {validation.password.strength}
            </div>
            
            <div className="password-requirements">
              {[
                { key: 'length', message: '密碼長度至少 8 個字符' },
                { key: 'uppercase', message: '至少包含一個大寫字母' },
                { key: 'lowercase', message: '至少包含一個小寫字母' },
                { key: 'number', message: '至少包含一個數字' },
                { key: 'special', message: '至少包含一個特殊字符 (!@#$%^&* 等)' }
              ].map(req => {
                const isPassed = validation.password.passed.includes(req.message);
                return (
                  <div key={req.key} className={`requirement ${isPassed ? 'passed' : 'failed'}`}>
                    <div className="icon">
                      {isPassed ? '✓' : '✗'}
                    </div>
                    {req.message}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* 密碼確認欄位 */}
      <div className="form-group">
        <label htmlFor="confirmPassword">確認密碼 *</label>
        <input
          type="password"
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          className={formData.confirmPassword ? (validation.confirmPassword.valid ? 'success' : 'error') : ''}
          placeholder="請再次輸入密碼"
          required
        />
        {formData.confirmPassword && (
          <div className={`validation-message ${validation.confirmPassword.valid ? 'success' : 'error'}`}>
            {validation.confirmPassword.message}
          </div>
        )}
      </div>
      
      {/* 提交按鈕 */}
      <button
        type="submit"
        className="submit-btn"
        disabled={!canSubmit}
      >
        {isSubmitting && <div className="loading"></div>}
        {isSubmitting ? '註冊中...' : '註冊帳號'}
      </button>
    </form>
  );
}

export default RegistrationForm;