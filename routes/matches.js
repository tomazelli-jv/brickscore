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

        console.log("BODY:");// TESTE 07-08-2026
        console.log(JSON.stringify(m, null, 2));// TESTE 07-08-2026

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
            m.date,
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

        console.log("RESULT:");// TESTE 07-08-2026
        console.log(result);// TESTE 07-08-2026

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

        await db.query(`
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

        await db.query(
            "DELETE FROM matches WHERE id=?",
            [req.params.id]
        );

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