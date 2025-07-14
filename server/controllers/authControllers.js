import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";
import userAuth from "../middleware/userAuth.js";

export const register = async (req,res) => {
    const { name, email, password} = req.body;

    if(!name || !email || !password){
        return res.json({success: false, message: "missing details"});
    }

    try{
        const existingUser = await userModel.findOne({email});
        if(existingUser){
            return res.json({success: false, message: "User already exists"});
        }
        const hashedPassword = await bcrypt.hash(password,10);

        const user = new userModel({name, email, password: hashedPassword});
        await user.save();

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET,{expiresIn: '7d'});

        res.cookie('token',token, {
            httpOnly: true,
            secure:process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production'? 'none': 'strict',
            maxAge: 7*24*60*60*1000
        });
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to our service',
            text: `Hello ${name},\n\nThank you for registering with us.\n\nBest regards,\nThe Team huululu`
        };
        await transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        return res.json({
            success: true
        })
    }catch(error){
        res.json({success: false, message: error.message})
    }
}


export const login = async (req, res) => {
    const {email, password} = req.body;

    if(!email || !password ){
        return res.json({success: false, message: "Email and Password are required"});
    }

    try{

        const user = await userModel.findOne({email});

        if(!user){
            return res.json({success: false, message: 'Invalid email'});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.json({success: false, message: "Invalid Password"});
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET,{expiresIn: '7d'});

        res.cookie('token',token, {
            httpOnly: true,
            secure:process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production'? 'none': 'strict',
            maxAge: 7*24*60*60*1000
        });

        return res.json({
            success: true
        })
    }catch(error){
        return res.json({success: false, message: error.message});
    }
}

export const logout = async (req, res) => {
    try{
        res.clearCookie('token', {
            httpOnly: true,
            secure:process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production'? 'none': 'strict',
        });  
        
        return res.json({success: true , message: "Logged Out"});
    }catch(error){
        return res.josn({success: false, message: error.message});
    }
}

export const sendVerifyOtp = async (req, res) => {

    try{
        const  userId  = req.userId;

        const user = await userModel.findById(userId);
        if(user.isAccountVerified){
            return res.json({success: false, message: "Account already verified"});
        }

        const otp = String(Math.floor(Math.random()* 900000 + 100000));

        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24*60*60*1000;

        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Verify your account',
            text: `Your OTP is ${otp}. It is valid for 24 hours.Verify your account using this OTP.\n\nBest regards,\nThe Team huululu`
        };
        await transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        res.json({
            success: true,
            message: "verification OTP sent to your email"
        });
    }catch(error){
        return res.json({success: false, message: error.message});
    }
}

export const verifyEmail = async (req, res) => {
    const {otp} = req.body;
    const userId = req.userId;

    if(!userId || !otp){
        return res.json({success: false, message: "missing details"});
    }

    try{
        const user = await userModel.findById(userId);
        if(!user){
            return res.json({success: false, message: "User not found"});
        }
        if(user.isAccountVerified){
            return res.json({success: false, message: "Account already verified"});
        }

        if(user.verifyOtp === '' || user.verifyOtp !== otp){
            return res.json({success: false, message: "Invalid OTP"});
        }
        if(user.verifyOtpExpireAt < Date.now()){
            return res.json({success: false, message: "OTP expired"});
        }

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;
        await user.save();

        return res.json({
            success: true,
            message: "Email verified successfully"
        });
    }catch(error){
        return res.json({success: false, message: error.message});
    }
}

export const isAuthenticated = async (req, res) => {
    try{
        return res.json({
            success: true,
        });
    }catch(error){
        return res.json({success: false, message: error.message});
    }
}


//send Reset OTP
export const sendResetOtp = async (req, res) => {
    const {email} = req.body;

    if(!email){
        return res.json({success: false, message: "Email is required"});
    }

    try{
        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success: false, message: "User not found"});
        }
        // if(user.isAccountVerified === false){
        //     return res.json({success: false, message: "Account not verified"});
        // }

        const otp = String(Math.floor(Math.random()* 900000 + 100000));

        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15*60*1000;

        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            text: `Your OTP is ${otp}. It is valid for 15 minutes.Reset your Password using this OTP.\n\nBest regards,\nThe Team huululu`
        };
        await transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        return res.json({
            success: true,
            message: "Reset OTP sent to your email"
        });
    }catch(error){
        return res.json({success: false, message: error.message});
    }
}

// Reset User Password
export const resetPassword = async (req, res) => {
    const {email, otp , newPassword} = req.body;

    if(!email || !otp || !newPassword){
        return res.json({
            success: false,
            message: "Email, otp, and new Password are required"
        });
    }

    try{
        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success: false, message: "User not found"});
        }

        if(user.resetOtp === "" || user.resetOtp !== otp){
            return res.json({success: false, message: "Invalid OTP"});
        }

        if(user.resetOtpExpireAt < Date.now()){
            return res.json({success: false, message: "OTP expired"});
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.json({
            success: true,
            message: "Password has been reset successfully"
        })
    }catch(error){
        return res.json({success: false, message: error.message});
    }
}