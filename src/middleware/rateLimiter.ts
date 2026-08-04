import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../lib/redis';

// --- CONFIGURATION ---
const LIMITS = {
  GUEST: { points: 5000, duration: 60 },
  AUTH: { points: 10000, duration: 60 },
  PREMIUM: { points: 50000, duration: 60 },
  MESSAGING: { points: 3000, duration: 60 },
  TYPING: { points: 10000, duration: 60 },
  RECEIPTS: { points: 20000, duration: 60 },
  DDoS: { points: 200, duration: 1 }, 
  ABUSE: { points: 500, duration: 3600 }, 
  PAYMENTS: { points: 100, duration: 600 }, 
} as const;

// --- INITIALIZATION ---
// We use multiple limiters for different purposes
let generalLimiterGuest: RateLimiterRedis | RateLimiterMemory;
let generalLimiterAuth: RateLimiterRedis | RateLimiterMemory;
let generalLimiterPremium: RateLimiterRedis | RateLimiterMemory;
let messagingLimiter: RateLimiterRedis | RateLimiterMemory;
let typingLimiter: RateLimiterRedis | RateLimiterMemory;
let receiptsLimiter: RateLimiterRedis | RateLimiterMemory;
let ddosLimiter: RateLimiterRedis | RateLimiterMemory;
let abuseLimiter: RateLimiterRedis | RateLimiterMemory;
let paymentsLimiter: RateLimiterRedis | RateLimiterMemory;

function initMemoryLimiters() {
  console.warn('Initializing Local In-Memory Rate Limiters (No REDIS_URL or Offline Redis)...');

  generalLimiterGuest = new RateLimiterMemory({
    keyPrefix: 'rl_gen_gst',
    points: LIMITS.GUEST.points,
    duration: LIMITS.GUEST.duration,
    blockDuration: 60 * 15,
  });

  generalLimiterAuth = new RateLimiterMemory({
    keyPrefix: 'rl_gen_ath',
    points: LIMITS.AUTH.points,
    duration: LIMITS.AUTH.duration,
    blockDuration: 60 * 15,
  });

  generalLimiterPremium = new RateLimiterMemory({
    keyPrefix: 'rl_gen_prm',
    points: LIMITS.PREMIUM.points,
    duration: LIMITS.PREMIUM.duration,
    blockDuration: 60 * 15,
  });

  messagingLimiter = new RateLimiterMemory({
    keyPrefix: 'rl_msg',
    points: LIMITS.MESSAGING.points,
    duration: LIMITS.MESSAGING.duration,
  });

  typingLimiter = new RateLimiterMemory({
    keyPrefix: 'rl_typ',
    points: LIMITS.TYPING.points,
    duration: LIMITS.TYPING.duration,
  });

  receiptsLimiter = new RateLimiterMemory({
    keyPrefix: 'rl_rec',
    points: LIMITS.RECEIPTS.points,
    duration: LIMITS.RECEIPTS.duration,
  });

  ddosLimiter = new RateLimiterMemory({
    keyPrefix: 'rl_ddos',
    points: LIMITS.DDoS.points,
    duration: LIMITS.DDoS.duration,
    blockDuration: 60 * 60,
  });

  abuseLimiter = new RateLimiterMemory({
    keyPrefix: 'rl_abuse',
    points: LIMITS.ABUSE.points,
    duration: LIMITS.ABUSE.duration,
    blockDuration: 60 * 60 * 24,
  });

  paymentsLimiter = new RateLimiterMemory({
    keyPrefix: 'rl_pay',
    points: LIMITS.PAYMENTS.points,
    duration: LIMITS.PAYMENTS.duration,
    blockDuration: 60 * 30,
  });
}

function initLimiters() {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      console.log('Saving Scalable Distributed Redis Rate Limiters...');
      const redis = getRedisClient();

      generalLimiterGuest = new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: 'rl_gen_gst',
        points: LIMITS.GUEST.points,
        duration: LIMITS.GUEST.duration,
        blockDuration: 60 * 15,
      });

      generalLimiterAuth = new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: 'rl_gen_ath',
        points: LIMITS.AUTH.points,
        duration: LIMITS.AUTH.duration,
        blockDuration: 60 * 15,
      });

      generalLimiterPremium = new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: 'rl_gen_prm',
        points: LIMITS.PREMIUM.points,
        duration: LIMITS.PREMIUM.duration,
        blockDuration: 60 * 15,
      });

      messagingLimiter = new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: 'rl_msg',
        points: LIMITS.MESSAGING.points,
        duration: LIMITS.MESSAGING.duration,
      });

      typingLimiter = new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: 'rl_typ',
        points: LIMITS.TYPING.points,
        duration: LIMITS.TYPING.duration,
      });

      receiptsLimiter = new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: 'rl_rec',
        points: LIMITS.RECEIPTS.points,
        duration: LIMITS.RECEIPTS.duration,
      });

      ddosLimiter = new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: 'rl_ddos',
        points: LIMITS.DDoS.points,
        duration: LIMITS.DDoS.duration,
        blockDuration: 60 * 60,
      });

      abuseLimiter = new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: 'rl_abuse',
        points: LIMITS.ABUSE.points,
        duration: LIMITS.ABUSE.duration,
        blockDuration: 60 * 60 * 24,
      });

      paymentsLimiter = new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: 'rl_pay',
        points: LIMITS.PAYMENTS.points,
        duration: LIMITS.PAYMENTS.duration,
        blockDuration: 60 * 30,
      });
      return;
    } catch (e) {
      console.error('Failed to initialize Redis rate limiters, falling back to local memory:', e);
    }
  }

  initMemoryLimiters();
}

// --- MIDDLEWARE ---
// Specialized Limiter for Payments
export const paymentRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  if (!paymentsLimiter) initLimiters();
  const userId = req.user?.uid || req.ip || 'unknown';
  
  try {
    await paymentsLimiter.consume(userId);
    next();
  } catch (error) {
    res.status(429).json({
      error: "PAYMENT_OVERLOAD",
      message: "Payment rate limit exceeded. Please wait 30 minutes before trying again.",
      retryAfter: Math.round(error instanceof RateLimiterRes ? error.msBeforeNext / 1000 : 1800)
    });
  }
};

export const aeirmistRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  if (!generalLimiterGuest) initLimiters();

  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  // 1. Identify User & Determine Tier
  const user = req.user; 
  const userId = user?.uid || ip; 
  const role = user?.role || 'guest';
  
  // Admin bypass
  if (role === 'admin') return next();

  try {
    // 2. DDoS Mitigation (Per IP Burst Protection)
    await ddosLimiter.consume(ip);

    // 3. Application Level Limiting (By User ID/IP)
    if (role === 'premium') {
      await generalLimiterPremium.consume(userId, 1);
    } else if (role === 'authenticated') {
      await generalLimiterAuth.consume(userId, 1);
    } else {
      await generalLimiterGuest.consume(userId, 1);
    }

    // 4. Specialized Path Limiting
    const path = req.path;
    
    if (path.startsWith('/api/messages')) {
      await messagingLimiter.consume(userId);
    } else if (path.startsWith('/api/typing')) {
      await typingLimiter.consume(userId);
    } else if (path.startsWith('/api/receipts')) {
      await receiptsLimiter.consume(userId);
    }

    next();
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      // Abuse detection: If they keep hitting the limit repeatedly, consume abuse points
      try {
        await abuseLimiter.consume(userId);
      } catch (abuseError) {
        // AUTO-BAN obvious bots/attackers
        console.error(`AUTO-BAN triggered for ${userId}`);
        return res.status(403).json({
          error: "ACCESS_DENIED",
          message: "Your account has been temporarily suspended due to suspicious activity. Please contact support.",
          retryAfter: Math.round(abuseError instanceof RateLimiterRes ? abuseError.msBeforeNext / 1000 : 86400)
        });
      }

      res.status(429).json({
        error: "TOO_MANY_REQUESTS",
        message: "Feedback overloaded. Please wait before attempting activity again.",
        retryAfter: Math.round(error.msBeforeNext / 1000),
        limit: points_for_tier(role),
        remaining: error.remainingPoints
      });
    } else {
      // Redis error or something else - fail open or closed? 
      // In production, we usually fail open (next()) to avoid blocking users if Redis is down, 
      // but log it heavily.
      console.error('Rate Limiter Error:', error);
      next();
    }
  }
};

function points_for_tier(role: string): number {
  if (role === 'premium') return LIMITS.PREMIUM.points;
  if (role === 'authenticated') return LIMITS.AUTH.points;
  return LIMITS.GUEST.points;
}

// Utility to explicitly flag abuse (e.g., from an login failure handler)
export const flagAbuse = async (userId: string) => {
  if (!abuseLimiter) initLimiters();
  try {
    await abuseLimiter.consume(userId);
  } catch (e) {
    // User is banned
  }
};
