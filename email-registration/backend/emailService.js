const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // 創建 SMTP 傳輸器
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 驗證 SMTP 連線
    this.verifyConnection();
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP Server is ready to take our messages');
    } catch (error) {
      console.error('❌ SMTP Server connection failed:', error);
    }
  }

  // 發送驗證信
  async sendVerificationEmail(email, verificationToken) {
    const verificationUrl = `${process.env.APP_URL}/verify?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: '🔐 請驗證您的 Email 地址',
      html: this.generateVerificationEmailHTML(email, verificationUrl),
      text: this.generateVerificationEmailText(email, verificationUrl)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      throw error;
    }
  }

  // 生成 HTML 版本的驗證信
  generateVerificationEmailHTML(email, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html lang="zh-TW">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email 驗證</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
              .button:hover { opacity: 0.9; }
              .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; }
              .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; color: #856404; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🎉 歡迎註冊！</h1>
                  <p>請驗證您的 Email 地址</p>
              </div>
              <div class="content">
                  <h2>您好！</h2>
                  <p>感謝您註冊我們的服務。請點擊下方按鈕驗證您的 Email 地址：</p>
                  <p><strong>Email:</strong> ${email}</p>
                  
                  <div style="text-align: center;">
                      <a href="${verificationUrl}" class="button">
                          🔐 驗證 Email 地址
                      </a>
                  </div>
                  
                  <div class="warning">
                      <strong>⚠️ 重要提醒：</strong>
                      <ul>
                          <li>此驗證連結將在 24 小時後失效</li>
                          <li>請勿將此連結分享給他人</li>
                          <li>如果您沒有註冊此帳號，請忽略此信件</li>
                      </ul>
                  </div>
                  
                  <p>如果按鈕無法點擊，請複製以下連結到瀏覽器：</p>
                  <p style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace;">
                      ${verificationUrl}
                  </p>
              </div>
              <div class="footer">
                  <p>此信件由系統自動發送，請勿回覆</p>
                  <p>&copy; 2024 ${process.env.FROM_NAME}. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  // 生成純文字版本的驗證信
  generateVerificationEmailText(email, verificationUrl) {
    return `
🎉 歡迎註冊！

您好！

感謝您註冊我們的服務。請使用以下連結驗證您的 Email 地址：

Email: ${email}

驗證連結：
${verificationUrl}

⚠️ 重要提醒：
- 此驗證連結將在 24 小時後失效
- 請勿將此連結分享給他人
- 如果您沒有註冊此帳號，請忽略此信件

此信件由系統自動發送，請勿回覆
© 2024 ${process.env.FROM_NAME}. All rights reserved.
    `.trim();
  }

  // 發送歡迎信
  async sendWelcomeEmail(email) {
    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: '🎉 歡迎加入！Email 驗證成功',
      html: this.generateWelcomeEmailHTML(email),
      text: `歡迎 ${email}！您的 Email 已成功驗證，可以開始使用我們的服務了。`
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      throw error;
    }
  }

  generateWelcomeEmailHTML(email) {
    return `
      <!DOCTYPE html>
      <html lang="zh-TW">
      <head>
          <meta charset="UTF-8">
          <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; }
              .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🎉 驗證成功！</h1>
              </div>
              <div class="content">
                  <h2>歡迎 ${email}！</h2>
                  <p>您的 Email 已成功驗證，現在可以開始使用我們的服務了。</p>
                  <p>如有任何問題，歡迎隨時聯繫我們。</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }
}

module.exports = EmailService;