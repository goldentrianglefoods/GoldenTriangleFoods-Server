const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailConfig() {
  console.log('Testing Email Configuration...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***hidden***' : 'NOT SET');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);

  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ Email configuration is valid!');
    
    // Try sending a test email
    const info = await transporter.sendMail({
      from: `"Balance Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'Test Email from Balance',
      text: 'This is a test email to verify email configuration.',
      html: '<b>This is a test email to verify email configuration.</b>'
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    console.error('Full error:', error);
  }
}

testEmailConfig();
