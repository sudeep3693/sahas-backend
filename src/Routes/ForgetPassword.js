import { Router } from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const router = Router();

let otpStore = {};

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "sudeepsubedi72@gmail.com",
    pass: "qddo oqkj cixq sgnk", // ⚠️ Should be stored in env variable
  },
});

/**
 * @route POST /otp/send
 * @desc Send OTP to email
 */
router.post('/send', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const otp = crypto.randomInt(100000, 999999).toString();
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // expires in 5 mins

  const mailOptions = {
    from: process.env.GMAIL_USER || "sudeepsubedi72@gmail.com",
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      console.error('OTP Send Error:', error);
      return res.status(500).json({ message: 'Failed to send OTP' });
    }
    res.json({ message: 'OTP sent successfully' });
  });
});

/**
 * @route POST /otp/verify
 * @desc Verify OTP
 */
router.post('/verify', (req, res) => {
  const { email, otp } = req.body;

  const stored = otpStore[email];
  if (!stored) return res.status(400).json({ message: 'OTP not found' });

  if (Date.now() > stored.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ message: 'OTP expired' });
  }

  if (stored.otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  delete otpStore[email];
  res.json({ message: 'OTP verified successfully' });
});

/**
 * @route POST /password/generate
 * @desc Generate random 8-character password and send via email
 */
router.post('/password/generate', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  // Generate 8-char password (letters + digits)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const mailOptions = {
    from: process.env.GMAIL_USER || "sudeepsubedi72@gmail.com",
    to: email,
    subject: 'Your New Password',
    text: `Your new password is: ${password}`,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      console.error('Password Send Error:', error);
      return res.status(500).json({ message: 'Failed to send password' });
    }

    // TODO: Save hashed password to DB if needed
    res.json({ message: 'Password sent successfully', password });
  });
});

export default router;
