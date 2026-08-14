const express = require("express");
const router = express.Router();
const db = require("../database");

function parseJson(value) {
    if (value === null || value === undefined || typeof value === "object") return value;
    try { return JSON.parse(value); } catch { return value; }
}

function serializeMatch(row) {
    return {
        id: row.id, date: row.date, season: row.season, format: row.format,
        teamA: row.teamA, teamB: row.teamB,
        teamAIds: parseJson(row.teamAIds), teamBIds: parseJson(row.teamBIds),
        stats: parseJson(row.stats), scoreA: row.scoreA, scoreB: row.scoreB,
        winner: row.winner, mvpId: row.mvpId, mvpTie: parseJson(row.mvpTie)
    };
}

router.get("/backup", async (req, res) => {
    try {
        const [[stateRows], [players], [matches]] = await Promise.all([
            db.query("SELECT data FROM app_state WHERE id = 1 LIMIT 1"),
            db.query("SELECT id, name, created_at FROM players ORDER BY name"),
            db.query("SELECT * FROM matches ORDER BY date DESC")
        ]);
        const state = stateRows.length ? parseJson(stateRows[0].data) : {};
        res.json({
            ...state,
            version: 2,
            exportedAt: new Date().toISOString(),
            players: players.map((p) => ({ id: p.id, name: p.name, createdAt: p.created_at })),
            matches: matches.map(serializeMatch)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post("/restore", async (req, res) => {
    const backup = req.body;
    if (!backup || !Array.isArray(backup.players) || !Array.isArray(backup.matches))
        return res.status(400).json({ error: "Arquivo de backup inválido." });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query("DELETE FROM matches");
        await connection.query("DELETE FROM players");

        for (const player of backup.players) {
            if (!player.id || typeof player.name !== "string" || !player.name.trim())
                throw new Error("O backup contém um jogador inválido.");
            await connection.query(
                "INSERT INTO players (id, name, created_at) VALUES (?, ?, ?)",
                [player.id, player.name.trim(), new Date(player.createdAt || player.created_at || Date.now())]
            );
        }

        for (const match of backup.matches) {
            if (!match.id || !match.date || !match.format ||
                !Array.isArray(match.teamAIds) || !Array.isArray(match.teamBIds) ||
                !match.stats || typeof match.stats !== "object")
                throw new Error("O backup contém uma partida inválida.");
            await connection.query(`
                INSERT INTO matches
                (id, date, season, format, teamA, teamB, teamAIds, teamBIds,
                 stats, scoreA, scoreB, winner, mvpId, mvpTie)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                match.id, new Date(match.date), match.season, match.format,
                match.teamA || "Time A", match.teamB || "Time B",
                JSON.stringify(match.teamAIds), JSON.stringify(match.teamBIds),
                JSON.stringify(match.stats), match.scoreA || 0, match.scoreB || 0,
                match.winner || "draw", match.mvpId || null,
                JSON.stringify(match.mvpTie || null)
            ]);
        }

        const { players, matches, version, exportedAt, ...state } = backup;
        await connection.query(`
            INSERT INTO app_state (id, data) VALUES (1, ?)
            ON DUPLICATE KEY UPDATE data = VALUES(data)
        `, [JSON.stringify(state)]);
        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

router.delete("/reset", async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query("DELETE FROM matches");
        await connection.query("DELETE FROM players");
        await connection.query("DELETE FROM app_state WHERE id = 1");
        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

router.get("/", async (req, res) => {

    try {

        const [rows] = await db.query(
            "SELECT data FROM app_state WHERE id = 1 LIMIT 1"
        );

        if (!rows.length)
            return res.json({});

        res.json(JSON.parse(rows[0].data));

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});

router.post("/", async (req, res) => {

    try {

        const json = JSON.stringify(req.body);

        await db.query(`
            INSERT INTO app_state(id,data)
            VALUES(1,?)
            ON DUPLICATE KEY UPDATE
            data = VALUES(data)
        `, [json]);

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});

module.exports = router;
