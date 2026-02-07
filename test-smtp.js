const nodemailer = require('nodemailer');
require('dotenv').config();

async function comprehensiveTest() {
  console.log('\n============ COMPREHENSIVE EMAIL TEST ============');
  console.log('Environment Variables:');
  console.log('  EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('  EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('  EMAIL_USER:', process.env.EMAIL_USER);
  console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? `***${process.env.EMAIL_PASSWORD.slice(-4)}` : 'NOT SET');
  console.log('==================================================\n');

  try {
    // Step 1: Create transporter
    console.log('Step 1: Creating transporter...');
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      logger: true, // Enable logging
      debug: true // Enable debug output
    });
    console.log('✅ Transporter created\n');

    // Step 2: Verify connection
    console.log('Step 2: Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified\n');

    // Step 3: Send test email
    console.log('Step 3: Sending test email...');
    const info = await transporter.sendMail({
      from: `"Balance Test" <${process.env.EMAIL_USER}>`,
      to: 'rahulkumar27382@gmail.com',
      subject: 'Test Email - Campaign System',
      text: 'This is a test email from the Balance campaign system.',
      html: '<b>This is a test email from the Balance campaign system.</b>'
    });

    console.log('✅ ✅ ✅ EMAIL SENT SUCCESSFULLY! ✅ ✅ ✅');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
  } catch (error) {
    console.error('\n❌ ❌ ❌ ERROR OCCURRED ❌ ❌ ❌');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('\nFull Error:', error);
    
    if (error.code === 'EAUTH') {
      console.error('\n⚠️  AUTHENTICATION FAILED!');
      console.error('This usually means:');
      console.error('  1. Incorrect email/password');
      console.error('  2. Gmail "Less secure app access" is disabled');
      console.error('  3. You need to use an App Password instead of regular password');
      console.error('  4. 2-Factor Authentication is enabled (requires App Password)');
    }
  }
  
  console.log('\n========== TEST COMPLETE ==========\n');
}

comprehensiveTest();
