import { Request, Response, NextFunction } from 'express';
import { supabaseService } from '../services/auth.service';
import { AppError } from './errorHandler';

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Missing or invalid Authorization header. Expected Bearer token.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Authentication token missing.', 401);
    }

    const user = await supabaseService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
