    const User = require("../models/User");
    const mailer = require('../helpers/mailer')
    const bcrypt = require("bcryptjs");
    const jwt = require("jsonwebtoken");

    const twilio = require('twilio'); 

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    const twilioClient = new twilio(accountSid, authToken);

    // const generateExpiryTime=()=>{
    //     const currentTime = new Date()
    //     return new Date(currentTime.getTime() + 15 * 1000)
    // } 
    

    // Generate OTP
    // function generateOTP() {
    // return Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    // }

    // Register a new user and send OTP
    
    exports.register = async (req, res) => {
    try {
        const { username, email, phoneNumber, password } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        // const otp = generateOTP();

        // var mailotp = Math.floor(100000 + Math.random()*900000)

        // const otpExpiration = generateExpiryTime();

        user = new User({
        username,
        email,
        phoneNumber,
        password: hashedPassword,
        // sendOtp: otp,
        // mailOtp: mailotp.toString(),
        // otpExpiration
        });

        await user.save();

        // const msg = `your otp is ${otp}`;
        
        // mailer.sendMail(email,'Mail verification',msg);

        // Send OTP via Twilio
        // await twilioClient.messages.create({
        // body: `Your OTP code is: ${mailotp}`,
        // to: phoneNumber,
        // from: process.env.TWILIO_PHONE_NUMBER,
        // });

        res.status(201).json({ message: "User registered successfully. OTP sent!" });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
    };

    exports.verifyOtp = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        const user = await User.findOne({ phoneNumber });
        if (!user) return res.status(400).json({ message: "User not found" });

        if (user.sendOtp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
        }

        user.verifyOtp = otp;
        user.sendOtp = null; // Clear OTP after verification
        await user.save();

        res.json({ message: "OTP verified successfully!" });
    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
    };

    // User Login
    exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found for login please register first" });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
        const token = jwt.sign({ userId: user._id }, "a6c3157c166681b32be2f0d6b97c734471f6a1bb69f322e7e71d36bb363863fe", { expiresIn: "1h" });
        res.json({ message: "Login successful!", token });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
    };