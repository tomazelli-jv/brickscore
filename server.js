require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

const dbRoutes = require("./routes/db");
app.use("/api/db", dbRoutes);

app.use(express.static(path.join(__dirname, "public")));

app.get("/api", (req, res) => {
    res.json({
        status: true,
        message: "BrickScore API Online"
    });
});

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});