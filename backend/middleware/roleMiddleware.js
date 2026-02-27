// Middleware para checar perfil do usuário
module.exports = {
    isAdmin: function (req, res, next) {
        if (req.session && req.session.user && req.session.user.funcao === 'Admin') {
            next();
        } else {
            res.status(403).json({ error: 'Acesso restrito a administradores' });
        }
    },
    isProfessor: function (req, res, next) {
        if (req.session && req.session.user && (req.session.user.funcao === 'Professor' || req.session.user.funcao === 'Admin')) {
            next();
        } else {
            res.status(403).json({ error: 'Acesso restrito a professores' });
        }
    }
};