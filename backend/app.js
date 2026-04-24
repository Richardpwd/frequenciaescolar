// Backend principal para Avance - Apoio Escolar
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const session = require('express-session');
const path = require('path');
const SQLiteStore = require('connect-sqlite3')(session);
const cors = require('cors');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && !process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET deve estar definido em produção.');
}

const sessionSecret = process.env.SESSION_SECRET || 'dev-only-insecure-session-secret';

function createApp() {
    const app = express();

    app.use(compression());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(helmet());

    // CORS para permitir frontend em outro domínio
    app.use(cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true
    }));

    // Middleware de sessão melhorado
    app.use(session({
        store: new SQLiteStore({ db: 'sessions.sqlite' }),
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 dia
        }
    }));

    // Rotas
    const userRoutes = require('./routes/userRoutes');
    const salaRoutes = require('./routes/salaRoutes');
    const alunoRoutes = require('./routes/alunoRoutes');
    const freqRoutes = require('./routes/freqRoutes');
    const calRoutes = require('./routes/calRoutes');

    app.use('/api/users', userRoutes);
    app.use('/api/salas', salaRoutes);
    app.use('/api/alunos', alunoRoutes);
    app.use('/api/frequencia', freqRoutes);
    app.use('/api/calendario', calRoutes);

    // 404 da API vem antes do fallback de frontend para evitar conflitos.
    app.use('/api', (_req, res) => {
        res.status(404).json({ message: 'Endpoint nao encontrado.' });
    });

    // Servir arquivos estáticos da pasta public (imagens, logos, etc.)
    // Assets binários raramente mudam → cache de 7 dias com revalidação via ETag.
    app.use(express.static(path.join(__dirname, '../public'), {
        maxAge: isProduction ? '7d' : 0,
        etag: true,
        lastModified: true,
    }));

    // Servir frontend (HTML/JS/CSS sem hashes nos nomes de arquivo).
    // no-cache força revalidação a cada requisição; ETag/Last-Modified permitem
    // respostas 304 (sem corpo) quando o conteúdo não mudou, poupando banda.
    app.use(express.static(path.join(__dirname, '../frontend'), {
        maxAge: 0,
        etag: true,
        lastModified: true,
        setHeaders(res, filePath) {
            if (filePath.endsWith('.html')) {
                // HTML nunca deve ser cacheado sem revalidação.
                res.setHeader('Cache-Control', 'no-store');
            } else {
                // JS/CSS: revalida sempre, mas usa 304 quando possível.
                res.setHeader('Cache-Control', 'no-cache');
            }
        },
    }));

    // Fallback somente para rotas de frontend (não-API).
    app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/views/login.html'));
    });

    // Erro global centralizado.
    app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = status >= 500
            ? 'Erro interno no servidor.'
            : (err.message || 'Erro na requisicao.');

        if (!res.headersSent) {
            res.status(status).json({ message });
        }
    });

    return app;
}

function startServer(port = process.env.PORT || 3000) {
    const app = createApp();
    return app.listen(port, () => {
        console.log(`Servidor rodando na porta ${port}`);
    });
}

if (require.main === module) {
    startServer();
}

module.exports = {
    createApp,
    startServer,
};