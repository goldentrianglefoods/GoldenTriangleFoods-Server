const bcryptjs = require("bcryptjs");
const User = require("../../../models/user-model");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const OTP = require("../../../models/otp-model");
const sendEmail = require("../../../utils/email-service");
const { sendOtpSms, sendPasswordResetSms, formatIndianPhoneNumber } = require("../../../utils/smsService");
const { generateTokens, sendTokens } = require("../../../utils/generateToken");
require("dotenv").config();


// Send OTP (Email or Phone)
const sendOtpController = async (req, res) => {
  try {
    const { email, phone, name } = req.body;

    // Validate that at least one contact method is provided
    if (!email && !phone) {
      return res.status(400).json({ msg: "Please provide either email or phone number!" });
    }

    let userExist;
    let otpType;
    let contactValue;

    // Check if user is registering with email or phone
    if (email) {
      userExist = await User.findOne({ email });
      if (userExist) {
        return res.status(400).json({ msg: "User already registered with this email!" });
      }
      otpType = 'email';
      contactValue = email;
    } else {
      // Format and validate phone number
      const formattedPhone = formatIndianPhoneNumber(phone);
      userExist = await User.findOne({ phone: formattedPhone });
      if (userExist) {
        return res.status(400).json({ msg: "User already registered with this phone number!" });
      }
      otpType = 'sms';
      contactValue = formattedPhone;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP
    const hashOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Save OTP to database
    if (otpType === 'email') {
      await OTP.findOneAndUpdate(
        { email: contactValue, type: 'email' },
        { email: contactValue, type: 'email', otp: hashOtp, createdAt: new Date() },
        { upsert: true, new: true }
      );
      await sendEmail(contactValue, otp, name || 'User');
    } else {
      await OTP.findOneAndUpdate(
        { phone: contactValue, type: 'sms' },
        { phone: contactValue, type: 'sms', otp: hashOtp, createdAt: new Date() },
        { upsert: true, new: true }
      );
      await sendOtpSms(contactValue, otp, name || 'User');
    }

    res.json({ msg: "OTP sent successfully!", type: otpType });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: error.message || "Error sending OTP" });
  }
};

//  Verify OTP (Email or Phone)
const verifyOtpController = async (req, res) => {
  try {
    const { email, phone, otp } = req.body;

    // Validate that at least one contact method is provided
    if (!email && !phone) {
      return res.status(400).json({ msg: "Please provide either email or phone number!" });
    }

    let record;
    if (email) {
      record = await OTP.findOne({ email, type: 'email' });
    } else {
      const formattedPhone = formatIndianPhoneNumber(phone);
      record = await OTP.findOne({ phone: formattedPhone, type: 'sms' });
    }

    if (!record) return res.status(400).json({ msg: "OTP not found or expired!" });

    const hashOtp = crypto.createHash("sha256").update(otp).digest("hex");
    
    if (hashOtp !== record.otp) {
      return res.status(400).json({ msg: "Invalid OTP!" });
    }

    // Delete OTP after successful verification
    if (email) {
      await OTP.deleteOne({ email, type: 'email' });
    } else {
      const formattedPhone = formatIndianPhoneNumber(phone);
      await OTP.deleteOne({ phone: formattedPhone, type: 'sms' });
    }
    
    res.json({ msg: "OTP verified successfully!" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: error.message || "Error verifying OTP" });
  }
};


// controller for sign-Up (Email or Phone)
const signUpController = async(req,res)=>{
    try {
      // get sign up data like email/phone and password
      const {name, email, phone, password} = req.body;

      // Validate input fields
      if (!name || (!email && !phone) || !password) {
        return res.status(400).json({ msg: "Name, contact method (email or phone), and password are required!" });
      }

      let userQuery = {};
      let verificationField = {};
      
      if (email) {
        userQuery.email = email;
        verificationField.emailVerified = true;
      }
      
      if (phone) {
        const formattedPhone = formatIndianPhoneNumber(phone);
        userQuery.phone = formattedPhone;
        verificationField.phoneVerified = true;
      }

      // Check if user exists
      const exist = await User.findOne(userQuery);
      
      if(exist) {
        return res.status(400).json({msg:"User with this contact already exists!"});
      }

      // Hash password
      const hashPassword = await bcryptjs.hash(password, 8);

      // Create user obj
      const userData = {
        name,
        password: hashPassword,
        ...verificationField
      };

      if (email) userData.email = email;
      if (phone) userData.phone = formatIndianPhoneNumber(phone);

      const user = new User(userData);

      // Save user
      await user.save();
      
      console.log("User registered successfully");
      const userResponse = user.toObject();
      delete userResponse.password;
      res.json(userResponse);

    } catch(err) {
      res.status(500).json({error: err.message});
      console.log("Error during registration: " + err);
    }
}

// Controller for login (Email or Phone)
const signInController = async(req,res)=>{
    try{
        // get user email/phone and password for validation
        const {email, phone, password} = req.body;

        // Validate input fields
        if ((!email && !phone) || !password) {
          return res.status(400).json({ msg: "Contact method (email or phone) and password are required!" });
        }

        // Find user by email or phone
        let user;
        if (email) {
          user = await User.findOne({email});
        } else {
          const formattedPhone = formatIndianPhoneNumber(phone);
          user = await User.findOne({phone: formattedPhone});
        }

        if(!user) {
          return res.status(400).json({error:"User does not exist with this contact!"});
        }

        // Check password match
        const isMatch = await bcryptjs.compare(password, user.password);

        if(!isMatch) {
          return res.status(400).json({error:"Incorrect password or contact"});
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);
        sendTokens(res, accessToken, refreshToken);

        const userData = user.toObject();
        delete userData.password;
        res.json({ user: userData, accessToken, refreshToken });

    }catch(err){
        res.status(500).json({error:err.message})
    }
}

// refresh token
const refreshToken = (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const accessToken = jwt.sign(
      { id: decoded.id, email: decoded.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "2h" }
    );
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 2 * 60 * 60 * 1000,
    });
    res.json({ message: "Access token refreshed" });
  } catch {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

// Controller for sign-out
 const logout = (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
};

// controller for getting user data by user-ID
const getUserController =async (req, res)=>{
    try{
       const userId = req.user.id;
      // console.log(userId);
      // if(!userId){
      //   return res.status(400).json({msg:"UserId required"});
      // }

       const user = await User.findById(userId);
      if(!user){
        res.status(404).json({"msg":"User not found"});
      }
      res.status(200).json(user);

    }catch(err){
      console.log("error from get-user-controller" + err);
    }
};

// Send OTP for Forgot Password (Email or Phone)
const sendForgotPasswordOtpController = async (req, res) => {
  try {
    const { email, phone } = req.body;

    // Validate that at least one contact method is provided
    if (!email && !phone) {
      return res.status(400).json({ msg: "Please provide either email or phone number!" });
    }

    let user;
    let otpType;
    let contactValue;

    // Check if user exists with email or phone
    if (email) {
      user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: "No account found with this email!" });
      }
      otpType = 'email';
      contactValue = email;
    } else {
      const formattedPhone = formatIndianPhoneNumber(phone);
      user = await User.findOne({ phone: formattedPhone });
      if (!user) {
        return res.status(400).json({ msg: "No account found with this phone number!" });
      }
      otpType = 'sms';
      contactValue = formattedPhone;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP
    const hashOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Save OTP to database
    if (otpType === 'email') {
      await OTP.findOneAndUpdate(
        { email: contactValue, type: 'email' },
        { email: contactValue, type: 'email', otp: hashOtp, createdAt: new Date() },
        { upsert: true, new: true }
      );
      await sendEmail(contactValue, otp, user.name || 'User');
    } else {
      await OTP.findOneAndUpdate(
        { phone: contactValue, type: 'sms' },
        { phone: contactValue, type: 'sms', otp: hashOtp, createdAt: new Date() },
        { upsert: true, new: true }
      );
      await sendPasswordResetSms(contactValue, otp);
    }

    res.json({ msg: "Password reset OTP sent successfully!", type: otpType });
  } catch (error) {
    console.error("Error sending forgot password OTP:", error);
    res.status(500).json({ error: error.message || "Error sending OTP" });
  }
};

// Verify OTP for Forgot Password
const verifyForgotPasswordOtpController = async (req, res) => {
  try {
    const { email, phone, otp } = req.body;

    // Validate that at least one contact method is provided
    if (!email && !phone) {
      return res.status(400).json({ msg: "Please provide either email or phone number!" });
    }

    let record;
    if (email) {
      record = await OTP.findOne({ email, type: 'email' });
    } else {
      const formattedPhone = formatIndianPhoneNumber(phone);
      record = await OTP.findOne({ phone: formattedPhone, type: 'sms' });
    }

    if (!record) return res.status(400).json({ msg: "OTP not found or expired!" });

    const hashOtp = crypto.createHash("sha256").update(otp).digest("hex");
    
    if (hashOtp !== record.otp) {
      return res.status(400).json({ msg: "Invalid OTP!" });
    }

    // Don't delete OTP yet - will delete after password reset
    res.json({ msg: "OTP verified successfully!" });
  } catch (error) {
    console.error("Error verifying forgot password OTP:", error);
    res.status(500).json({ error: error.message || "Error verifying OTP" });
  }
};

// Reset Password
const resetPasswordController = async (req, res) => {
  try {
    const { email, phone, newPassword, otp } = req.body;

    // Validate inputs
    if ((!email && !phone) || !newPassword || !otp) {
      return res.status(400).json({ msg: "Contact method, OTP, and new password are required!" });
    }

    // Verify OTP one more time
    let record;
    let user;
    
    if (email) {
      record = await OTP.findOne({ email, type: 'email' });
      user = await User.findOne({ email });
    } else {
      const formattedPhone = formatIndianPhoneNumber(phone);
      record = await OTP.findOne({ phone: formattedPhone, type: 'sms' });
      user = await User.findOne({ phone: formattedPhone });
    }

    if (!record) {
      return res.status(400).json({ msg: "OTP not found or expired!" });
    }

    if (!user) {
      return res.status(400).json({ msg: "User not found!" });
    }

    const hashOtp = crypto.createHash("sha256").update(otp).digest("hex");
    
    if (hashOtp !== record.otp) {
      return res.status(400).json({ msg: "Invalid OTP!" });
    }

    // Hash new password
    const hashPassword = await bcryptjs.hash(newPassword, 8);

    // Update user password
    user.password = hashPassword;
    await user.save();

    // Delete OTP after successful password reset
    if (email) {
      await OTP.deleteOne({ email, type: 'email' });
    } else {
      const formattedPhone = formatIndianPhoneNumber(phone);
      await OTP.deleteOne({ phone: formattedPhone, type: 'sms' });
    }

    res.json({ msg: "Password reset successfully!" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: error.message || "Error resetting password" });
  }
};

module.exports = {
  signUpController,
  signInController,
  sendOtpController,
  verifyOtpController,
  refreshToken,
  logout,
  getUserController,
  sendForgotPasswordOtpController,
  verifyForgotPasswordOtpController,
  resetPasswordController
};