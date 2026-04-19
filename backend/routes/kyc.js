import express from 'express';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

//
// ─────────────────────────────────────────────
// ✅ MOCK AADHAAR OTP (NO EXTERNAL API)
// ─────────────────────────────────────────────
//

router.post('/aadhaar-otp', authMiddleware, async (req, res) => {
  try {
    const { aadhaar } = req.body;

    if (!aadhaar || !/^\d{12}$/.test(aadhaar)) {
      return res.status(400).json({
        success: false,
        message: 'Enter valid 12-digit Aadhaar number',
      });
    }

    const masked = 'XXXX XXXX ' + aadhaar.slice(-4);
    const txnId = 'TXN' + Date.now();

    // 🔥 ALWAYS SAME OTP FOR TESTING
    const otp = '123456';

    // store OTP
    global.aadhaarOTP = global.aadhaarOTP || {};
    global.aadhaarOTP[txnId] = otp;

    console.log(`\n🆔 [AADHAAR MOCK] Aadhaar: ${masked}`);
    console.log(`TxnId: ${txnId}`);
    console.log(`OTP: ${otp}\n`);

    res.json({
      success: true,
      txnId,
      maskedAadhaar: masked,
      sandboxMode: true,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


//
// ─────────────────────────────────────────────
// ✅ VERIFY MOCK AADHAAR OTP
// ─────────────────────────────────────────────
//

router.post('/aadhaar-verify', authMiddleware, async (req, res) => {
  try {
    const { txnId, otp, aadhaarLast4 } = req.body;

    if (!txnId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID and OTP required',
      });
    }

    // check OTP
    if (global.aadhaarOTP?.[txnId] !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP (use 123456)',
      });
    }

    // update user KYC
    await User.findByIdAndUpdate(req.user._id, {
      isKycVerified: true,
      'kyc.aadhaarLast4': aadhaarLast4 || '0000',
      'kyc.verifiedAt': new Date(),
      'kyc.sandboxRef': txnId,
    });

    res.json({
      success: true,
      message: 'KYC verified successfully (mock)',
      kycData: {
        name: req.user.name || 'Verified User',
        dob: '1995-01-01',
        gender: 'M',
        state: 'India',
      },
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


//
// ─────────────────────────────────────────────
// ✅ LINK PLATFORM
// ─────────────────────────────────────────────
//

router.post('/link-platform', authMiddleware, async (req, res) => {
  try {
    const { platform } = req.body;

    const valid = ['swiggy', 'zomato', 'blinkit', 'zepto', 'dunzo'];

    if (!valid.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform',
      });
    }

    const user = await User.findById(req.user._id);

    if (!user.platform.linked.includes(platform)) {
      user.platform.linked.push(platform);
      user.platform.linkedAt = new Date();
      await user.save();
    }

    res.json({
      success: true,
      linked: user.platform.linked,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


//
// ─────────────────────────────────────────────
// ✅ ZONE SCAN (MOCK)
// ─────────────────────────────────────────────
//

router.post('/zone-scan', authMiddleware, async (req, res) => {
  try {
    const { lat, lng } = req.body;

    const zones = [
      { area: 'South Mumbai', city: 'Mumbai', riskScore: 12, flood: 'Low', traffic: 'High' },
      { area: 'Andheri West', city: 'Mumbai', riskScore: 28, flood: 'Medium', traffic: 'High' },
      { area: 'Koramangala', city: 'Bengaluru', riskScore: 8, flood: 'Low', traffic: 'Medium' },
      { area: 'Sector 62', city: 'Noida', riskScore: 15, flood: 'Low', traffic: 'Medium' },
      { area: 'T Nagar', city: 'Chennai', riskScore: 35, flood: 'High', traffic: 'High' },
    ];

    const zone = zones[Math.floor(Math.random() * zones.length)];

    await User.findByIdAndUpdate(req.user._id, {
      'zone.city': zone.city,
      'zone.area': zone.area,
      'zone.riskScore': zone.riskScore,
      'zone.lat': lat || 19.076,
      'zone.lng': lng || 72.877,
    });

    res.json({
      success: true,
      zone,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


//
// ─────────────────────────────────────────────
// ✅ LOCATION UPDATE
// ─────────────────────────────────────────────
//

router.post('/location-update', authMiddleware, async (req, res) => {
  try {
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);
    const accuracy = Number(req.body?.accuracy ?? 0);
    const speed = Number(req.body?.speed ?? 0);
    const heading = Number(req.body?.heading ?? 0);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'lat and lng are required numbers',
      });
    }

    const user = await User.findById(req.user._id);

    user.zone = {
      ...(user.zone || {}),
      lat,
      lng,
      accuracy,
      speed,
      heading,
      lastGpsAt: new Date().toISOString(),
    };

    await user.save();

    res.json({
      success: true,
      location: user.zone,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


//
// ─────────────────────────────────────────────
// ✅ GET LOCATION
// ─────────────────────────────────────────────
//

router.get('/location', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      location: user.zone || {},
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;