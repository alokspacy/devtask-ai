import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseService } from '../services/auth.service';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { db } from '../db';

const router = Router();

const authCredentialsSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

router.post(
  '/signup',
  validate(authCredentialsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const data = await supabaseService.signUp(email, password);

      // Record user metadata locally if user was created
      if (data?.user?.id) {
        try {
          await db.query(
            `INSERT INTO users_metadata (supabase_user_id, email)
             VALUES ($1, $2)
             ON CONFLICT (supabase_user_id) DO NOTHING;`,
            [data.user.id, email]
          );
        } catch (dbErr) {
          console.warn('Could not record user metadata in local DB:', (dbErr as Error).message);
        }
      }

      res.status(201).json({
        message: 'User registered successfully',
        user: data.user ? { id: data.user.id, email: data.user.email } : null,
        session: data.session ? { access_token: data.session.access_token } : null,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/login',
  validate(authCredentialsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const data = await supabaseService.signInWithPassword(email, password);

      // Ensure user metadata exists
      if (data?.user?.id) {
        try {
          await db.query(
            `INSERT INTO users_metadata (supabase_user_id, email)
             VALUES ($1, $2)
             ON CONFLICT (supabase_user_id) DO NOTHING;`,
            [data.user.id, email]
          );
        } catch (dbErr) {
          console.warn('Could not record user metadata in local DB:', (dbErr as Error).message);
        }
      }

      res.status(200).json({
        message: 'Login successful',
        user: { id: data.user.id, email: data.user.email },
        access_token: data.session?.access_token || '',
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/logout',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1] || '';
      await supabaseService.signOut(token);
      res.status(200).json({
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
