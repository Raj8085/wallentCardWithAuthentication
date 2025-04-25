// // models/User.js
const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema(
//   {
//     username: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     password: {
//       type: String,
//       required: true,
//     },
//     email : {
//       type : String,
//       required : true,
//       unique : true
//     },
//     phoneNumber:{
//       type:Number,
//       required:true,
//   },
//   verifyOtp:{
//       type:Number,
//   },
//   sendOtp:{
//       type : String,
//   },
//   mailOtp :{
//     type : String,
//   }
//   },
//   { timestamps: true }
// );
// module.exports = mongoose.model("User", userSchema);



const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    phoneNumber: {
      type: String, // Change to String for consistency
      required: true,
    },
    verifyOtp: {
      type: String, // Change to String for consistency
    },
    sendOtp: {
      type: String,
    },
    mailOtp: {
      type: String,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);