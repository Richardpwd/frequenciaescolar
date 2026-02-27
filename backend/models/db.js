// Configuração do banco de dados SQLite
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./avance.db');

// Criação das tabelas
const createTables = () => {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            usuario TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            funcao TEXT NOT NULL DEFAULT 'Professor'
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS salas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS alunos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            sala_id INTEGER,
            FOREIGN KEY (sala_id) REFERENCES salas(id)
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS frequencia (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            aluno_id INTEGER,
            data TEXT,
            status TEXT,
            FOREIGN KEY (aluno_id) REFERENCES alunos(id)
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS calendario (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT,
            tipo TEXT
        )`);
    });
};

createTables();

module.exports = db;
