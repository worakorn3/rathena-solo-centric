## Database

- **Schema:** SQL files are located in `sql-files/`.
- **Data Tables:** `.yml` and `.txt` files in the `db/` directory.
- **SQL Immutability (Strict Mandate):** NEVER alter or modify upstream/base rAthena SQL scripts (e.g., `sql-files/main.sql`, `sql-files/logs.sql`, `sql-files/item_db*.sql`, `sql-files/mob_db*.sql`, `sql-files/roulette_default_data.sql`, `sql-files/upgrades/*`, `sql-files/tools/*`, etc.). Base rAthena scripts must remain unmodified to preserve upstream compatibility.
- **Custom SQL & Migration-Only Interaction:** You can interact with custom SQL scripts in a migration manner ONLY:
  - All custom tables, schema additions, column alterations, indexes, and custom seed data MUST reside in dedicated custom SQL scripts under `sql-files/custom/` (e.g., `sql-files/custom/solo_schema_migrations.sql`).
  - DDL and DML in custom scripts must be written in an idempotent migration pattern (e.g., `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `INSERT IGNORE`, or sequential migration files).
  - Never alter existing base schemas in place; manage all schema evolutions via custom migration scripts only.
- **No DDL in NPC Scripts:** Never bake DDL queries (`CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`) into NPC script `OnInit` blocks. Always manage schemas via standalone custom migration SQL files.
