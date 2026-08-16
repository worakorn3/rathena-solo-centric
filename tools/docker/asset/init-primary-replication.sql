-- Replication and Read-Only Web Users Initialization
CREATE USER IF NOT EXISTS 'repl_user'@'%' IDENTIFIED BY 'repl_password';
GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'repl_user'@'%';

CREATE USER IF NOT EXISTS 'ro_user'@'%' IDENTIFIED BY 'ro_password';
GRANT SELECT, SHOW VIEW ON ragnarok.* TO 'ro_user'@'%';

FLUSH PRIVILEGES;
