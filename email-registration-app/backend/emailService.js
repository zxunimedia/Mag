import nodemailer from 'nodemailer';

// SMTP 配置 (可以根據需要修改為其他郵件服務商)
const SMTP_CONFIG = {
  // Gmail 配置示例
  gmail: {
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || 'your-email@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password'
    }
  },
  
  // Outlook/Hotmail 配置示例
  outlook: {
    service: 'hotmail',
    auth: {
      user: process.env.OUTLOOK_USER || 'your-email@outlook.com',
      pass: process.env.OUTLOOK_PASSWORD || 'your-password'
    }
  },
  
  // 自定義 SMTP 伺服器配置示例
  custom: {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'your-email@example.com',
      pass: process.env.SMTP_PASS || 'your-password'
    }
  }
};

// 選擇使用的 SMTP 配置
const currentConfig = SMTP_CONFIG.custom; // 可以改為 gmail, outlook 或 custom

// 建立郵件發送器
let transporter;

try {
  transporter = nodemailer.createTransporter(currentConfig);
} catch (error) {
  console.error('SMTP 配置錯誤:', error);
}

// 驗證 SMTP 連接
export async function verifySmtpConnection() {
  if (!transporter) {
    return { success: false, error: 'SMTP 未配置' };
  }
  
  try {
    await transporter.verify();
    console.log('SMTP 伺服器連接正常');
    return { success: true };
  } catch (error) {
    console.error('SMTP 連接失敗:', error);
    return { success: false, error: error.message };
  }
}

// 發送驗證郵件
export async function sendVerificationEmail(email, verificationToken, baseUrl = 'http://localhost:3000') {
  if (!transporter) {
    return { success: false, error: 'SMTP 服務未配置' };
  }
  
  const verificationLink = `${baseUrl}/verify?token=${verificationToken}`;
  
  const mailOptions = {
    from: process.env.FROM_EMAIL || currentConfig.auth.user,
    to: email,
    subject: '請驗證您的 Email 地址',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email 驗證</h1>
          </div>
          <div class="content">
            <p>親愛的用戶，</p>
            <p>感謝您註冊我們的服務！請點擊下方按鈕來驗證您的 Email 地址：</p>
            <p style="text-align: center;">
              <a href="${verificationLink}" class="button">驗證 Email</a>
            </p>
            <p>如果按鈕無法點擊，請複製以下連結到瀏覽器網址列：</p>
            <p style="word-break: break-all; background: #eee; padding: 10px;">
              ${verificationLink}
            </p>
            <p><strong>注意：</strong>此驗證連結將在 24 小時後失效。</p>
          </div>
          <div class="footer">
            <p>如果您沒有註冊此帳號，請忽略此郵件。</p>
            <p>此為系統自動發送的郵件，請勿回覆。</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      請驗證您的 Email 地址
      
      感謝您註冊我們的服務！請訪問以下連結來驗證您的 Email 地址：
      ${verificationLink}
      
      注意：此驗證連結將在 24 小時後失效。
      
      如果您沒有註冊此帳號，請忽略此郵件。
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('驗證郵件發送成功:', info.messageId);
    return { 
      success: true, 
      messageId: info.messageId,
      verificationLink // 開發時可以用來測試
    };
  } catch (error) {
    console.error('郵件發送失敗:', error);
    return { success: false, error: error.message };
  }
}

// 發送歡迎郵件
export async function sendWelcomeEmail(email) {
  if (!transporter) {
    return { success: false, error: 'SMTP 服務未配置' };
  }
  
  const mailOptions = {
    from: process.env.FROM_EMAIL || currentConfig.auth.user,
    to: email,
    subject: '歡迎加入！',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 歡迎加入！</h1>
          </div>
          <div class="content">
            <p>親愛的用戶，</p>
            <p>恭喜您！您的 Email 地址已成功驗證。</p>
            <p>您現在可以開始使用我們的服務了。</p>
            <p>如果您有任何問題，歡迎隨時聯繫我們的客服團隊。</p>
          </div>
          <div class="footer">
            <p>感謝您選擇我們的服務！</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('歡迎郵件發送成功:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('歡迎郵件發送失敗:', error);
    return { success: false, error: error.message };
  }
}