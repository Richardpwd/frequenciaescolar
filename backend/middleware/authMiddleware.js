// Middleware para proteger rotas
module.exports = function (req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Não autorizado' });
    }
};