const isTest = process.env.NODE_ENV === "test";

function getRequiredEnv(key: string, testFallback?: string): string {
  const val = process.env[key];
  if (val !== undefined && val !== "") {
    return val;
  }
  if (isTest && testFallback !== undefined) {
    return testFallback;
  }
  throw new Error(`[Config Error] Missing required environment variable: ${key}`);
}

export const config = {
  // DB REPLICA MANDATE: Connects to MariaDB Read-Only Replica
  db: {
    host: getRequiredEnv("DB_HOST", "127.0.0.1"),
    port: parseInt(getRequiredEnv("DB_PORT", "3307"), 10),
    user: getRequiredEnv("DB_USER", "ro_user"),
    password: getRequiredEnv("DB_PASSWORD", "ro_password"),
    database: getRequiredEnv("DB_DATABASE", "ragnarok"),
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
  },
  // PRIMARY DB: Dedicated connection for write queries
  primaryDb: {
    host: getRequiredEnv("PRIMARY_DB_HOST", "127.0.0.1"),
    port: parseInt(getRequiredEnv("PRIMARY_DB_PORT", "3306"), 10),
    user: getRequiredEnv("PRIMARY_DB_USER", "ragnarok"),
    password: getRequiredEnv("PRIMARY_DB_PASSWORD", "ragnarok"),
    database: getRequiredEnv("PRIMARY_DB_DATABASE", "ragnarok"),
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
  },
  server: {
    port: parseInt(process.env.PORT || "4000", 10),
    jwtSecret: getRequiredEnv("JWT_SECRET", "test_jwt_secret_for_unit_tests_only"),
  }
};
