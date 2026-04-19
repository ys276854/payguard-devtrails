import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import kycRoutes from './routes/kyc.js';
import policyRoutes from './routes/policy.js';
import adminRoutes from './routes/admin.js';
import simulateRoutes from './routes/simulate.js';
import monitorRoutes from './routes/monitor.js';
import premiumRoutes from './routes/premium.js';

import { initDb } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

//
// ─────────────────────────────────────────────
// ✅ CORS FIX (ALLOW ALL VERCEL + LOCAL)
// ─────────────────────────────────────────────
//

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL, // optional
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow tools like Postman / curl
    if (!origin) return callback(null, true);

    // ✅ allow ALL Vercel domains automatically
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }

    // allow local + env
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log('❌ Blocked by CORS:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

//
// ─────────────────────────────────────────────
// ✅ BODY PARSER
// ─────────────────────────────────────────────
//

app.use(express.json());

//
// ─────────────────────────────────────────────
// ✅ RATE LIMIT
// ─────────────────────────────────────────────
//

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many OTP requests. Try again later.',
  },
});

app.use('/api/auth/send-otp', otpLimiter);

//
// ─────────────────────────────────────────────
// ✅ ROUTES
// ─────────────────────────────────────────────
//

app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/simulate', simulateRoutes);
app.use('/api/monitor', monitorRoutes);
app.use('/api/premium', premiumRoutes);

//
// ─────────────────────────────────────────────
// ✅ HEALTH CHECK
// ─────────────────────────────────────────────
//

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.send('PayGuard API running 🚀');
});

//
// ─────────────────────────────────────────────
// ✅ START SERVER
// ─────────────────────────────────────────────
//

const start = async () => {
  try {
    await initDb();
    console.log('✅ DB connected');

    const server = createServer(app);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ Server error:', err.message);
    process.exit(1);
  }
};

start();