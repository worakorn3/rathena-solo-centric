import mysql, { Pool } from "mysql2/promise";
import { config } from "../config";

let pool: Pool | null = null;

export async function getDbPool(): Promise<Pool> {
  if (pool) return pool;

  try {
    const candidatePool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: config.db.waitForConnections,
      connectionLimit: config.db.connectionLimit,
      queueLimit: config.db.queueLimit,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    // Test connection
    await candidatePool.query("SELECT 1");
    console.log(`[DB Pool] Successfully connected to Read-Only Replica on ${config.db.host}:${config.db.port} as ${config.db.user}`);
    pool = candidatePool;
    return pool;
  } catch (err: any) {
    console.warn(`[DB Pool] Primary user (${config.db.user}) failed on replica: ${err.message}. Trying fallback user...`);
    
    // Attempt fallback with ragnarok credentials
    const fallbackPool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.fallbackUser,
      password: config.db.fallbackPassword,
      database: config.db.database,
      waitForConnections: config.db.waitForConnections,
      connectionLimit: config.db.connectionLimit,
      queueLimit: config.db.queueLimit,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    await fallbackPool.query("SELECT 1");
    console.log(`[DB Pool] Connected to Read-Only Replica on ${config.db.host}:${config.db.port} as ${config.db.fallbackUser}`);
    pool = fallbackPool;
    return pool;
  }
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const p = await getDbPool();
  const [rows] = await p.execute(sql, params);
  return rows as T[];
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function primaryQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return query<T>(sql, params);
}

export async function primaryQueryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  return queryOne<T>(sql, params);
}

export async function primaryExecute(sql: string, params: any[] = []): Promise<any> {
  const p = await getDbPool();
  const [result] = await p.execute(sql, params);
  return result;
}


