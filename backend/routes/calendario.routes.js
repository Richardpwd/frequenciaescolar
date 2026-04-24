import { Router } from 'express';
import { body, param, query } from 'express-validator';
import pool from '../config/db.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { broadcastRealtime } from '../realtime.js';
import {
  getMonthDateRange,
  isValidDate,
  isValidMonth,
  normalizeText,
  parsePositiveInt,
} from '../utils/validation.js';

const router = Router();

const EVENT_TYPES = new Set([
  'feriado',
  'reuniao',
  'prova',
  'evento',
  'conselho',
  'recesso',
  'aula-especial',
  'observacao',
]);

const DEFAULT_COLORS = {
  feriado: '#f59e0b',
  reuniao: '#2563eb',
  prova: '#dc2626',
  evento: '#16a34a',
  conselho: '#7c3aed',
  recesso: '#0f766e',
  'aula-especial': '#0891b2',
  observacao: '#64748b',
};

function normalizeEventType(value) {
  const normalized = normalizeText(value || 'evento', 30).toLowerCase();
  return EVENT_TYPES.has(normalized) ? normalized : null;
}

function normalizeColor(value, fallbackType) {
  const normalized = normalizeText(value, 20);
  if (/^#[0-9a-f]{6}$/i.test(normalized)) {
    return normalized;
  }

  return DEFAULT_COLORS[fallbackType] || DEFAULT_COLORS.evento;
}

function buildPayload(body = {}) {
  const titulo = normalizeText(body.titulo, 120);
  const data = normalizeText(body.data, 10);
  const tipo = normalizeEventType(body.tipo);
  const descricao = normalizeText(body.descricao, 255);
  const cor = normalizeColor(body.cor, tipo || 'evento');

  return { titulo, data, tipo, descricao, cor };
}

router.get(
  '/',
  [
    query('mes').optional().matches(/^[0-9]{4}-[0-9]{2}$/).withMessage('mes deve estar no formato YYYY-MM.'),
    validateRequest,
  ],
  async (req, res) => {
  try {
    const mes = normalizeText(req.query.mes, 7) || new Date().toISOString().slice(0, 7);

    if (!isValidMonth(mes)) {
      return res.status(400).json({ message: 'Mês invalido. Use o formato YYYY-MM.' });
    }

    const { inicio, fim } = getMonthDateRange(mes);

    const [items] = await pool.query(
      `SELECT id, titulo, data_evento, tipo, descricao, cor, criado_em, atualizado_em
       FROM calendario_eventos
       WHERE data_evento BETWEEN ? AND ?
       ORDER BY data_evento ASC, criado_em ASC`,
      [inicio, fim],
    );

    return res.json({ mes, items });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao buscar eventos do calendario.' });
  }
});

router.get('/:eventoId', [param('eventoId').isInt({ min: 1 }).withMessage('eventoId deve ser um inteiro maior que 0.'), validateRequest], async (req, res) => {
  try {
    const eventoId = parsePositiveInt(req.params.eventoId);

    if (!eventoId) {
      return res.status(400).json({ message: 'Evento invalido.' });
    }

    const [rows] = await pool.query(
      `SELECT id, titulo, data_evento, tipo, descricao, cor, criado_em, atualizado_em
       FROM calendario_eventos
       WHERE id = ?
       LIMIT 1`,
      [eventoId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Evento nao encontrado.' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao buscar evento do calendario.' });
  }
});

router.post(
  '/',
  [
    body('titulo').trim().notEmpty().withMessage('titulo e obrigatorio.'),
    body('data').trim().notEmpty().withMessage('data e obrigatoria.'),
    body('tipo').trim().notEmpty().withMessage('tipo e obrigatorio.'),
    validateRequest,
  ],
  async (req, res) => {
  try {
    const payload = buildPayload(req.body);

    if (!payload.titulo || !payload.data) {
      return res.status(400).json({ message: 'Informe titulo e data do evento.' });
    }

    if (!isValidDate(payload.data)) {
      return res.status(400).json({ message: 'Data invalida. Use o formato YYYY-MM-DD.' });
    }

    if (!payload.tipo) {
      return res.status(400).json({ message: 'Tipo de evento invalido.' });
    }

    const [result] = await pool.query(
      `INSERT INTO calendario_eventos (titulo, data_evento, tipo, descricao, cor)
       VALUES (?, ?, ?, ?, ?)`,
      [payload.titulo, payload.data, payload.tipo, payload.descricao || null, payload.cor],
    );

    broadcastRealtime('calendario.changed', {
      action: 'created',
      eventoId: result.insertId,
      data: payload.data,
      tipo: payload.tipo,
    });

    return res.status(201).json({
      message: 'Evento do calendario salvo com sucesso.',
      eventoId: result.insertId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao salvar evento do calendario.' });
  }
});

router.put(
  '/:eventoId',
  [
    param('eventoId').isInt({ min: 1 }).withMessage('eventoId deve ser um inteiro maior que 0.'),
    body('titulo').trim().notEmpty().withMessage('titulo e obrigatorio.'),
    body('data').trim().notEmpty().withMessage('data e obrigatoria.'),
    body('tipo').trim().notEmpty().withMessage('tipo e obrigatorio.'),
    validateRequest,
  ],
  async (req, res) => {
  try {
    const eventoId = parsePositiveInt(req.params.eventoId);
    const payload = buildPayload(req.body);

    if (!eventoId) {
      return res.status(400).json({ message: 'Evento invalido.' });
    }

    if (!payload.titulo || !payload.data) {
      return res.status(400).json({ message: 'Informe titulo e data do evento.' });
    }

    if (!isValidDate(payload.data)) {
      return res.status(400).json({ message: 'Data invalida. Use o formato YYYY-MM-DD.' });
    }

    if (!payload.tipo) {
      return res.status(400).json({ message: 'Tipo de evento invalido.' });
    }

    const [result] = await pool.query(
      `UPDATE calendario_eventos
       SET titulo = ?, data_evento = ?, tipo = ?, descricao = ?, cor = ?, atualizado_em = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [payload.titulo, payload.data, payload.tipo, payload.descricao || null, payload.cor, eventoId],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Evento nao encontrado.' });
    }

    broadcastRealtime('calendario.changed', {
      action: 'updated',
      eventoId,
      data: payload.data,
      tipo: payload.tipo,
    });

    return res.json({ message: 'Evento atualizado com sucesso.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao atualizar evento do calendario.' });
  }
});

router.delete('/:eventoId', [param('eventoId').isInt({ min: 1 }).withMessage('eventoId deve ser um inteiro maior que 0.'), validateRequest], async (req, res) => {
  try {
    const eventoId = parsePositiveInt(req.params.eventoId);

    if (!eventoId) {
      return res.status(400).json({ message: 'Evento invalido.' });
    }

    const [result] = await pool.query('DELETE FROM calendario_eventos WHERE id = ?', [eventoId]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Evento nao encontrado.' });
    }

    broadcastRealtime('calendario.changed', {
      action: 'deleted',
      eventoId,
    });

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao remover evento do calendario.' });
  }
});

export default router;
