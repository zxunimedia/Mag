import React, { useState, useEffect } from 'react';

function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const result = await response.json();

      if (response.ok) {
        setUsers(result.users || []);
        setError(null);
      } else {
        setError('無法載入使用者列表');
        setUsers([]);
      }
    } catch (error) {
      console.error('載入使用者失敗:', error);
      setError('網路連接錯誤');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '無效日期';
    }
  };

  if (loading) {
    return (
      <div className="users-list">
        <h3>📋 已註冊使用者</h3>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div className="loading" style={{ border: '3px solid #ddd', borderTopColor: '#667eea' }}></div>
          <p style={{ marginTop: '16px', color: '#666' }}>載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-list">
        <h3>📋 已註冊使用者</h3>
        <div className="alert error">
          {error}
        </div>
        <button 
          className="back-btn" 
          onClick={fetchUsers}
          style={{ width: '100%', marginTop: '16px' }}
        >
          重新載入
        </button>
      </div>
    );
  }

  return (
    <div className="users-list">
      <h3>📋 已驗證使用者 ({users.length} 位)</h3>
      
      {users.length === 0 ? (
        <div className="empty-state">
          目前沒有已驗證的使用者
        </div>
      ) : (
        <div className="users-grid">
          {users.map((user, index) => (
            <div key={user.id || index} className="user-card">
              <div className="email">
                📧 {user.email}
              </div>
              <div className="date">
                註冊時間: {formatDate(user.created_at)}
              </div>
              {user.verified_at && (
                <div className="date">
                  驗證時間: {formatDate(user.verified_at)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <button 
        className="back-btn" 
        onClick={fetchUsers}
        style={{ 
          width: '100%', 
          marginTop: '16px', 
          background: '#28a745',
          fontSize: '14px',
          padding: '8px'
        }}
      >
        🔄 重新整理列表
      </button>
    </div>
  );
}

export default UsersList;