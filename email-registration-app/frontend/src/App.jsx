import React, { useState, useEffect } from 'react';
import RegistrationForm from './components/RegistrationForm';
import VerificationPage from './components/VerificationPage';
import UsersList from './components/UsersList';

function App() {
  const [currentView, setCurrentView] = useState('registration');
  const [verificationToken, setVerificationToken] = useState(null);
  
  // 檢查 URL 參數
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setVerificationToken(token);
      setCurrentView('verification');
    }
  }, []);
  
  const handleRegistrationSuccess = () => {
    setCurrentView('success');
  };
  
  const handleVerificationComplete = () => {
    // 清除 URL 參數
    window.history.replaceState({}, document.title, window.location.pathname);
    setCurrentView('users');
  };
  
  const handleBackToRegistration = () => {
    setCurrentView('registration');
    setVerificationToken(null);
  };

  return (
    <div className="container">
      {currentView === 'registration' && (
        <>
          <div className="header">
            <h1>🎯 註冊帳號</h1>
            <p>請填寫以下資訊來建立您的帳號</p>
          </div>
          <RegistrationForm onSuccess={handleRegistrationSuccess} />
        </>
      )}
      
      {currentView === 'success' && (
        <div className="verification-page">
          <div className="verification-icon success">
            ✉️
          </div>
          <h2>註冊成功！</h2>
          <p>
            我們已經發送一封驗證郵件到您的信箱。<br/>
            請檢查您的信箱並點擊驗證連結以完成帳號啟用。
          </p>
          <div className="alert info">
            <strong>提醒：</strong>請記得檢查垃圾郵件夾，驗證郵件有時可能會被誤判為垃圾郵件。
          </div>
          <button 
            className="back-btn" 
            onClick={handleBackToRegistration}
          >
            註冊其他帳號
          </button>
          <UsersList />
        </div>
      )}
      
      {currentView === 'verification' && (
        <VerificationPage 
          token={verificationToken} 
          onComplete={handleVerificationComplete}
          onBackToRegistration={handleBackToRegistration}
        />
      )}
      
      {currentView === 'users' && (
        <div>
          <div className="header">
            <h1>✅ 驗證完成</h1>
            <p>您的帳號已成功啟用！</p>
          </div>
          <div className="alert success">
            恭喜！您的 Email 已成功驗證，現在可以使用所有功能了。
          </div>
          <button 
            className="back-btn" 
            onClick={handleBackToRegistration}
          >
            註冊其他帳號
          </button>
          <UsersList />
        </div>
      )}
    </div>
  );
}

export default App;