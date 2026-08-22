import mysql, { Pool } from "mysql2/promise";
import { config } from "../config";

let replicaPool: Pool | null = null;
let primaryPool: Pool | null = null;

export async function getDbPool(): Promise<Pool> {
  if (replicaPool) return replicaPool;

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
  replicaPool = candidatePool;
  return replicaPool;
}

export async function getPrimaryDbPool(): Promise<Pool> {
  if (primaryPool) return primaryPool;

  const candidatePool = mysql.createPool({
    host: config.primaryDb.host,
    port: config.primaryDb.port,
    user: config.primaryDb.user,
    password: config.primaryDb.password,
    database: config.primaryDb.database,
    waitForConnections: config.primaryDb.waitForConnections,
    connectionLimit: config.primaryDb.connectionLimit,
    queueLimit: config.primaryDb.queueLimit,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  // Test connection
  await candidatePool.query("SELECT 1");
  console.log(`[DB Primary Pool] Successfully connected to Primary DB on ${config.primaryDb.host}:${config.primaryDb.port} as ${config.primaryDb.user}`);
  primaryPool = candidatePool;
  return primaryPool;
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
  const p = await getPrimaryDbPool();
  const [rows] = await p.execute(sql, params);
  return rows as T[];
}

export async function primaryQueryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await primaryQuery<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function primaryExecute(sql: string, params: any[] = []): Promise<any> {
  const p = await getPrimaryDbPool();
  const [result] = await p.execute(sql, params);
  return result;
}
