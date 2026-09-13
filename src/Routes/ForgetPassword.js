import { Router } from 'express';
import crypto from 'crypto';
import 'dotenv/config';
import nodemailer from 'nodemailer';
import Credintal from '../Model/Credintals.js';
import { encrypt } from '../AesUtil.js';

const router = Router();

const getTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.PASSWORD,
    },
  });
};

/**
 * @route POST /credential/send
 * @desc Send OTP to registered admin email and save in DB
 */
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await Credintal.findOne({
      $or: [
        { username: encrypt(email.trim().toLowerCase()) },
        { username: encrypt(email.trim()) }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'No registered admin account found with this email' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    // Save OTP + expiry in DB (valid for 10 minutes)
    user.otp_secret = otp;
    user.otp_expiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const mailOptions = {
      from: `"Sahas Cooperative" <${process.env.GMAIL_USER}>`,
      to: email.trim(),
      subject: 'Password Reset OTP Code - Sahas Cooperative',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #002B5B; margin-top: 0;">Sahas Cooperative Admin</h2>
          <p style="color: #333333; font-size: 15px;">Hello,</p>
          <p style="color: #333333; font-size: 15px;">You have requested to reset your password. Use the 6-digit OTP code below to verify your request:</p>
          <div style="text-align: center; margin: 28px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #28A745; background-color: #E8F5E9; padding: 12px 28px; border-radius: 8px; border: 1px dashed #28A745;">
              ${otp}
            </span>
          </div>
          <p style="color: #666666; font-size: 13px;">This code will expire in <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email or notify your system administrator immediately.</p>
          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
          <p style="color: #999999; font-size: 12px; margin-bottom: 0;">&copy; Sahas Saving and Credit Cooperative Society Ltd.</p>
        </div>
      `,
      text: `Your Sahas Cooperative OTP code is ${otp}. It will expire in 10 minutes.`,
    };

    const transporter = getTransporter();
    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error('OTP Send Error:', error);
        return res.status(500).json({ message: 'Failed to send OTP email. Please verify mail credentials.' });
      }
      res.status(200).json({ message: 'OTP sent successfully to your email' });
    });
  } catch (err) {
    console.error('OTP Store Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @route POST /credential/verify
 * @desc Verify OTP from DB without resetting (for intermediate verification check)
 */
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const user = await Credintal.findOne({
      $or: [
        { username: encrypt(email.trim().toLowerCase()) },
        { username: encrypt(email.trim()) }
      ]
    });
    if (!user || !user.otp_secret) {
      return res.status(400).json({ message: 'No OTP request found. Please request an OTP first.' });
    }

    if (user.otp_expiry < Date.now()) {
      user.otp_secret = undefined;
      user.otp_expiry = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otp_secret !== otp.toString().trim()) {
      return res.status(400).json({ message: 'Invalid OTP code. Please check and try again.' });
    }

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('OTP Verify Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @route POST /credential/password/reset
 * @route POST /credential/reset
 * @desc Atomically verify OTP and set custom new password
 */
const handlePasswordReset = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await Credintal.findOne({
      $or: [
        { username: encrypt(email.trim().toLowerCase()) },
        { username: encrypt(email.trim()) }
      ]
    });

    if (!user || !user.otp_secret) {
      return res.status(400).json({ message: 'No OTP request found. Please request a new OTP.' });
    }

    if (user.otp_expiry < Date.now()) {
      user.otp_secret = undefined;
      user.otp_expiry = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otp_secret !== otp.toString().trim()) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    // Set new password
    user.password = encrypt(newPassword);
    user.otp_secret = undefined;
    user.otp_expiry = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully! You can now log in.' });
  } catch (err) {
    console.error('Password Reset Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

router.post('/password/reset', handlePasswordReset);
router.post('/reset', handlePasswordReset);

/**
 * @route POST /credential/password/generate
 * @desc Generate random 8-character password and send via email (kept for backward compatibility)
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
    const encryptedUsername = encrypt(email.trim().toLowerCase());

    const mailOptions = {
      from: `"Sahas Cooperative" <${process.env.GMAIL_USER}>`,
      to: email.trim(),
      subject: 'Your New Generated Password - Sahas Cooperative',
      text: `Your new temporary password is: ${password}`,
    };

    const transporter = getTransporter();
    transporter.sendMail(mailOptions, async (error) => {
      if (error) {
        console.error('Password Send Error:', error);
        return res.status(500).json({ message: 'Failed to send password email' });
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
 * @route POST /credential/password/change
 * @desc Change password if previousPassword matches
 */
router.post('/password/change', async (req, res) => {
  try {
    const { email, previousPassword, newPassword } = req.body;
    if (!email || !previousPassword || !newPassword) {
      return res.status(400).json({ message: 'Email, previous password, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    if (previousPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from previous password' });
    }

    const user = await Credintal.findOne({
      $or: [
        { username: encrypt(email.trim().toLowerCase()) },
        { username: encrypt(email.trim()) }
      ]
    });
    if (!user) {
      return res.status(404).json({ message: 'Admin account with this email not found' });
    }

    const encryptedPreviousPassword = encrypt(previousPassword);

    if (user.password !== encryptedPreviousPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = encrypt(newPassword);
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Password Change Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
