const express = require('express');
require('dotenv').config();
const { getPunishments, getTabSummary } = require('./functions');

module.exports = function startApi(client) {
    const app = express();
    const port = process.env.PORT || 5023;

    app.use(express.json());

    app.get('/bot/punishments/:username', async (req, res) => {
        const username = req.params.username;
        const punishments = await getPunishments(client, username);
        res.json(punishments);
    });

    app.listen(port, '0.0.0.0', () => {
        console.log(`🌐 API running at http://localhost:${port}`);
    });
};
