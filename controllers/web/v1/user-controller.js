const express = require('express');
const User = require('../../../models/user-model');
const fs = require('fs');
const { uploadOnCloudinary } = require('../../../utils/cloudinary');

// profile controller
const profileController = async (req, res) => {
    try{
        // get user id
        const userId = req.user.id;

        // fetch user details from database with populated addresses
        const user = await User.findById(userId)
            .select('-password')
            .populate('addresses');

        if(!user){
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            status: "true",
            message: "User profile fetched successfully",
            user: user  
        });

    }catch(error){
        res.status(500).json({
            status: "false",
            message: "Server Error",
            error: error.message
        });         
    }
};

// update profile controller
const updateProfileController = async (req, res) => {
    try{
        // get user id
        // update some fields like name, phone, gender, bio
        const userId = req.user.id;
        const { name, phone, gender, bio, age } = req.body;

        const updatedData = {};
        if (name) updatedData.name = name;
        if (phone) updatedData.phone = phone;
        if (gender) updatedData.gender = gender;
        if (bio) updatedData.bio = bio;
        if (age) updatedData.age = age;

        // update in database
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updatedData },
            { new: true }
        ).select('-password');

        res.status(200).json({
            status: "true",
            message: "User profile updated successfully",
            user: updatedUser  
        }); 

    }catch (error){
        res.status
        .status(500)
        .json({
            status: "false",
            message: "Server Error",
            error: error.message
        });     
    }
};

// update profile images controller

const updateProfileImageController = async (req, res) => {
    try {
        // get user id
        // get profile image from req.file
        // temporarily store the image 
        // upload to cloudinary
        // get uploaded image secure_url
        // update user profileUrl in database
        // if all successful, delete temporary file

        const userId = req.user.id;
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        
        const tempPath = req.file.path;

        // Upload to Cloudinary
        const uploadedImage = await uploadOnCloudinary(tempPath);
        const profileUrl = uploadedImage?.secure_url;
        
        // Update user profileUrl in database 
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { profileUrl: profileUrl } },
            { new: true }
        ).select('-password');

        // Delete temporary file
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }

        res.status(200).json({
            status: "true",
            message: "Profile image updated successfully",
            user: updatedUser  
        }); 

    } catch (error) {

        // delete temporary file in case of error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }   

        res.status(500).json({
            status: "false",
            message: "Server Error",
            error: error.message
        });     
    }
};

        

        


module.exports = { profileController , updateProfileController , updateProfileImageController};