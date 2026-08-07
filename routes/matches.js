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

        rows.forEach(row => {

            row.teamAIds = JSON.parse(row.teamAIds);
            row.teamBIds = JSON.parse(row.teamBIds);
            row.stats = JSON.parse(row.stats);

            if (row.mvpTie)
                row.mvpTie = JSON.parse(row.mvpTie);

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

        await db.query(`
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
            VALUES
            (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
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