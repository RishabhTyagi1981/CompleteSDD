const express = require('express');
const router = express.Router();

router.post('/api/v1/payments/charge', (req, res) => {
    const { amount, currency, token } = req.body;
    if (!amount || !currency || !token) {
        return res.status(400).json({ error: "Missing required payment fields" });
    }
    // Mock successful processing
    return res.status(200).json({ success: true, transactionId: "ch_" + Math.random().toString(36).substr(2, 9) });
});

module.exports = router;