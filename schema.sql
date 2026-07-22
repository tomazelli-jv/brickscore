CREATE DATABASE IF NOT EXISTS brickscore
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE brickscore;

CREATE TABLE app_state (
    id INT NOT NULL PRIMARY KEY,
    data LONGTEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO app_state (id, data)
VALUES (
    1,
    '{}'
)
ON DUPLICATE KEY UPDATE
data = data;