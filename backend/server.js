import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'node:http';
import { createRequire } from 'node:module';
import process from 'node:process';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import { dbMode, initializeDatabase, testConnection } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import salasRoutes from './routes/salas.routes.js';
import frequenciaRoutes from './routes/frequencia.routes.js';
import responsaveisRoutes from './routes/responsaveis.routes.js';
import calendarioRoutes from './routes/calendario.routes.js';
import { applyApiResponseEnvelope } from './middlewares/api-response.middleware.js';
import { authenticateToken } from './middlewares/auth.middleware.js';
import { attachRealtime } from './realtime.js';

const PORT = Number(process.env.PORT || 3000);
const API_BASE_PATH = '/api';
const API_VERSION = 'v1';
const API_V1_BASE_PATH = `${API_BASE_PATH}/${API_VERSION}`;
const ENABLE_LEGACY_API = process.env.ENABLE_LEGACY_API !== 'false';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const isProduction = process.env.NODE_ENV === 'production';

const require = createRequire(import.meta.url);
const openApiSpec = require('./docs/openapi.json');

function isLocalDevelopmentOrigin(origin = '') {
  try {
    const { protocol, hostname } = new URL(origin);
    const normalized = String(hostname || '').toLowerCase();

    if (!/^https?:$/i.test(protocol)) {
      return false;
    }

    return /^(localhost|0\.0\.0\.0)$/i.test(normalized)
      || /^127(?:\.\d{1,3}){3}$/.test(normalized)
      || /^192\.168(?:\.\d{1,3}){2}$/.test(normalized)
      || /^10(?:\.\d{1,3}){3}$/.test(normalized)
      || /^172\.(1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}$/.test(normalized)
      || normalized.endsWith('.local')
      || (!normalized.includes('.') && /^[a-z0-9-]+$/i.test(normalized));
  } catch {
    return false;
  }
}

function validateSecret(secretName, secretValue) {
  if (!secretValue) {
    console.error(`Missing ${secretName}. Configure it in .env before starting the server.`);
    process.exit(1);
  }

  const looksLikePlaceholder = /(troque-esta-chave|gere-uma-chave|change-me)/i.test(secretValue);

  if (isProduction && (secretValue.length < 32 || looksLikePlaceholder)) {
    console.error(`${secretName} must be random, unique and have at least 32 characters in production.`);
    process.exit(1);
  }

  if (!isProduction && (secretValue.length < 24 || looksLikePlaceholder)) {
    console.warn(`[Security] ${secretName} is using a weak or placeholder value. Replace it before publishing.`);
  }
}

function buildRateLimitHandler(defaultMessage) {
  return (req, res, _next, options) => {
    const retryAfterSeconds = Number.isFinite(options.windowMs)
      ? Math.ceil(options.windowMs / 1000)
      : null;

    return res.status(options.statusCode).json({
      message: defaultMessage,
      errors: [{
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds,
        path: req.originalUrl,
      }],
    });
  };
}

validateSecret('JWT_SECRET', JWT_SECRET);
validateSecret('JWT_REFRESH_SECRET', JWT_REFRESH_SECRET);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function configureApp(app) {
app.disable('x-powered-by');
app.set('trust proxy', 1);

const allowedOrigins = new Set(
  String(FRONTEND_ORIGIN || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
);
const allowedOriginPatterns = [/^https:\/\/[a-z0-9-]+\.vercel\.app$/i];
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('null');
  allowedOrigins.add('http://localhost:3000');
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://127.0.0.1:3000');
  allowedOrigins.add('http://127.0.0.1:5173');

  allowedOriginPatterns.push(
    /^https?:\/\/localhost(?::\d+)?$/i,
    /^https?:\/\/127\.0\.0\.1(?::\d+)?$/i,
    /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(?::\d+)?$/i,
    /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?$/i,
    /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(?::\d+)?$/i,
  );
}
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin
      || allowedOrigins.has(origin)
      || allowedOriginPatterns.some((pattern) => pattern.test(origin))
      || (!isProduction && isLocalDevelopmentOrigin(origin))) {
      return callback(null, true);
    }
    const error = new Error('CORS policy does not allow this origin.');
    error.status = 403;
    return callback(error);
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
  handler: buildRateLimitHandler('Muitas requisicoes. Tente novamente mais tarde.'),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildRateLimitHandler('Muitas tentativas de autenticacao. Tente novamente mais tarde.'),
});

const staticOptions = {
  dotfiles: 'ignore',
  etag: true,
  fallthrough: true,
  index: false,
  maxAge: isProduction ? '1d' : 0,
};

const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: isProduction ? ["'self'"] : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", 'data:'],
  fontSrc: ["'self'", 'data:'],
  connectSrc: isProduction
    ? ["'self'", 'wss:']
    : ["'self'", 'http://localhost:5173', 'http://127.0.0.1:5173', 'ws://localhost:5173', 'ws://127.0.0.1:5173', 'ws:', 'wss:'],
  objectSrc: ["'none'"],
  frameAncestors: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
};

if (isProduction) {
  cspDirectives.upgradeInsecureRequests = [];
}

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: { directives: cspDirectives },
  referrerPolicy: { policy: 'no-referrer' },
  hsts: isProduction
    ? { maxAge: 15552000, includeSubDomains: true, preload: true }
    : false,
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(express.static(path.join(__dirname, '../public'), staticOptions));
app.use(express.static(path.join(__dirname, '../frontend'), staticOptions));
app.use(API_BASE_PATH, generalLimiter);
app.use(API_BASE_PATH, (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) {
    return res.status(415).json({ message: 'Envie os dados da API em JSON.' });
  }

  res.set('Cache-Control', 'no-store, max-age=0');
  return next();
});

app.use(async (req, res, next) => {
  if (!(req.path === '/health' || req.path.startsWith('/api'))) {
    return next();
  }

  try {
    await ensureDatabaseReady();
    return next();
  } catch (error) {
    console.error('Falha ao preparar banco de dados:', error.message);
    return res.status(503).json({ message: 'Banco de dados indisponivel no momento.' });
  }
});

app.get('/favicon.ico', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/favicon.ico'));
});

const publicApiRoutes = [
  { path: '/auth', handlers: [authLimiter, authRoutes] },
];

const protectedApiRoutes = [
  { path: '/salas', router: salasRoutes },
  { path: '/frequencia', router: frequenciaRoutes },
  { path: '/responsaveis', router: responsaveisRoutes },
  { path: '/calendario', router: calendarioRoutes },
];

for (const { path: routePath, handlers } of publicApiRoutes) {
  if (ENABLE_LEGACY_API) {
    app.use(`${API_BASE_PATH}${routePath}`, ...handlers);
  }

  app.use(`${API_V1_BASE_PATH}${routePath}`, applyApiResponseEnvelope, ...handlers);
}

for (const { path: routePath, router } of protectedApiRoutes) {
  if (ENABLE_LEGACY_API) {
    app.use(`${API_BASE_PATH}${routePath}`, authenticateToken, router);
  }

  app.use(`${API_V1_BASE_PATH}${routePath}`, applyApiResponseEnvelope, authenticateToken, router);
}

app.use(
  `${API_V1_BASE_PATH}/docs`,
  applyApiResponseEnvelope,
  (req, res, next) => {
    res.locals.skipApiEnvelope = true;
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    explorer: true,
    customSiteTitle: 'API Frequencia Avance - OpenAPI',
  }),
);

if (ENABLE_LEGACY_API) {
  app.use(
    `${API_BASE_PATH}/docs`,
    (req, res, next) => {
      res.locals.skipApiEnvelope = true;
      next();
    },
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      explorer: true,
      customSiteTitle: 'API Frequencia Avance - OpenAPI',
    }),
  );
}

app.get(API_BASE_PATH, (_req, res) => {
  res.json({
    name: 'API Sistema de Frequencia Avance',
    version: API_VERSION,
    docs: `${API_V1_BASE_PATH}/docs`,
    legacy: ENABLE_LEGACY_API ? API_BASE_PATH : null,
    endpoints: {
      auth: [`${API_V1_BASE_PATH}/auth/register`, `${API_V1_BASE_PATH}/auth/login`, `${API_V1_BASE_PATH}/auth/forgot-password`, `${API_V1_BASE_PATH}/auth/logout`],
      salas: [`${API_V1_BASE_PATH}/salas`, `${API_V1_BASE_PATH}/salas/:salaId`, `${API_V1_BASE_PATH}/salas/:salaId/alunos`, `${API_V1_BASE_PATH}/salas/:salaId/alunos (POST)`],
      frequencia: [
        `${API_V1_BASE_PATH}/frequencia`,
        `${API_V1_BASE_PATH}/frequencia/sala/:salaId/data/:data`,
        `${API_V1_BASE_PATH}/frequencia/sala/:salaId/historico?inicio=YYYY-MM-DD&fim=YYYY-MM-DD`,
      ],
      responsaveis: [`${API_V1_BASE_PATH}/responsaveis`, `${API_V1_BASE_PATH}/responsaveis/alunos`, `${API_V1_BASE_PATH}/responsaveis/aluno/:alunoId`],
      calendario: [`${API_V1_BASE_PATH}/calendario`, `${API_V1_BASE_PATH}/calendario/:eventoId`],
    },
  });
});

const healthHandler = async (_req, res) => {
  try {
    await testConnection();
    res.json({ status: 'ok', db: dbMode });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected', detail: err.message });
  }
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.get(`${API_V1_BASE_PATH}/health`, applyApiResponseEnvelope, healthHandler);

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.use(`${API_V1_BASE_PATH}/*splat`, applyApiResponseEnvelope, (_req, res) => {
  res.status(404).json({ message: 'Endpoint nao encontrado.' });
});

if (ENABLE_LEGACY_API) {
  app.use(`${API_BASE_PATH}/*splat`, (_req, res) => {
    res.status(404).json({ message: 'Endpoint nao encontrado.' });
  });
}

// handler de erros globais — deve vir após todas as rotas
// captura exceções não tratadas e garante resposta JSON (evita HTML padrão do Express)
app.use((err, _req, res, next) => {
  void next;
  const status = err.status || err.statusCode || 500;
  const message = status >= 500
    ? 'Erro interno no servidor.'
    : (err.message || 'Erro na requisicao.');

  if (!res.headersSent) {
    const isV1Api = _req.originalUrl?.startsWith(API_V1_BASE_PATH);
    if (isV1Api) {
      res.status(status).json({
        success: false,
        data: null,
        message,
        errors: err.errors || null,
      });
      return;
    }

    res.status(status).json({ message });
  }
});
}

function createApp() {
  const app = express();
  configureApp(app);
  return app;
}

const app = createApp();

let databaseInitPromise = null;

async function ensureDatabaseReady() {
  if (!databaseInitPromise) {
    databaseInitPromise = initializeDatabase().catch((error) => {
      databaseInitPromise = null;
      throw error;
    });
  }

  return databaseInitPromise;
}

async function startServer(appInstance = app, port = PORT) {
  try {
    await ensureDatabaseReady();

    const server = http.createServer(appInstance);
    attachRealtime(server);

    server.listen(port, () => {
      console.log(`Servidor Avance ativo em http://localhost:${port}`);
    });

    return server;
  } catch (error) {
    console.error('Falha ao inicializar banco de dados:', error.message);
    process.exit(1);
  }
}

const isDirectExecution = process.argv[1] ? path.resolve(process.argv[1]) === __filename : false;

if (isDirectExecution) {
  startServer();
}

export { createApp, startServer };
export default app;
