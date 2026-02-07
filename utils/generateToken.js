const jwt = require("jsonwebtoken");

//  Create access & refresh tokens
const generateTokens = (user) => {
 try{
     const payload = { id: user._id, email: user.email };

  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "2h",
  });

  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
 }catch(err){
    console.log("error from gen token" + err);
 }
};

// Send tokens as HTTP-only cookies
const sendTokens = (res, accessToken, refreshToken) => {
try{
    const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true only in production
    sameSite: "None",
  };

  res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 2 * 60 * 60 * 1000 }); // 2h
  res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7d
}catch(err){
    console.log("error from send token "+ err);
}
};

module.exports = {generateTokens,sendTokens};
