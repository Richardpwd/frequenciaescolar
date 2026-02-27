const db = require('../models/db');
const bcrypt = require('bcrypt');

exports.login = (req, res) => {
    const { usuario, senha } = req.body;
    db.get('SELECT * FROM users WHERE usuario = ?', [usuario], (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
        bcrypt.compare(senha, user.senha, (err, result) => {
            if (result) {
                req.session.user = { id: user.id, nome: user.nome, funcao: user.funcao };
                res.json({ success: true });
            } else {
                res.status(401).json({ error: 'Usuário ou senha inválidos' });
            }
        });
    });
};

exports.register = (req, res) => {
    const { nome, usuario, senha, funcao } = req.body;
    if (!nome || !usuario || !senha) {
        return res.status(400).json({ error: 'Nome, usuário e senha são obrigatórios' });
    }
    const perfil = funcao || 'Professor';
    bcrypt.hash(senha, 10, (err, hash) => {
        db.run('INSERT INTO users (nome, usuario, senha, funcao) VALUES (?, ?, ?, ?)', [nome, usuario, hash, perfil], function(err) {
            if (err) return res.status(400).json({ error: 'Usuário já existe' });
            res.json({ success: true });
        });
    });
};

exports.forgotPassword = (req, res) => {
    // Simulação de recuperação de senha
    res.json({ success: true, message: 'Recuperação de senha enviada para o e-mail cadastrado (simulado).' });
};

exports.list = (req, res) => {
    db.all('SELECT id, nome, usuario, funcao FROM users', [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar usuários' });
        res.json(rows);
    });
};

exports.delete = (req, res) => {
    db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'Erro ao excluir usuário' });
        res.json({ success: true });
    });
};
