const User = require("../models/User");
const mailer = require('../helpers/mailer')
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// const twilio = require('twilio'); 

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;

// const twilioClient = new twilio(accountSid, authToken);

// const generateExpiryTime=()=>{
//     const currentTime = new Date()
//     return new Date(currentTime.getTime() + 15 * 1000)
// } 


// Generate OTP

function generateOTP() {
return Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
}




const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/payments';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
}).single('screenshot');

// Configure nodemailer

const transporter = nodemailer.createTransport({
    host: "smtpout.secureserver.net",
    port: "465",
    secure: process.env.SMTP_PORT === "465", // true for port 465
    auth: {
      user: "info@easewithdraw.com",
      pass: "Ease@1234",
    },
});

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.SMTP_MAIL,
//         pass: process.env.SMTP_PASSWORD
//     }
// });


// Create Payment model or schema if you don't have one
// You can add this to your models folder
/*
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  cardId: String,
  planTitle: String,
  planPrice: String,
  message: String,
  screenshotPath: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', PaymentSchema);
*/

// Handle payment confirmation upload


exports.uploadPaymentConfirmation = (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }

        try {
            // Check if file was uploaded
            if (!req.file) {
                return res.status(400).json({ message: 'Please upload a payment screenshot' });
            }

            const { email, message, cardId, planTitle, planPrice } = req.body;

            // Validate required fields
            if (!email) {
                return res.status(400).json({ message: 'Email is required' });
            }

            // Find user by email
            const user = await User.findOne({ email });

            // Create payment record
            // If you have a Payment model, use it here
            // const payment = new Payment({
            //   user: user ? user._id : null,
            //   email,
            //   cardId,
            //   planTitle,
            //   planPrice,
            //   message,
            //   screenshotPath: req.file.path,
            // });
            // await payment.save();

            // Send email to admin
            const adminMailOptions = {
                from: "info@easewithdraw.com",
                to: "info@easewithdraw.com",
                subject: `Payment Confirmation - Card #${cardId || 'N/A'} - ${planTitle || 'N/A'}`,
                html: `
          <h2>New Payment Confirmation</h2>
          <p><strong>From:</strong> ${email}</p>
          <p><strong>Card ID:</strong> ${cardId || 'N/A'}</p>
          <p><strong>Plan:</strong> ${planTitle || 'N/A'}</p>
          <p><strong>Amount:</strong> ₹${planPrice ? (planPrice)  : 'N/A'}</p>
          <p><strong>Message:</strong> ${message || 'No message provided'}</p>
          <p>Please find the payment screenshot attached.</p>
        `,
                attachments: [
                    {
                        filename: path.basename(req.file.path),
                        path: req.file.path,
                        contentType: req.file.mimetype,
                    },
                ],
                replyTo: email,
            };

            // Send email to customer
            const customerMailOptions = {
                from: "info@easewithdraw.com",
                to: email,
                subject: `Payment Confirmation - ${planTitle || 'Your Plan'}`,
                html: `
          <h2>Thank You for Your Payment</h2>
          <p>We have received your payment confirmation for the following:</p>
          <ul>
            <li><strong>Plan:</strong> ${planTitle || 'N/A'}</li>
            <li><strong>Amount:</strong> ₹${planPrice ? (planPrice)  : 'N/A'}</li>
          </ul>
          <p>Our team will review your payment and activate your subscription shortly.</p>
          <p>If you have any questions, please reply to this email.</p>
        `,
            };

            // Send both emails
            await transporter.sendMail(adminMailOptions);
            await transporter.sendMail(customerMailOptions);

            res.status(200).json({
                message: 'Payment confirmation uploaded and emails sent successfully',
                file: req.file.filename
            });
        } catch (error) {
            console.error('Payment confirmation error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });
};

// Admin reply to customer
exports.sendReplyToCustomer = async (req, res) => {
    try {
        const { customerEmail, message } = req.body;

        // Validate required fields
        if (!customerEmail || !message) {
            return res.status(400).json({ message: 'Customer email and message are required' });
        }

        // Verify admin authorization
        // This should be handled by middleware in a real application
        // For example: if (!req.user.isAdmin) return res.status(403).json({ message: 'Unauthorized' });


        const mailOptions = {
            from: process.env.SMTP_MAIL,
            to: customerEmail,
            subject: 'Re: Your Payment Confirmation',
            html: `
        <h2>Response to Your Payment</h2>
        <p>${message}</p>
        <p>Thank you for choosing our service.</p>
      `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Reply sent successfully' });
    } catch (error) {
        console.error('Send reply error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Get all payments (for admin)
exports.getAllPayments = async (req, res) => {
    try {
        // Verify admin authorization
        // This should be handled by middleware in a real application

        // If you have a Payment model:
        // const payments = await Payment.find().sort({ createdAt: -1 });

        // For now, we'll return a mock response

        const payments = [
            {
                id: '1',
                email: 'user@example.com',
                cardId: '123',
                planTitle: 'Premium Plan',
                planPrice: '999',
                status: 'pending',
                createdAt: new Date()
            }
        ];

        res.status(200).json(payments);
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Update payment status (for admin)
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { paymentId, status } = req.body;

        // Verify admin authorization
        // This should be handled by middleware in a real application

        // Validate status
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        // If you have a Payment model:
        // const payment = await Payment.findById(paymentId);
        // if (!payment) return res.status(404).json({ message: 'Payment not found' });
        // 
        // payment.status = status;
        // await payment.save();

        res.status(200).json({ message: 'Payment status updated successfully' });
    } catch (error) {
        console.error('Update payment status error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};



// exports.register = async (req, res) => {
//     try {
//         const { username, email, phoneNumber, password } = req.body;

//         let user = await User.findOne({ email });
//         if (user) return res.status(400).json({ message: "User already exists" });
        
//         const hashedPassword = await bcrypt.hash(password, 10);
        
//         // Generate a 6-digit OTP as a string
//         const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
//         // Generate email OTP
//         const mailOtp = Math.floor(100000 + Math.random() * 900000).toString();

//         user = new User({
//             username,
//             email,
//             phoneNumber,
//             password: hashedPassword,
//             sendOtp: otp,
//             mailOtp: mailOtp,
//         });

//         await user.save();

//         const msg = `Your OTP is ${otp}`;
//         mailer.sendMail(email, 'Mail verification', msg);

//         const token = jwt.sign({ userId: user._id }, "a6c3157c166681b32be2f0d6b97c734471f6a1bb69f322e7e71d36bb363863fe", { expiresIn: "1h" });

//         res.status(201).json({
//             message: "User registered successfully",
//             token,
//             user: {
//               username: user.username,
//               email: user.email,
//               phoneNumber: user.phoneNumber,
//             },
//           });
//     } catch (error) {
//         console.error("Registration error:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// };



// exports.verifyOtp = async (req, res) => {
//     try {
//         const { phoneNumber, otp } = req.body;

//         // Debug logs to help troubleshoot
//         console.log("Verification request received:", { phoneNumber, otp });
        
//         const user = await User.findOne({ phoneNumber });
//         if (!user) {
//             console.log("User not found for phone number:", phoneNumber);
//             return res.status(400).json({ message: "User not found" });
//         }
        
//         console.log("User found:", user.username);
//         console.log("Stored OTP:", user.sendOtp, "Type:", typeof user.sendOtp);
//         console.log("Received OTP:", otp, "Type:", typeof otp);
        
//         // Normalize both OTPs by trimming whitespace and ensuring they're strings
//         const storedOtp = String(user.sendOtp).trim();
//         const receivedOtp = String(otp).trim();
        
//         console.log("Comparing:", storedOtp, "===", receivedOtp);
        
//         if (storedOtp !== receivedOtp) {
//             console.log("OTP mismatch");
//             return res.status(400).json({ message: "Invalid OTP" });
//         }
          
//         // OTP verified successfully
//         user.verifyOtp = otp;
//         user.sendOtp = null; // Clear OTP after verification
//         await user.save();
        
//         console.log("OTP verified successfully for user:", user.username);
//         res.json({ message: "OTP verified successfully!" });
//     } catch (error) {
//         console.error("Verify OTP error:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// };









exports.register = async (req, res) => {
    try {
        const { username, email, phoneNumber, password } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(200).json({ message: "User already exists" });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();

        var mailotp = Math.floor(100000 + Math.random()*900000)

        // const otpExpiration = generateExpiryTime();

        user = new User({
            username,
            email,
            phoneNumber,
            password: hashedPassword,
            sendOtp: otp,
            mailOtp: mailotp.toString(),
            // otpExpiration
        });

        await user.save();

        const msg = `your otp is ${otp}`;
        mailer.sendMail(email,'Mail verification',msg);
        // Send OTP via Twilio
        // await twilioClient.messages.create({
        // body: `Your OTP code is: ${mailotp}`,
        // to: phoneNumber,
        // from: process.env.TWILIO_PHONE_NUMBER,
        // });

        const token = jwt.sign({ userId: user._id }, "a6c3157c166681b32be2f0d6b97c734471f6a1bb69f322e7e71d36bb363863fe", { expiresIn: "1h" });

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
              username: user.username,
              email: user.email,
            },
          });
        // res.status(201).json({ message: "User registered successfully. OTP sent!" });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


// exports.verifyOtp = async (req, res) => {
//     try {
//         const { phoneNumber, otp } = req.body;

//         const user = await User.findOne({ phoneNumber });
//         if (!user) return res.status(400).json({ message: "User not found" });
//         console.log(user.sendOtp,"otp");
//         if (String(user.sendOtp) !== String(otp)) {
//             return res.status(400).json({ message: "Invalid OTP" });
//           }

          
//         // if (user.sendOtp !== otp) {
//         //     return res.status(400).json({ message: "Invalid OTP" });
//         // }
//         user.verifyOtp = otp;
//         user.sendOtp = otp; // Clear OTP after verification
//         await user.save();
//         res.json({ message: "OTP verified successfully!" });
//     } catch (error) {
//         console.error("Verify OTP error:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// };





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





exports.verifyOtp = async (req, res) => {
    try {
        // Get email and otp from request body
        const { email, otp } = req.body;

        // Find user by email instead of phone number
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });
        
        console.log("Stored OTP:", user.sendOtp);
        console.log("Received OTP:", otp);
        
        // Compare OTPs as strings
        if (String(user.sendOtp) !== String(otp)) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Mark user as verified and clear the OTP
        user.verifyOtp = "verified";
        user.sendOtp = null; // Clear OTP after verification
        await user.save();
        
        res.status(200).json({ 
            message: "OTP verified successfully!",
            verified: true
        });
    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};