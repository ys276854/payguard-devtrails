import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

import {
  sendOTP as sendOTPService,
  verifyOTP
} from '../controllers/otpService.js';

import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ─────────────────────────────────────────────
// ✅ JWT TOKEN
// ─────────────────────────────────────────────
const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// ─────────────────────────────────────────────
// ✅ SEND OTP
// ─────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { phone, purpose = 'register' } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone required',
      });
    }

    const result = await sendOTPService(phone, purpose);
    return res.json(result);

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// ✅ VERIFY OTP
// ─────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, purpose = 'register', name } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone & OTP required',
      });
    }

    const record = await verifyOTP(phone, otp);

    if (!record.valid) {
      return res.status(400).json({
        success: false,
        message: record.reason,
      });
    }

    let user;

    // ───────── REGISTER ─────────
    if (purpose === 'register') {
      user = await User.findOneAndUpdate(
        { phone },
        {
          phone,
          name: name || '',
          isPhoneVerified: true,
        },
        {
          upsert: true,
          new: true,
        }
      );
    }

    // ───────── LOGIN (FIXED) ─────────
    if (purpose === 'login') {
      user = await User.findOne({ phone });

      // 🔥 FIX: auto-create user if not exists
      if (!user) {
        user = await User.create({
          phone,
          name: name || '',
          isPhoneVerified: true,
        });
      }
    }

    const token = signToken(user._id);

    return res.json({
      success: true,
      token,
      user: sanitizeUser(user),
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// ✅ CURRENT USER
// ─────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    user: sanitizeUser(user),
  });
});

// ─────────────────────────────────────────────
// ✅ PREFERENCES
// ─────────────────────────────────────────────
router.patch('/preferences', authMiddleware, async (req, res) => {
  const { language, theme } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { language, theme },
    { new: true }
  );

  res.json({
    success: true,
    user: sanitizeUser(user),
  });
});

// ─────────────────────────────────────────────
// ✅ SANITIZE USER
// ─────────────────────────────────────────────
function sanitizeUser(u) {
  return {
    id: u._id,
    phone: u.phone,
    name: u.name,
    isPhoneVerified: u.isPhoneVerified,
    isKycVerified: u.isKycVerified,
    policy: u.policy,
  };
}

export default router;