
const express = require('express');
const userRouter = express.Router();
const User = require('../models/user-model');
const authMiddleware = require('../middleware/authMiddleware');
const { profileController, updateProfileController, updateProfileImageController } = require('../controllers/web/v1/user-controller');
const { upload } = require('../middleware/multerMiddleware');

// Get user profile
userRouter.get("/get-profile",authMiddleware,profileController);

// Update user profile
userRouter.put("/update-profile",authMiddleware,updateProfileController);       

// update profile images route

userRouter.put("/update-profile-image",authMiddleware,upload.single("profile-image"),updateProfileImageController);

// export user routes
module.exports = userRouter;    