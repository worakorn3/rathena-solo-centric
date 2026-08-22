## 2026-08-22T08:18:57Z

<USER_REQUEST>
You are Reviewer 1 for Milestone 1 (Backend Data Model & Dispatch API).
Your working directory is: e:\Games\Ragnarok\rathena-solo-centric\.agents\reviewer_m1_1

Read:
- e:\Games\Ragnarok\rathena-solo-centric\.agents\ORIGINAL_REQUEST.md
- e:\Games\Ragnarok\rathena-solo-centric\PROJECT.md
- e:\Games\Ragnarok\rathena-solo-centric\TEST_READY.md

Task:
1. Objectively and adversarially review the code changes made in `web/server/src` and `web/src/types/character.ts`.
2. Verify:
   - Read queries use Replica DB (port 3307).
   - Write queries in `POST /api/character/:charId/dispatch` use Primary DB (port 3306).
   - All SQL table and column names use backtick escaping (e.g. `char`, `char_reg_num_db`, `key`, `val`, `char_id`).
   - `dispatchStart: number | null` is properly typed and mapped.
   - Validation checks for `online === 0` and active dispatch conflict prevention work accurately.
3. Run `bun run build` and `bun test` in `web/`.
4. Update `progress.md`, write your review to `e:\Games\Ragnarok\rathena-solo-centric\.agents\reviewer_m1_1\handoff.md` including your explicit verdict (APPROVE or REQUEST_CHANGES), and send a message to parent.
</USER_REQUEST>
