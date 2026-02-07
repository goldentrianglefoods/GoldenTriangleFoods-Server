const nodemailer = require("nodemailer");
const { otpHtmlTemplate } = require("../templates/otpTemplate");
require("dotenv").config();

const sendEmail = async (email,otp,name) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, 
    },
  });



  const html = otpHtmlTemplate({ name,otp,minutes: 5 });
  
  
  const textFallback = `Hi ${name},\n\nYour OTP is: ${otp}. It expires in 5 minutes.\n\nIf you did not request this, ignore this email.`;


  const mailOptions = {
    from: `"Golden Triangle Foods" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Email Verification OTP",
    text:textFallback,
    html:html
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
