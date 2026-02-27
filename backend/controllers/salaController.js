const db = require('../models/db');

exports.list = (req, res) => {
    db.all('SELECT * FROM salas', [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar salas' });
        res.json(rows);
    });
};

exports.create = (req, res) => {
    const { nome } = req.body;
    db.run('INSERT INTO salas (nome) VALUES (?)', [nome], function(err) {
        if (err) return res.status(500).json({ error: 'Erro ao criar sala' });
        res.json({ success: true, id: this.lastID });
    });
};
