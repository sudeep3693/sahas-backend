import { Router } from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import Credintal from '../Model/Credintals.js';
import AesUtil from '../AesUtil.js';

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
    subject: 'Sahas OTP Code',
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
router.post('/password/generate', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const encryptedPassword = AesUtil.encrypt(password);

    const mailOptions = {
      from: process.env.GMAIL_USER || "sudeepsubedi72@gmail.com",
      to: email,
      subject: 'Your Website New Password',
      text: `Your new password is: ${password}`,
    };

    transporter.sendMail(mailOptions, async (error) => {
      if (error) {
        console.error('Password Send Error:', error);
        return res.status(500).json({ message: 'Failed to send password' });
      }

      try {
        await Credintal.findOneAndUpdate(
          { username: email },
          { password: encryptedPassword },
          { new: true, upsert: true }
        );

        res.json({ message: 'Password sent and updated successfully' });
      } catch (dbErr) {
        console.error('DB Update Error:', dbErr);
        res.status(500).json({ message: 'Email sent, but DB update failed' });
      }
    });

  } catch (err) {
    console.error('Password Generate Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
