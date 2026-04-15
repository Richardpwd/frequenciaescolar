import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import process from 'node:process';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, testConnection } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import salasRoutes from './routes/salas.routes.js';
import frequenciaRoutes from './routes/frequencia.routes.js';
import responsaveisRoutes from './routes/responsaveis.routes.js';
import { authenticateToken } from './middlewares/auth.middleware.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  console.error('Missing JWT secrets. Configure JWT_SECRET and JWT_REFRESH_SECRET in .env.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('trust proxy', 1);

const allowedOrigins = [FRONTEND_ORIGIN];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy does not allow this origin.'));
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
};

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas requisições. Tente novamente mais tarde.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas tentativas de autenticação. Tente novamente mais tarde.' },
});

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/api', generalLimiter);

app.get('/favicon.ico', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/favicon.ico'));
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/salas', authenticateToken, salasRoutes);
app.use('/api/frequencia', authenticateToken, frequenciaRoutes);
app.use('/api/responsaveis', authenticateToken, responsaveisRoutes);

app.get('/api', (_req, res) => {
  res.json({
    name: 'API Sistema de Frequencia Avance',
    version: '1.0.0',
    docs: '/api/docs',
    endpoints: {
      auth: ['/api/auth/register', '/api/auth/login', '/api/auth/forgot-password', '/api/auth/logout'],
      salas: ['/api/salas', '/api/salas/:salaId', '/api/salas/:salaId/alunos', '/api/salas/:salaId/alunos (POST)'],
      frequencia: [
        '/api/frequencia',
        '/api/frequencia/sala/:salaId/data/:data',
        '/api/frequencia/sala/:salaId/historico?inicio=YYYY-MM-DD&fim=YYYY-MM-DD',
      ],
      responsaveis: ['/api/responsaveis', '/api/responsaveis/alunos', '/api/responsaveis/aluno/:alunoId'],
    },
  });
});

app.get('/api/docs', (_req, res) => {
  res.json({
    title: 'Documentacao API Frequencia Avance',
    baseUrl: '/api',
    auth: {
      type: 'Bearer Token (JWT)',
      header: 'Authorization: Bearer <token>',
      refreshFlow: 'Use /api/auth/refresh com refreshToken para obter novo token.',
    },
    conventions: {
      listDefault: 'Rotas de listagem retornam array por padrao para compatibilidade.',
      listMetaMode: 'Use includeMeta=true para receber { items, meta }.',
      pagination: 'Use page e limit (maximo 100) para paginacao.',
      dateFormat: 'Datas devem usar formato YYYY-MM-DD.',
    },
    routes: [
      {
        method: 'POST',
        path: '/api/auth/register',
        body: { nome: 'string', usuario: 'string', senha: 'string' },
      },
      {
        method: 'POST',
        path: '/api/auth/login',
        body: { usuario: 'string', senha: 'string' },
      },
      {
        method: 'POST',
        path: '/api/auth/refresh',
        body: { refreshToken: 'string' },
      },
      {
        method: 'POST',
        path: '/api/auth/logout',
        body: { refreshToken: 'string' },
      },
      {
        method: 'GET',
        path: '/api/salas?search=&turno=&page=&limit=&includeMeta=true',
      },
      {
        method: 'POST',
        path: '/api/salas',
        body: { nome: 'string', turno: 'string' },
      },
      {
        method: 'GET',
        path: '/api/salas/:salaId',
      },
      {
        method: 'GET',
        path: '/api/salas/:salaId/alunos?search=&page=&limit=&includeMeta=true',
      },
      {
        method: 'POST',
        path: '/api/salas/:salaId/alunos',
        body: {
          nome: 'string',
          responsaveis: [
            {
              nome: 'string',
              email: 'string',
              telefone: 'string',
            },
          ],
        },
      },
      {
        method: 'GET',
        path: '/api/responsaveis/alunos?salaId=&search=&page=&limit=&includeMeta=true',
      },
      {
        method: 'GET',
        path: '/api/responsaveis/aluno/:alunoId',
      },
      {
        method: 'POST',
        path: '/api/responsaveis',
        body: {
          nomeResponsavel: 'string',
          email: 'string',
          nomeAluno: 'string',
          telefone: 'string',
        },
      },
      {
        method: 'GET',
        path: '/api/frequencia',
        query: 'mes=YYYY-MM&inicio=YYYY-MM-DD&fim=YYYY-MM-DD',
      },
      {
        method: 'POST',
        path: '/api/frequencia',
        body: {
          salaId: 'number',
          data: 'YYYY-MM-DD',
          registros: [{ alunoId: 'number', status: 'presente|falta' }],
        },
      },
      {
        method: 'GET',
        path: '/api/frequencia/sala/:salaId/data/:data',
      },
      {
        method: 'GET',
        path: '/api/frequencia/sala/:salaId/historico?inicio=YYYY-MM-DD&fim=YYYY-MM-DD',
      },
    ],
  });
});

app.get('/health', async (_req, res) => {
  try {
    await testConnection();
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected', detail: err.message });
  }
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.use('/api/*splat', (_req, res) => {
  res.status(404).json({ message: 'Endpoint nao encontrado.' });
});

// handler de erros globais — deve vir após todas as rotas
// captura exceções não tratadas e garante resposta JSON (evita HTML padrão do Express)
app.use((err, _req, res, next) => {
  void next;
  const status = err.status || err.statusCode || 500;
  if (!res.headersSent) {
    res.status(status).json({ message: err.message || 'Erro interno no servidor.' });
  }
});

async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`Servidor Avance ativo em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Falha ao inicializar banco de dados:', error.message);
    process.exit(1);
  }
}

startServer();
