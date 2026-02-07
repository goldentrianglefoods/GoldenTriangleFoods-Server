const { sendEmail, createEmailTemplate } = require('./utils/emailService');
require('dotenv').config();

async function testDirectEmail() {
  console.log('\n===== Testing Direct Email Send =====');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***SET***' : '***NOT SET***');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('=====================================\n');

  try {
    const testEmail = 'rahulkumar27382@gmail.com';
    const testTitle = 'Direct Test Campaign';
    const testMessage = 'This is a direct test to check email configuration.';
    
    const htmlContent = createEmailTemplate(testTitle, testMessage);
    
    console.log('Sending test email to:', testEmail);
    const result = await sendEmail(testEmail, testTitle, htmlContent);
    
    if (result.success) {
      console.log('✅ SUCCESS! Email sent successfully');
      console.log('Message ID:', result.messageId);
    } else {
      console.log('❌ FAILED! Email send failed');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.log('❌ EXCEPTION! An error occurred');
    console.log('Error message:', error.message);
    console.log('Full error:', error);
  }
}

testDirectEmail();
