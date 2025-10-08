DROP TABLE IF EXISTS listings;
CREATE TABLE listings (
                          id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
                          user_id       INT UNSIGNED NOT NULL,
                          university_id INT UNSIGNED NOT NULL,
                          title         VARCHAR(120) NOT NULL,
                          description   TEXT,
                          pictures      JSON        NOT NULL DEFAULT (JSON_ARRAY()),
                          comments      JSON        NOT NULL DEFAULT (JSON_ARRAY()),
                          views       INT UNSIGNED NOT NULL DEFAULT 0,
                          created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          PRIMARY KEY (id),
                          KEY idx_university (university_id),
                          KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
