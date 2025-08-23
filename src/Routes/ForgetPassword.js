import { Router } from 'express';
import crypto from 'crypto';
import 'dotenv/config';
import nodemailer from 'nodemailer';
import Credintal from '../Model/Credintals.js';
import { encrypt } from '../AesUtil.js';

const router = Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.PASSWORD,
  },
});

/**
 * @route POST /credintial/send
 * @desc Send OTP to email and save in DB
 */
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const otp = crypto.randomInt(100000, 999999).toString();

    const encryptedUsername = encrypt(email);
    // Save OTP + expiry in DB
    await Credintal.findOneAndUpdate(
      { username: encryptedUsername },
      {
        otp_secret: otp,
        otp_expiry: new Date(Date.now() + 5 * 60 * 1000),
      },
      { new: true, upsert: false }
    );

    const mailOptions = {
      from: process.env.GMAIL_USER,
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
  } catch (err) {
    console.error('OTP Store Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @route POST /credintial/verify
 * @desc Verify OTP from DB and clear it after success/expiry
 */
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const encryptedUsername = encrypt(email);
    const user = await Credintal.findOne({ username: encryptedUsername });
    if (!user || !user.otp_secret) {
      return res.status(400).json({ message: 'OTP not found. Please request again.' });
    }

    if (user.otp_expiry < Date.now()) {
      // Expired → clear
      user.otp_secret = undefined;
      user.otp_expiry = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP expired' });
    }

    if (user.otp_secret !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.otp_secret = undefined;
    user.otp_expiry = undefined;
    await user.save();

    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('OTP Verify Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
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

    const encryptedPassword = encrypt(password);
    const encryptedUsername = encrypt(email);

    const mailOptions = {
      from: process.env.GMAIL_USER,
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
          { username: encryptedUsername },
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


/**
 * @route POST /password/change
 * @desc Change password if previousPassword matches
 */
router.post('/password/change', async (req, res) => {
  try {
    const { email, previousPassword, newPassword } = req.body;
    if (!email || !previousPassword || !newPassword) {
      return res.status(400).json({ message: 'Email, previous password, and new password are required' });
    }

    const encryptedUsername = encrypt(email);
    const user = await Credintal.findOne({ username: encryptedUsername });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const encryptedPreviousPassword = encrypt(previousPassword);

    if (user.password !== encryptedPreviousPassword) {
      return res.status(400).json({ message: 'Previous password is incorrect' });
    }
    const encryptedNewPassword = encrypt(newPassword);
    user.password = encryptedNewPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Password Change Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});



export default router;
