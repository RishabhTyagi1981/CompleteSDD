const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const app = express();
const paymentRouter = require('./payment');
app.use(paymentRouter);
app.use(express.json());
const JWT_SECRET = process.env.JWT_SECRET || 'sdd_poc_secure_production_secret_key_2026';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/api/v1/auth/health', async (req, res) => {
    try { await pool.query('SELECT 1'); return res.status(200).json({ status: "UP", database: "CONNECTED" }); }
    catch (e) { return res.status(503).json({ status: "DOWN", error: "Database offline" }); }
});

app.post('/api/v1/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password are required" });
    try {
        const result = await pool.query('SELECT id, username, password_hash, role FROM users WHERE username = \$1', [username]);
        if (result.rows.length === 0 || password !== result.rows[0].password_hash) {
            return res.status(401).json({ error: "Invalid username or password" });
        }
        const token = jwt.sign({ user: result.rows[0].username, role: result.rows[0].role }, JWT_SECRET, { expiresIn: '1h' });
        return res.status(200).json({ token });
    } catch (error) { return res.status(500).json({ error: "Server authentication error" }); }
});

if (require.main === module) {
    app.listen(process.env.PORT || 3000, () => console.log(`🚀 API active on port ${process.env.PORT || 3000}`));
}
module.exports = app;
