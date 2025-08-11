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
    pass: "qddo oqkj cixq sgnk",
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
    from: process.env.GMAIL_USER,
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

export default router;
