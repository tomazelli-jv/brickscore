const express = require("express");
const router = express.Router();
const db = require("../database");

// Listar partidas
router.get("/", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT *
            FROM matches
            ORDER BY date DESC
        `);

        function parseJson(value) {

    if (value === null || value === undefined)
        return null;

    if (typeof value === "object")
        return value;

    if (typeof value !== "string")
        return value;

    try {
        return JSON.parse(value);
    } catch {
        return value;
    }

}

rows.forEach(row => {

  row.teamAIds = parseJson(row.teamAIds);
  row.teamBIds = parseJson(row.teamBIds);
  row.stats    = parseJson(row.stats);
  row.mvpTie   = parseJson(row.mvpTie);

}); 

        res.json(rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});



// Nova partida
router.post("/", async (req, res) => {

    try {

        const m = req.body;

        if (!m.id || !m.date || !m.format || !m.teamA || !m.teamB ||
            !Array.isArray(m.teamAIds) || !Array.isArray(m.teamBIds) ||
            !m.stats || typeof m.stats !== "object")
            return res.status(400).json({ error: "Dados da partida incompletos ou inválidos." });

        const [result] = await db.query(`
            INSERT INTO matches
            (
                id,
                date,
                season,
                format,
                teamA,
                teamB,
                teamAIds,
                teamBIds,
                stats,
                scoreA,
                scoreB,
                winner,
                mvpId,
                mvpTie
            )
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `, [

            m.id,
            new Date(m.date),
            m.season,
            m.format,
            m.teamA,
            m.teamB,
            JSON.stringify(m.teamAIds),
            JSON.stringify(m.teamBIds),
            JSON.stringify(m.stats),
            m.scoreA,
            m.scoreB,
            m.winner,
            m.mvpId,
            JSON.stringify(m.mvpTie)

        ]);

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});

// Atualizar
router.put("/:id", async (req, res) => {

    try {

        const m = req.body;

        if (!m.format || !m.teamA || !m.teamB ||
            !Array.isArray(m.teamAIds) || !Array.isArray(m.teamBIds) ||
            !m.stats || typeof m.stats !== "object")
            return res.status(400).json({ error: "Dados da partida incompletos ou inválidos." });

        const [result] = await db.query(`
            UPDATE matches
            SET
                format=?,
                teamA=?,
                teamB=?,
                teamAIds=?,
                teamBIds=?,
                stats=?,
                scoreA=?,
                scoreB=?,
                winner=?,
                mvpId=?,
                mvpTie=?
            WHERE id=?
        `,[

            m.format,
            m.teamA,
            m.teamB,
            JSON.stringify(m.teamAIds),
            JSON.stringify(m.teamBIds),
            JSON.stringify(m.stats),
            m.scoreA,
            m.scoreB,
            m.winner,
            m.mvpId,
            JSON.stringify(m.mvpTie),
            req.params.id

        ]);

        if (!result.affectedRows)
            return res.status(404).json({ error: "Partida não encontrada." });

        res.json({
            success:true
        });

    } catch(err){

        console.error(err);

        res.status(500).json({
            error:err.message
        });

    }

});

// Excluir
router.delete("/:id", async(req,res)=>{

    try{

        const [result] = await db.query(
            "DELETE FROM matches WHERE id=?",
            [req.params.id]
        );

        if (!result.affectedRows)
            return res.status(404).json({ error: "Partida não encontrada." });

        res.json({
            success:true
        });

    }catch(err){

        console.error(err);

        res.status(500).json({
            error:err.message
        });

    }

});

module.exports = router;
