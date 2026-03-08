// Email 格式驗證
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || email.trim() === '') {
    return { valid: false, message: 'Email 不能為空' };
  }
  
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Email 格式不正確' };
  }
  
  // 檢查 Email 長度
  if (email.length > 254) {
    return { valid: false, message: 'Email 長度不能超過 254 個字符' };
  }
  
  return { valid: true, message: 'Email 格式正確' };
}

// 密碼強度驗證
export function validatePassword(password) {
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
}

// 密碼確認驗證
export function validatePasswordConfirm(password, confirmPassword) {
  if (!confirmPassword || confirmPassword.trim() === '') {
    return { valid: false, message: '請確認密碼' };
  }
  
  if (password !== confirmPassword) {
    return { valid: false, message: '密碼確認不一致' };
  }
  
  return { valid: true, message: '密碼確認正確' };
}

// 綜合表單驗證
export function validateRegistrationForm(email, password, confirmPassword) {
  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);
  const confirmValidation = validatePasswordConfirm(password, confirmPassword);
  
  const isValid = emailValidation.valid && passwordValidation.valid && confirmValidation.valid;
  
  return {
    valid: isValid,
    email: emailValidation,
    password: passwordValidation,
    confirm: confirmValidation
  };
}