// Backend principal para Avance - Apoio Escolar
const express = require('express');
const session = require('express-session');
const path = require('path');
const SQLiteStore = require('connect-sqlite3')(session);
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
require('dotenv').config();
const sessionSecret = process.env.SESSION_SECRET || 'troque_esse_segredo';
app.use(session({
    store: new SQLiteStore({ db: 'sessions.sqlite' }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false
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


// Servir arquivos estáticos da pasta public (logo, etc)
app.use(express.static(path.join(__dirname, '../public')));
// Servir frontend
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/login.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});