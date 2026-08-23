import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(config.supabase.url, config.supabase.anonKey);
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  async verifyToken(token: string): Promise<{ id: string; email?: string }> {
    // In test environment, allow mock tokens for deterministic offline test suites
    if (process.env.NODE_ENV === 'test' && token.startsWith('test-token-')) {
      const mockUserId = token.replace('test-token-', '');
      return {
        id: mockUserId || '00000000-0000-0000-0000-000000000001',
        email: 'testuser@devtask.ai',
      };
    }

    try {
      const { data: { user }, error } = await this.client.auth.getUser(token);
      if (error || !user) {
        throw new AppError('Invalid or expired authentication token', 401);
      }
      return {
        id: user.id,
        email: user.email,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError('Authentication failed', 401, err.message);
    }
  }

  async signUp(email: string, password: string): Promise<any> {
    // For test environment offline support
    if (process.env.NODE_ENV === 'test' && config.supabase.url.includes('placeholder')) {
      return {
        user: { id: '00000000-0000-0000-0000-000000000001', email },
        session: { access_token: 'test-token-00000000-0000-0000-0000-000000000001' },
      };
    }

    const { data, error } = await this.client.auth.signUp({ email, password });
    if (error) {
      throw new AppError(error.message, 400);
    }
    return data;
  }

  async signInWithPassword(email: string, password: string): Promise<any> {
    // For test environment offline support
    if (process.env.NODE_ENV === 'test' && config.supabase.url.includes('placeholder')) {
      return {
        user: { id: '00000000-0000-0000-0000-000000000001', email },
        session: { access_token: 'test-token-00000000-0000-0000-0000-000000000001' },
      };
    }

    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) {
      throw new AppError(error.message, 401);
    }
    return data;
  }

  async signOut(token: string): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    const { error } = await this.client.auth.signOut();
    if (error) {
      throw new AppError(error.message, 400);
    }
  }
}

export const supabaseService = new SupabaseService();
