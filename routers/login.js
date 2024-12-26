const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/login"); // Your User model
require("dotenv").config();

const otps = {};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Generate JWT token
const generateToken = (userId) => {
  const secretKey = process.env.JWT_SECRET || "your-secret-key"; // Replace with your secret key
  return jwt.sign({ id: userId }, secretKey, { expiresIn: "1h" }); // Token expires in 1 hour
};

// Send OTP
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const otp = generateOtp();
  otps[email] = otp;

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Your OTP for Email Verification',
    text: `Your OTP for verification is: ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Error sending OTP:', error.message);
    res.status(500).json({ message: 'Failed to send OTP.', error: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  if (otps[email] === otp) {
    delete otps[email];
    res.status(200).json({ message: 'OTP verified successfully.' });
  } else {
    res.status(400).json({ message: 'Invalid or expired OTP.' });
  }
});

// Signup route
router.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      isVerified: false,
    });

    await newUser.save();

    const verificationUrl = `http://localhost:3000/verify/${verificationToken}`;
    await sendVerificationEmail(email, verificationUrl);

    res.status(200).json({ message: 'User registered. Please verify your email to continue.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Verification route
router.get('/api/verify/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Login route with token generation
router.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User does not exist' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Email not verified. Please check your inbox.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

module.exports = router;
