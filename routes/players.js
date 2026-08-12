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
        const cleanName = typeof name === "string" ? name.trim() : "";
        if (!id || !cleanName)
            return res.status(400).json({ error: "Id e nome do jogador são obrigatórios." });

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
            cleanName,
            createdAt ? new Date(createdAt) : new Date()
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

        const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
        if (!name)
            return res.status(400).json({ error: "Nome do jogador é obrigatório." });

        const [result] = await db.query(`
            UPDATE players
            SET
                name = ?
            WHERE id = ?
        `, [
            name,
            req.params.id
        ]);

        if (!result.affectedRows)
            return res.status(404).json({ error: "Jogador não encontrado." });

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

        const [result] = await db.query(`
            DELETE FROM players
            WHERE id = ?
        `, [
            req.params.id
        ]);

        if (!result.affectedRows)
            return res.status(404).json({ error: "Jogador não encontrado." });

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
