const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  console.log('[EmailService] Creating transporter with config:', {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER,
    passwordSet: !!process.env.EMAIL_PASSWORD
  });
  
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Professional email template for campaigns
const createEmailTemplate = (title, message) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          background-color: #f4f4f4;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          padding: 40px 20px;
          text-align: center;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #ffffff;
          margin: 0;
          letter-spacing: 2px;
        }
        .content {
          padding: 40px 30px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #000000;
          margin-bottom: 20px;
          text-align: center;
        }
        .message {
          font-size: 16px;
          line-height: 1.6;
          color: #333333;
          margin-bottom: 30px;
          white-space: pre-line;
        }
        .cta-button {
          display: inline-block;
          padding: 15px 40px;
          background-color: #000000;
          color: #ffffff;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
        }
        .cta-container {
          text-align: center;
        }
        .footer {
          background-color: #f9f9f9;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #eeeeee;
        }
        .footer-text {
          font-size: 14px;
          color: #666666;
          margin: 5px 0;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-link {
          display: inline-block;
          margin: 0 10px;
          color: #000000;
          text-decoration: none;
          font-size: 14px;
        }
        .unsubscribe {
          font-size: 12px;
          color: #999999;
          margin-top: 20px;
        }
        .divider {
          height: 1px;
          background-color: #eeeeee;
          margin: 30px 0;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <h1 class="logo">BALANCE</h1>
        </div>
        
        <!-- Content -->
        <div class="content">
          <h2 class="title">${title}</h2>
          <div class="message">${message}</div>
          
          <div class="cta-container">
            <a href="${process.env.CLIENT_URL || 'https://www.balanceofficial.shop'}" class="cta-button">
              Shop Now
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p class="footer-text"><strong>BALANCE</strong></p>
          <p class="footer-text">Premium Fashion & Lifestyle</p>
          
          <div class="divider"></div>
          
          <div class="social-links">
            <a href="#" class="social-link">Instagram</a>
            <a href="#" class="social-link">Facebook</a>
            <a href="#" class="social-link">Twitter</a>
          </div>
          
          <p class="footer-text">
            Thank you for being a valued subscriber!
          </p>
          
          <p class="unsubscribe">
            You're receiving this email because you subscribed to our newsletter.
            <br>
            © ${new Date().getFullYear()} Balance. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Welcome email template for new subscribers
const createWelcomeEmailTemplate = () => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Balance</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          background-color: #f4f4f4;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          padding: 40px 20px;
          text-align: center;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #ffffff;
          margin: 0;
          letter-spacing: 2px;
        }
        .content {
          padding: 40px 30px;
        }
        .welcome-title {
          font-size: 28px;
          font-weight: bold;
          color: #000000;
          margin-bottom: 10px;
          text-align: center;
        }
        .subtitle {
          font-size: 16px;
          color: #666666;
          margin-bottom: 30px;
          text-align: center;
        }
        .message {
          font-size: 16px;
          line-height: 1.6;
          color: #333333;
          margin-bottom: 20px;
        }
        .benefits {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin: 30px 0;
        }
        .benefit-item {
          display: flex;
          align-items: center;
          margin: 15px 0;
        }
        .benefit-icon {
          width: 24px;
          height: 24px;
          background-color: #000000;
          border-radius: 50%;
          margin-right: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
        }
        .cta-button {
          display: inline-block;
          padding: 15px 40px;
          background-color: #000000;
          color: #ffffff;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
        }
        .cta-container {
          text-align: center;
        }
        .footer {
          background-color: #f9f9f9;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #eeeeee;
        }
        .footer-text {
          font-size: 14px;
          color: #666666;
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">BALANCE</h1>
        </div>
        
        <div class="content">
          <h2 class="welcome-title">Welcome to Balance!</h2>
          <p class="subtitle">Thank you for subscribing to our newsletter</p>
          
          <p class="message">
            We're thrilled to have you join our community! Get ready to discover the latest trends, 
            exclusive collections, and special offers delivered straight to your inbox.
          </p>
          
          <div class="benefits">
            <div class="benefit-item">
              <div class="benefit-icon">✓</div>
              <div>Early access to new collections and limited editions</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">✓</div>
              <div>Exclusive discounts and promotional offers</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">✓</div>
              <div>Fashion tips and trending styles updates</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">✓</div>
              <div>Behind-the-scenes content and brand stories</div>
            </div>
          </div>
          
          <div class="cta-container">
            <a href="${process.env.CLIENT_URL || 'https://www.balanceofficial.shop'}" class="cta-button">
              Start Shopping
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p class="footer-text"><strong>BALANCE</strong></p>
          <p class="footer-text">Premium Fashion & Lifestyle</p>
          <p class="footer-text" style="margin-top: 20px;">
            © ${new Date().getFullYear()} Balance. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send email function
const sendEmail = async (to, subject, htmlContent) => {
  try {
    console.log(`[EmailService] Attempting to send email to: ${to}`);
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Golden Triangle Foods" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] ✅ Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] ❌ FAILED to send email to ${to}`);
    console.error(`[EmailService] Error Code: ${error.code}`);
    console.error(`[EmailService] Error Message: ${error.message}`);
    console.error(`[EmailService] Full Error:`, error);
    return { success: false, error: error.message, errorCode: error.code };
  }
};

// Send bulk emails with delay to avoid rate limiting
const sendBulkEmails = async (recipients, subject, htmlContent) => {
  console.log(`[EmailService] Starting bulk email send to ${recipients.length} recipients`);
  console.log(`[EmailService] Subject: ${subject}`);
  
  const results = {
    successful: [],
    failed: []
  };

  for (let i = 0; i < recipients.length; i++) {
    const email = recipients[i];
    console.log(`[EmailService] Processing email ${i + 1}/${recipients.length}: ${email}`);
    
    try {
      const result = await sendEmail(email, subject, htmlContent);
      
      if (result.success) {
        results.successful.push({ email, status: 'sent' });
      } else {
        console.error(`[EmailService] Email to ${email} failed: ${result.error}`);
        results.failed.push({ email, status: 'failed', error: result.error });
      }
      
      // Add delay between emails to avoid rate limiting (500ms)
      if (i < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`[EmailService] Exception sending to ${email}:`, error);
      results.failed.push({ email, status: 'failed', error: error.message });
    }
  }

  console.log(`[EmailService] Bulk send complete. Success: ${results.successful.length}, Failed: ${results.failed.length}`);
  return results;
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  createEmailTemplate,
  createWelcomeEmailTemplate
};
