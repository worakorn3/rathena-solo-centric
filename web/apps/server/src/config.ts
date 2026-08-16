export const config = {
  // DB REPLICA MANDATE: Defaults to port 3307 (MariaDB Read-Only Replica)
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseInt(process.env.DB_PORT || "3307", 10),
    user: process.env.DB_USER || "ro_user",
    password: process.env.DB_PASSWORD || "ro_password",
    database: process.env.DB_DATABASE || "ragnarok",
    fallbackUser: "ragnarok",
    fallbackPassword: "ragnarok",
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
  },
  server: {
    port: parseInt(process.env.PORT || "4000", 10),
    jwtSecret: process.env.JWT_SECRET || "rathena_solo_portal_secret_key_2026_super_secure",
  }
};
