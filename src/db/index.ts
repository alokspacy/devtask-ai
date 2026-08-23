import { Pool, QueryResult, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config';

let pool: Pool;
let memAdapter: any = null;

if (process.env.NODE_ENV === 'test') {
  try {
    const { newDb, DataType } = require('pg-mem');
    const memDb = newDb({
      autoCreateForeignKeyIndices: true,
    });

    memDb.public.registerFunction({
      name: 'gen_random_uuid',
      returns: DataType.text,
      implementation: () => crypto.randomUUID(),
    });

    memDb.registerExtension('pgcrypto', (schema: any) => {
      schema.registerFunction({
        name: 'gen_random_uuid',
        returns: DataType.text,
        implementation: () => crypto.randomUUID(),
      });
    });

    const pg = memDb.adapters.createPg();
    pool = new pg.Pool();
    memAdapter = memDb;
  } catch (e) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      connectionTimeoutMillis: 2000,
    });
  }
} else {
  pool = new Pool({
    connectionString: config.databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

export { pool };

export const db = {
  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    try {
      const res = await pool.query<T>(text, params);
      return res;
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Database query error:', { text, error: (err as Error).message });
      }
      throw err;
    }
  },

  async getClient() {
    return await pool.connect();
  },

  async checkHealth(): Promise<boolean> {
    try {
      const result = await pool.query('SELECT 1 as health');
      return result.rows[0]?.health === 1 || result.rows[0]?.health === '1';
    } catch {
      return false;
    }
  },

  async initSchema(): Promise<void> {
    try {
      const schemaSql = `
        CREATE TABLE IF NOT EXISTS users_metadata (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            supabase_user_id TEXT UNIQUE NOT NULL,
            email TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            priority VARCHAR(50) DEFAULT 'medium',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ai_plans (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
            user_id TEXT NOT NULL,
            task_input TEXT NOT NULL,
            goal TEXT NOT NULL,
            prerequisites JSONB NOT NULL DEFAULT '[]',
            steps JSONB NOT NULL DEFAULT '[]',
            files_or_areas_to_modify JSONB NOT NULL DEFAULT '[]',
            testing_checklist JSONB NOT NULL DEFAULT '[]',
            risks JSONB NOT NULL DEFAULT '[]',
            model_name VARCHAR(100),
            prompt_tokens INT,
            output_tokens INT,
            total_tokens INT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS reports (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'queued',
            file_path TEXT,
            file_name TEXT,
            error_message TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            completed_at TIMESTAMPTZ
        );
      `;
      await pool.query(schemaSql);
      if (process.env.NODE_ENV !== 'test') {
        console.log('Database schema initialized successfully');
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('Warning initializing database schema:', (error as Error).message);
      }
    }
  },

  async close(): Promise<void> {
    await pool.end();
  }
};
