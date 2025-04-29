require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const PORT = process.env.PORT || 3000;

const authRoute = require("./routes/authRoutes");

const app = express();

app.use(cors({
  origin: 'https://easewithdraw.com', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true, // Allow cookies/auth headers
}));

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));


  console.log("MONGO_URL:", process.env.MONGO_URL);

app.use("/auth",authRoute);   

app.use('/health', (req, res) => {
  res.status(200).json({ status: "UP" });
}
);


app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*'); // Dynamically allow origin
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true'); // Required if credentials are used
  next();
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});