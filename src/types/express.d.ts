import { Session } from 'express-session';

export interface AeirmistUserClaims {
  uid: string;
  email?: string;
  role?: 'guest' | 'authenticated' | 'premium' | 'admin';
  isPremium?: boolean;
  isVerified?: boolean;
  [key: string]: unknown;
}

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: AeirmistUserClaims;
      session: Session & { csrfToken?: string };
    }
  }
}
