const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require ('../models/login')
const nodemailer = require("nodemailer");
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

// send otp 
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

// Route to verify OTP
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
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      user = new User({ name, email, password: hashedPassword });
      
      await user.save();
  
      res.status(200).json({ message: 'User registered successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

// Login route
router.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User does not exist' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;
