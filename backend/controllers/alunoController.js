const db = require('../models/db');

exports.list = (req, res) => {
    db.all('SELECT alunos.id, alunos.nome, alunos.sala_id, salas.nome as sala_nome FROM alunos LEFT JOIN salas ON alunos.sala_id = salas.id', [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar alunos' });
        res.json(rows);
    });
};

exports.create = (req, res) => {
    const { nome, sala_id } = req.body;
    if (!nome || !sala_id) {
        return res.status(400).json({ error: 'Nome e sala são obrigatórios' });
    }
    db.run('INSERT INTO alunos (nome, sala_id) VALUES (?, ?)', [nome, sala_id], function(err) {
        if (err) return res.status(500).json({ error: 'Erro ao cadastrar aluno' });
        res.json({ success: true, id: this.lastID });
    });
};

exports.update = (req, res) => {
    const { nome, sala_id } = req.body;
    if (!nome || !sala_id) {
        return res.status(400).json({ error: 'Nome e sala são obrigatórios' });
    }
    db.run('UPDATE alunos SET nome = ?, sala_id = ? WHERE id = ?', [nome, sala_id, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'Erro ao atualizar aluno' });
        res.json({ success: true });
    });
};

exports.delete = (req, res) => {
    db.run('DELETE FROM alunos WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'Erro ao excluir aluno' });
        res.json({ success: true });
    });
};
