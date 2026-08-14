const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

pool.initialize = async function initializeDatabase() {
    await pool.query(`CREATE TABLE IF NOT EXISTS app_state (
        id INT NOT NULL PRIMARY KEY,
        data LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

    await pool.query(`CREATE TABLE IF NOT EXISTS players (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        photo LONGTEXT NULL,
        created_at DATETIME NOT NULL,
        INDEX idx_players_name (name)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

    const [photoColumns] = await pool.query("SHOW COLUMNS FROM players LIKE 'photo'");
    if (!photoColumns.length)
        await pool.query("ALTER TABLE players ADD COLUMN photo LONGTEXT NULL AFTER name");

    await pool.query(`CREATE TABLE IF NOT EXISTS matches (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        date DATETIME NOT NULL,
        season INT NOT NULL,
        format VARCHAR(10) NOT NULL,
        teamA VARCHAR(120) NOT NULL,
        teamB VARCHAR(120) NOT NULL,
        teamAIds JSON NOT NULL,
        teamBIds JSON NOT NULL,
        stats JSON NOT NULL,
        scoreA INT NOT NULL DEFAULT 0,
        scoreB INT NOT NULL DEFAULT 0,
        winner VARCHAR(10) NOT NULL,
        mvpId VARCHAR(64) NULL,
        mvpTie JSON NULL,
        INDEX idx_matches_date (date),
        INDEX idx_matches_season (season)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
};

module.exports = pool;
