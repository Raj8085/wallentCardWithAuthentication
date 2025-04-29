// // Update your mailer.js or create a new email sending function
// const nodemailer = require('nodemailer');

// // Configure your email transporter
// const transporter = nodemailer.createTransport({
//     host: "smtpout.secureserver.net",
//     port: "465",
//     secure: process.env.SMTP_PORT === "465", // true for port 465
//     auth: {
//       user: "info@easewithdraw.com",
//       pass: "Ease@1234",
//     },
// });

// // Function to send HTML email with logo
// const sendVerificationEmail = async (to, subject, otp) => {
//   try {
//     // HTML email template with logo and styled content
//     const htmlContent = `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <style>
//           body {
//             font-family: Arial, sans-serif;
//             line-height: 1.6;
//             color: #333333;
//           }
//           .email-container {
//             max-width: 600px;
//             margin: 0 auto;
//             padding: 20px;
//             border: 1px solid #e4e4e4;
//             border-radius: 5px;
//           }
//           .header {
//             text-align: center;
//             padding-bottom: 20px;
//             border-bottom: 1px solid #e4e4e4;
//           }
//           .logo {
//             max-width: 150px;
//             height: auto;
//           }
//           .content {
//             padding: 20px 0;
//           }
//           .verification-code {
//             font-size: 24px;
//             font-weight: bold;
//             color: #4285f4;
//             padding: 10px;
//             background-color: #f5f5f5;
//             border-radius: 4px;
//             text-align: center;
//             margin: 15px 0;
//             letter-spacing: 5px;
//           }
//           .footer {
//             margin-top: 20px;
//             font-size: 12px;
//             color: #777777;
//             text-align: center;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="email-container">
//           <div class="header">
//             <img src="http://localhost:3001/public/images/ease.png" alt="EaseWithdraw Logo" width="150">
//           </div>
//           <div class="content">
//             <h2>Email Verification</h2>
//             <p>Thank you for registering with our service. To complete your registration, please use the verification code below:</p>
//             <div class="verification-code">${otp}</div>
//             <p>This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.</p>
//           </div>
//           <div class="footer">
//             <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
//             <p>If you have any questions, please contact our support team.</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;

//     const mailOptions = {
//     from: "info@easewithdraw.com",
//       to: to,
//       subject: subject,
//       html: htmlContent
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log('Email sent successfully:', info.messageId);
//     return true;
//   } catch (error) {
//     console.error('Error sending email:', error);
//     return false;
//   }
// };

// module.exports = {
//   sendVerificationEmail
// };


const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Configure your email transporter
const transporter = nodemailer.createTransport({
    host: "smtpout.secureserver.net",
    port: "465",
    secure: true, // true for port 465
    auth: {
      user: "info@easewithdraw.com",
      pass: "Ease@1234",
    },
});

// Function to send HTML email with logo
const sendVerificationEmail = async (to, subject, otp) => {
  try {
    // Get the absolute path to your logo file
    // const logoPath = path.join(process.cwd(), 'public', 'images', 'easy-withdraw-logo.png');
    
    // Read the logo file and convert to base64
    // const logoBase64 = fs.readFileSync(logoPath).toString('base64');
    
    // HTML email template with embedded base64 logo
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #e4e4e4;
            border-radius: 5px;
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #e4e4e4;
          }
          .logo {
            max-width: 150px;
            height: auto;
          }
          .content {
            padding: 20px 0;
          }
          .verification-code {
            font-size: 24px;
            font-weight: bold;
            color: #4285f4;
            padding: 10px;
            background-color: #f5f5f5;
            border-radius: 4px;
            text-align: center;
            margin: 15px 0;
            letter-spacing: 5px;
          }
          .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #777777;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>easewithdraw</h1>
          </div>
          <div class="content">
            <h2>Email Verification</h2>
            <p>Thank you for registering with our service. To complete your registration, please use the verification code below:</p>
            <div class="verification-code">${otp}</div>
            <p>This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} EaseWithdraw. All rights reserved.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: "info@easewithdraw.com",
      to: to,
      subject: subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail
};