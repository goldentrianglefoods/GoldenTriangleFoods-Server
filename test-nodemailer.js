const nodemailer = require('nodemailer');
require('dotenv').config();

async function simpleTest() {
  console.log('Testing nodemailer import...');
  console.log('nodemailer object:', typeof nodemailer);
  console.log('nodemailer.createTransporter:', typeof nodemailer.createTransporter);
  
  if (typeof nodemailer.createTransporter !== 'function') {
    console.error('ERROR: createTransporter is not available!');
    console.log('Available properties:', Object.keys(nodemailer));
  } else {
    try {
      const transporter = nodemailer.createTransporter({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      
      console.log('✅ Transporter created successfully');
      
      // Test connection
      await transporter.verify();
      console.log('✅ SMTP connection verified!');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
}

simpleTest();
