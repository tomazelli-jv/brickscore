const express = require("express");
const router = express.Router();
const db = require("../database");

function validPhoto(photo) {
    return photo === null || photo === undefined ||
        (typeof photo === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(photo) && photo.length <= 1500000);
}

// Listar jogadores
router.get("/", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                id,
                name,
                photo,
                created_at AS createdAt
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

        const { id, name, photo, createdAt } = req.body;
        const cleanName = typeof name === "string" ? name.trim() : "";
        if (!validPhoto(photo))
            return res.status(400).json({ error: "Foto inválida ou muito grande." });
        if (!id || !cleanName)
            return res.status(400).json({ error: "Id e nome do jogador são obrigatórios." });

        await db.query(`
            INSERT INTO players
            (
                id,
                name,
                photo,
                created_at
            )
            VALUES
            (?, ?, ?, ?)
        `, [
            id,
            cleanName,
            photo || null,
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
        if (!validPhoto(req.body.photo))
            return res.status(400).json({ error: "Foto inválida ou muito grande." });
        if (!name)
            return res.status(400).json({ error: "Nome do jogador é obrigatório." });

        const [result] = await db.query(`
            UPDATE players
            SET
                name = ?,
                photo = ?
            WHERE id = ?
        `, [
            name,
            req.body.photo || null,
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
