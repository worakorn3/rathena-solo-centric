#!/bin/bash
set -eo pipefail

echo "======================================================"
echo "==> Starting MariaDB Replica Initializer"
echo "======================================================"

echo "==> [Replica Init] Waiting for Primary MariaDB (db:3306)..."
until mariadb-admin ping -h db -P 3306 -u root -pragnarok --silent; do
    echo "Primary DB not ready yet, sleeping 1s..."
    sleep 1
done
echo "==> [Replica Init] Primary MariaDB is reachable."

echo "==> [Replica Init] Ensuring replication credentials on Primary..."
mariadb -h db -P 3306 -u root -pragnarok <<-EOSQL
    CREATE USER IF NOT EXISTS 'repl_user'@'%' IDENTIFIED BY 'repl_password';
    GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'repl_user'@'%';
    CREATE USER IF NOT EXISTS 'ro_user'@'%' IDENTIFIED BY 'ro_password';
    GRANT SELECT, SHOW VIEW ON ragnarok.* TO 'ro_user'@'%';
    FLUSH PRIVILEGES;
EOSQL

if [ ! -f /var/lib/mysql/.replica_initialized ]; then
    echo "==> [Replica Init] First-time initialization starting..."

    if [ ! -d /var/lib/mysql/mysql ]; then
        echo "==> [Replica Init] Running mariadb-install-db..."
        mariadb-install-db --user=mysql --datadir=/var/lib/mysql > /dev/null 2>&1
    fi

    echo "==> [Replica Init] Starting temporary MariaDB instance for initial sync..."
    mariadbd --user=mysql --datadir=/var/lib/mysql --skip-networking --socket=/tmp/mysqld_temp.sock &
    TEMP_PID=$!

    until mariadb-admin --socket=/tmp/mysqld_temp.sock ping --silent; do
        sleep 1
    done

    echo "==> [Replica Init] Configuring local users on replica..."
    mariadb --socket=/tmp/mysqld_temp.sock -uroot <<-EOSQL
        SET @@SESSION.SQL_LOG_BIN=0;
        ALTER USER 'root'@'localhost' IDENTIFIED BY 'ragnarok';
        CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'ragnarok';
        GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
        CREATE USER IF NOT EXISTS 'ro_user'@'%' IDENTIFIED BY 'ro_password';
        GRANT SELECT, SHOW VIEW ON *.* TO 'ro_user'@'%';
        FLUSH PRIVILEGES;
EOSQL

    echo "==> [Replica Init] Syncing initial snapshot from Primary (ragnarok)..."
    mariadb-dump -h db -P 3306 -u root -pragnarok \
        --single-transaction \
        --quick \
        --master-data=1 \
        --gtid \
        --databases ragnarok \
        | mariadb --socket=/tmp/mysqld_temp.sock -uroot -pragnarok

    echo "==> [Replica Init] Configuring GTID slave replication..."
    mariadb --socket=/tmp/mysqld_temp.sock -uroot -pragnarok <<-EOSQL
        CHANGE MASTER TO
            MASTER_HOST='db',
            MASTER_PORT=3306,
            MASTER_USER='repl_user',
            MASTER_PASSWORD='repl_password',
            MASTER_USE_GTID=slave_pos,
            MASTER_CONNECT_RETRY=10;
        START SLAVE;
EOSQL

    echo "==> [Replica Init] Stopping temporary server..."
    mariadb-admin --socket=/tmp/mysqld_temp.sock -uroot -pragnarok shutdown
    wait $TEMP_PID

    touch /var/lib/mysql/.replica_initialized
    echo "==> [Replica Init] First-time initialization finished successfully."
fi

chown -R mysql:mysql /var/lib/mysql

(
    sleep 3
    mariadb -uroot -pragnarok -e "START SLAVE;" > /dev/null 2>&1 || true
) &

echo "==> [Replica Init] Launching MariaDB Replica daemon (read-only)..."
exec gosu mysql mariadbd --defaults-extra-file=/etc/mysql/conf.d/replica.cnf
