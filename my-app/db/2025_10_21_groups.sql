/* =========================
 * 0) Clean up (safe drops)
 * ========================= */
DROP TRIGGER IF EXISTS `trg_group_members_after_insert`;
DROP TRIGGER IF EXISTS `trg_group_members_after_delete`;
DROP TABLE   IF EXISTS `group_members`;
DROP TABLE   IF EXISTS `groups`;

/* =========================
 * 1) Tables
 * ========================= */
CREATE TABLE `groups` (
    `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`        INT UNSIGNED NOT NULL,
    `university_id`  INT UNSIGNED NOT NULL,
    `title`          VARCHAR(160) NOT NULL,
    `description`    TEXT,
    `pictures`       JSON NOT NULL DEFAULT (JSON_ARRAY()),
    `comments`       JSON NOT NULL DEFAULT (JSON_ARRAY()),
    `category`       VARCHAR(100) DEFAULT NULL,
    `location`       VARCHAR(255) DEFAULT NULL,
    `contact`        VARCHAR(255) DEFAULT NULL,
    `capacity`       INT UNSIGNED DEFAULT NULL,     -- NULL = no limit
    `member_count`   INT UNSIGNED NOT NULL DEFAULT 0,
    `views`          INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_university` (`university_id`),
    KEY `idx_user`       (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `group_members` (
    `group_id`  INT UNSIGNED NOT NULL,
    `user_id`   INT UNSIGNED NOT NULL,
    `joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`group_id`, `user_id`),
    KEY `idx_member_user`  (`user_id`),
    KEY `idx_member_group` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* =========================
 * 2) (Optional) Seed one demo group for testing
 * ========================= */
INSERT INTO `groups` (`user_id`,`university_id`,`title`,`capacity`)
VALUES (1001, 1, 'Demo Group', 2);
-- ↑ Change/remove as needed

/* ============================================================
 * 3) JOIN FLOW (manual transaction template; no triggers)
 *    Steps:
 *      - Set @gid (group id) and @uid (current user id)
 *      - START TRANSACTION
 *      - Lock the group row and read capacity/member_count
 *      - If full -> ROLLBACK
 *      - Else INSERT IGNORE into group_members
 *      - If inserted -> UPDATE groups.member_count + 1, COMMIT
 *      - If already a member (no insert) -> ROLLBACK
 * ============================================================ */

-- Choose which group/user to test with:
SET @gid = (SELECT `id` FROM `groups` WHERE `title`='Demo Group' LIMIT 1);
SET @uid = 2001;  -- current user id (change per test)

START TRANSACTION;

-- Lock the group row and read capacity/current count
SELECT `capacity`, `member_count` INTO @cap, @cnt
FROM `groups`
WHERE `id` = @gid
LIMIT 1FOR UPDATE;

-- Check capacity (do this by reading the result you just got):
-- If @cap IS NOT NULL AND @cnt >= @cap THEN:  (GROUP IS FULL)
--   ROLLBACK;
--   SELECT 'FULL' AS status, @cap AS capacity, @cnt AS current_count;
--   -- STOP HERE
-- ELSE continue:

-- Try to add membership (no duplicates)
INSERT IGNORE INTO `group_members`(`group_id`,`user_id`)
VALUES (@gid, @uid);

-- How many rows were inserted? (1=new, 0=already member)
SELECT ROW_COUNT() INTO @ins;

-- If @ins = 1 (new member), bump the counter and COMMIT:
UPDATE `groups`
SET `member_count` = `member_count` + 1
WHERE `id` = @gid
  AND @ins = 1;   -- guard to avoid accidental updates if no insert

COMMIT;

-- If @ins = 0 (already a member), you can ROLLBACK instead of COMMIT:
-- ROLLBACK;

/* ============================================================
 * 4) LEAVE FLOW (manual transaction template; no triggers)
 *    Steps:
 *      - Set @gid and @uid
 *      - START TRANSACTION
 *      - DELETE membership
 *      - If deleted -> decrement member_count (not below 0), COMMIT
 *      - If nothing deleted -> ROLLBACK
 * ============================================================ */

-- Choose which group/user to test leaving:
SET @gid = (SELECT `id` FROM `groups` WHERE `title`='Demo Group' LIMIT 1);
SET @uid = 2001;  -- same user as joined above

START TRANSACTION;

DELETE FROM `group_members`
WHERE `group_id` = @gid
  AND `user_id`  = @uid;

SELECT ROW_COUNT() INTO @del;

-- If @del = 1 (a row was deleted), decrement and COMMIT:
UPDATE `groups`
SET `member_count` = CASE WHEN `member_count` > 0 THEN `member_count` - 1 ELSE 0 END
WHERE `id` = @gid
  AND @del = 1;

COMMIT;

-- If @del = 0 (user was not a member), you can ROLLBACK instead of COMMIT:
-- ROLLBACK;

/* ============================================================
 * Notes:
 * - These JOIN/LEAVE blocks are meant to be run step-by-step.
 * - In your API code, implement the exact same sequence inside a transaction:
 *     SELECT ... FOR UPDATE -> capacity check -> INSERT IGNORE -> if inserted then UPDATE -> COMMIT
 * - Keep the `groups` row lock until you commit/rollback to prevent race conditions on the last slot.
 * - Capacity rule is enforced by your application logic (as shown above).
 * ============================================================ */
