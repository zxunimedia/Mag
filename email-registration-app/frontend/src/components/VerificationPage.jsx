import React, { useState, useEffect } from 'react';

function VerificationPage({ token, onComplete, onBackToRegistration }) {
  const [verificationState, setVerificationState] = useState({
    loading: true,
    success: false,
    error: null,
    message: ''
  });

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setVerificationState({
        loading: false,
        success: false,
        error: 'INVALID_TOKEN',
        message: '無效的驗證連結'
      });
    }
  }, [token]);

  const verifyEmail = async (verificationToken) => {
    try {
      const response = await fetch(`/api/verify?token=${verificationToken}`, {
        method: 'GET'
      });

      const result = await response.json();

      if (response.ok) {
        setVerificationState({
          loading: false,
          success: true,
          error: null,
          message: '您的 Email 已成功驗證！'
        });
        
        // 3 秒後自動跳轉
        setTimeout(() => {
          onComplete();
        }, 3000);
      } else {
        let errorMessage = '驗證失敗';
        
        switch (result.error) {
          case 'INVALID_TOKEN':
            errorMessage = '驗證連結無效或已過期';
            break;
          case 'ALREADY_VERIFIED':
            errorMessage = '此帳號已經驗證過了';
            break;
          case 'TOKEN_NOT_FOUND':
            errorMessage = '找不到對應的驗證記錄';
            break;
          default:
            errorMessage = result.message || '驗證過程發生錯誤';
        }
        
        setVerificationState({
          loading: false,
          success: false,
          error: result.error,
          message: errorMessage
        });
      }
    } catch (error) {
      console.error('驗證錯誤:', error);
      setVerificationState({
        loading: false,
        success: false,
        error: 'NETWORK_ERROR',
        message: '網路連接錯誤，請檢查您的網路連接'
      });
    }
  };

  if (verificationState.loading) {
    return (
      <div className="verification-page">
        <div className="verification-icon" style={{ background: '#667eea' }}>
          <div className="loading" style={{ border: '3px solid white', borderTopColor: 'transparent' }}></div>
        </div>
        <h2>正在驗證您的 Email...</h2>
        <p>請稍候，我們正在處理您的驗證請求。</p>
      </div>
    );
  }

  if (verificationState.success) {
    return (
      <div className="verification-page">
        <div className="verification-icon success">
          ✅
        </div>
        <h2>驗證成功！</h2>
        <p>{verificationState.message}</p>
        <div className="alert success">
          <strong>恭喜！</strong> 您現在可以開始使用所有功能了。
        </div>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
          頁面將在 3 秒後自動跳轉...
        </p>
        <button 
          className="back-btn" 
          onClick={onComplete}
        >
          立即進入
        </button>
      </div>
    );
  }

  // 驗證失敗
  return (
    <div className="verification-page">
      <div className="verification-icon error">
        ❌
      </div>
      <h2>驗證失敗</h2>
      <p>{verificationState.message}</p>
      
      <div className="alert error">
        <strong>可能的原因：</strong>
        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
          <li>驗證連結已過期（超過 24 小時）</li>
          <li>驗證連結格式不正確</li>
          <li>此帳號已經完成驗證</li>
          <li>網路連接問題</li>
        </ul>
      </div>
      
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button 
          className="back-btn" 
          onClick={onBackToRegistration}
        >
          重新註冊
        </button>
        
        {verificationState.error === 'NETWORK_ERROR' && (
          <button 
            className="back-btn" 
            onClick={() => verifyEmail(token)}
            style={{ background: '#f39c12' }}
          >
            重新嘗試驗證
          </button>
        )}
      </div>
    </div>
  );
}

export default VerificationPage;