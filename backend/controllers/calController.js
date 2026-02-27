const db = require('../models/db');

exports.list = (req, res) => {
    db.all('SELECT * FROM calendario', [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar calendário' });
        res.json(rows);
    });
};

exports.create = (req, res) => {
    const { data, tipo } = req.body;
    db.run('INSERT INTO calendario (data, tipo) VALUES (?, ?)', [data, tipo], function(err) {
        if (err) return res.status(500).json({ error: 'Erro ao adicionar evento' });
        res.json({ success: true, id: this.lastID });
    });
};
