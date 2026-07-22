const express = require("express");
const router = express.Router();
const db = require("../database");

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