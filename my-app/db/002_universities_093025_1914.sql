-- Create lookup table
CREATE TABLE IF NOT EXISTS universities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add FK column to users (watch your MySQL/MariaDB version)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS university_id INT NULL;

-- Add the foreign key (skip if it already exists on your server)
ALTER TABLE users
  ADD CONSTRAINT fk_users_university
    FOREIGN KEY (university_id)
    REFERENCES universities(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;
