const db = require('../models/db');

exports.getBySala = (req, res) => {
    const sala_id = req.params.sala_id;
    db.all('SELECT alunos.id, alunos.nome, (SELECT status FROM frequencia WHERE aluno_id = alunos.id AND data = date("now")) as status FROM alunos WHERE sala_id = ?', [sala_id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar frequência' });
        res.json(rows);
    });
};

exports.marcar = (req, res) => {
    const { aluno_id, status, data } = req.body;
    if (!aluno_id || !status || !data) {
        return res.status(400).json({ error: 'Aluno, status e data são obrigatórios' });
    }
    db.run('INSERT INTO frequencia (aluno_id, data, status) VALUES (?, ?, ?)', [aluno_id, data, status], function(err) {
        if (err) return res.status(500).json({ error: 'Erro ao marcar frequência' });
        res.json({ success: true });
    });
};
