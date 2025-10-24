DROP TABLE IF EXISTS reports;
CREATE TABLE reports (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id      INT UNSIGNED NULL,
    page_name    VARCHAR(120),
    url          TEXT,
    category     VARCHAR(60),
    description  TEXT,
    steps        TEXT,
    contact      VARCHAR(120),
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
