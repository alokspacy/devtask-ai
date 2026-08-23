import { Pool, QueryResult, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = {
  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const res = await pool.query<T>(text, params);
      return res;
    } catch (err) {
      console.error('Database query error:', { text, error: (err as Error).message });
      throw err;
    }
  },

  async getClient() {
    return await pool.connect();
  },

  async checkHealth(): Promise<boolean> {
    try {
      const result = await pool.query('SELECT 1 as health');
      return result.rows[0]?.health === 1;
    } catch {
      return false;
    }
  },

  async initSchema(): Promise<void> {
    try {
      const initSqlPath = path.resolve(__dirname, '../../init.sql');
      if (fs.existsSync(initSqlPath)) {
        const sql = fs.readFileSync(initSqlPath, 'utf8');
        await pool.query(sql);
        console.log('Database schema initialized successfully from init.sql');
      }
    } catch (error) {
      console.warn('Warning initializing database schema:', (error as Error).message);
    }
  },

  async close(): Promise<void> {
    await pool.end();
  }
};
