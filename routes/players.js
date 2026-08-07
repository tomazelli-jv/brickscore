const express = require("express");
const router = express.Router();
const db = require("../database");

// Listar jogadores
router.get("/", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                id,
                name,
                created_at
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

// Cadastrar jogador
router.post("/", async (req, res) => {

    try {

        const { id, name, createdAt } = req.body;

        await db.query(`
            INSERT INTO players
            (
                id,
                name,
                created_at
            )
            VALUES
            (?, ?, ?)
        `, [
            id,
            name,
            createdAt
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

// Alterar jogador
router.put("/:id", async (req, res) => {

    try {

        await db.query(`
            UPDATE players
            SET
                name = ?
            WHERE id = ?
        `, [
            req.body.name,
            req.params.id
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

// Excluir jogador
router.delete("/:id", async (req, res) => {

    try {

        await db.query(`
            DELETE FROM players
            WHERE id = ?
        `, [
            req.params.id
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

module.exports = router;