# Database Replication & Read-Only Replica Architecture

## 1. Overview & Problem Statement
In MMORPG server architectures like rAthena, real-time map, char, and login servers continuously perform read and write transactions against the primary database (`ragnarok`).

When external applications—such as websites, control panels (FluxCP/Ceres), companion dashboards, player rankings, market analysis, or item search APIs—run heavy, analytical, or un-indexed queries on the game database, they can:
1. Trigger shared/exclusive row or table locks (e.g. MyISAM table locks).
2. Accumulate undo log overhead and buffer pool eviction.
3. Cause lag spikes, dropped packet processing, or delayed saving in the live game map server.

To eliminate this interference completely, a **Read-Only MariaDB Replica (`db-replica`)** is provisioned with asynchronous GTID (Global Transaction ID) replication from the primary game database.

```mermaid
flowchart TD
    subgraph Primary ["Game Cluster (Primary)"]
        GameMap["Map Server (:5121)"] -->|Read/Write| PrimaryDB[("MariaDB Primary (:3306)")]
        GameChar["Char Server (:6121)"] -->|Read/Write| PrimaryDB
        GameLogin["Login Server (:6900)"] -->|Read/Write| PrimaryDB
    end

    subgraph Replication ["Asynchronous GTID Stream"]
        PrimaryDB -->|Binlog Stream (ROW format)| ReplicaDB
    end

    subgraph Replica ["Web & Analytics Layer (Read-Only)"]
        ReplicaDB[("MariaDB Replica (:3307)<br/>read_only=ON")]
        WebSite["Website / FluxCP"] -->|SELECT Only| ReplicaDB
        Analytics["Dashboard / Companion"] -->|SELECT Only| ReplicaDB
        Rankings["Ladder & Rankings API"] -->|SELECT Only| ReplicaDB
    end
```

---

## 2. Infrastructure & Connection Details

### 2.1 Connection Summary

| Role | Container Name | Host Port | Docker Internal Port | Database | Default Users |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary (Read/Write)** | `rathena-db` | `3306` | `db:3306` | `ragnarok` | `root:ragnarok`<br/>`ragnarok:ragnarok`<br/>`repl_user:repl_password` |
| **Replica (Read-Only)** | `rathena-db-replica` | `3307` | `db-replica:3306` | `ragnarok` | `ro_user:ro_password`<br/>`root:ragnarok` (read-only) |

### 2.2 Dual-Layer Write Protection
The replica enforces two independent layers of write protection:
1. **Server-Level Enforcement (`read_only = ON`):** The replica engine rejects all data-modifying queries (`INSERT`, `UPDATE`, `DELETE`, `CREATE`, `DROP`, `ALTER`) from non-superusers.
2. **User-Level Privilege Enforcement (`ro_user`):** The dedicated web user is granted strictly `SELECT` and `SHOW VIEW` privileges on `ragnarok.*`.

---

## 3. Configuration Files & Automation

### 3.1 Primary Configuration (`tools/docker/asset/primary.cnf`)
```ini
[mariadb]
server-id = 1
log-bin = mysql-bin
binlog-format = ROW
gtid_domain_id = 0
binlog_do_db = ragnarok
expire_logs_days = 7
max_binlog_size = 100M
```

### 3.2 Replica Configuration (`tools/docker/asset/replica.cnf`)
```ini
[mariadb]
server-id = 2
log-bin = mysql-bin
binlog-format = ROW
gtid_domain_id = 0
replicate_do_db = ragnarok
read_only = ON
expire_logs_days = 7
max_binlog_size = 100M
```

### 3.3 Zero-Touch Provisioning (`tools/docker/asset/replica-entrypoint.sh`)
On container startup:
1. Checks connectivity to `db:3306`.
2. Proactively ensures `repl_user` and `ro_user` exist on Primary.
3. If `/var/lib/mysql/.replica_initialized` does not exist:
   - Initializes MariaDB system tables.
   - Takes a non-locking single-transaction GTID dump from Primary.
   - Imports dump into Replica.
   - Executes `CHANGE MASTER TO ... MASTER_USE_GTID=slave_pos; START SLAVE;`.
   - Writes the `.replica_initialized` marker file.
4. Starts the read-only MariaDB service.

---

## 4. Connecting Web Applications to the Replica

### 4.1 Node.js / TypeScript Example
```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_REPLICA_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_REPLICA_PORT || '3307'),
    user: 'ro_user',
    password: 'ro_password',
    database: 'ragnarok',
    waitForConnections: true,
    connectionLimit: 10
});

// Example: Fetch top 10 players for web rankings
async function getTopPlayers() {
    const [rows] = await pool.query(
        'SELECT name, class, base_level, job_level, zeny FROM `char` ORDER BY base_level DESC, job_level DESC LIMIT 10'
    );
    return rows;
}
```

### 4.2 PHP / PDO (FluxCP / Custom Web) Example
```php
<?php
try {
    $dsn = "mysql:host=127.0.0.1;port=3307;dbname=ragnarok;charset=utf8mb4";
    $pdo = new PDO($dsn, "ro_user", "ro_password", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    $stmt = $pdo->query("SELECT name, base_level, job_level FROM `char` ORDER BY base_level DESC LIMIT 5");
    $leaders = $stmt->fetchAll();
} catch (PDOException $e) {
    die("Database replica connection error: " . $e->getMessage());
}
?>
```

### 4.3 Python Example (SQLAlchemy / PyMySQL)
```python
import pymysql

conn = pymysql.connect(
    host='127.0.0.1',
    port=3307,
    user='ro_user',
    password='ro_password',
    database='ragnarok',
    cursorclass=pymysql.cursors.DictCursor
)

with conn.cursor() as cursor:
    cursor.execute("SELECT count(*) as active_chars FROM `char` WHERE online = 1")
    result = cursor.fetchone()
    print(result)
```

---

## 5. Operations & Health Monitoring

### 5.1 Check Replica Status via CLI
Run the following command inside Docker to inspect slave status:
```bash
docker compose -f tools/docker/docker-compose.yml exec db-replica mariadb -uroot -pragnarok -e "SHOW SLAVE STATUS\G"
```

**Key Metrics to Verify:**
- `Slave_IO_Running: Yes`
- `Slave_SQL_Running: Yes`
- `Seconds_Behind_Master: 0`
- `Using_Gtid: Slave_Pos`

### 5.2 Automated Verification Script
Run the built-in verification suite:
```powershell
node scratch/verify_replica.js
```

### 5.3 Manual Re-Sync (Disaster Recovery)
If the replica volume ever becomes corrupted or falls out of sync:
```powershell
# 1. Stop the replica container
docker compose -f tools/docker/docker-compose.yml stop db-replica

# 2. Remove the replica volume
docker volume rm rathena-solo-centric_rathenadb_replica

# 3. Start the replica container (zero-touch initialization will re-clone)
docker compose -f tools/docker/docker-compose.yml up -d db-replica
```
