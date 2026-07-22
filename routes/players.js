const express = require("express");
const router = express.Router();
const db = require("../database");

// Listar jogadores
router.get("/", async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT
                id,
                name
            FROM players
            ORDER BY name
        `);

        res.json(rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }
});

// Criar jogador
router.post("/", async (req, res) => {

    try {

        const { name } = req.body;

        const [result] = await db.query(
            "INSERT INTO players(name) VALUES(?)",
            [name]
        );

        res.json({
            id: result.insertId,
            name
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});

// Atualizar jogador
router.put("/:id", async (req, res) => {

    try {

        const { id } = req.params;
        const { name } = req.body;

        await db.query(
            "UPDATE players SET name=? WHERE id=?",
            [name, id]
        );

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

// Excluir jogador
router.delete("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        await db.query(
            "DELETE FROM players WHERE id=?",
            [id]
        );

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

module.exports = router;