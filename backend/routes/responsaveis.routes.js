import { Router } from 'express';
import { body, query } from 'express-validator';
import pool from '../config/db.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
  isSafeDisplayName,
  isValidDate,
  isValidEmail,
  isValidPhone,
  normalizeEmail,
  normalizePhone,
  normalizeText,
  parsePagination,
  parsePositiveInt,
  sanitizeSearchTerm,
} from '../utils/validation.js';
import {
  paginationValidators,
  positiveIdParamValidator,
  sortByValidator,
} from '../validators/common.validators.js';

const router = Router();

const SORTABLE_ALUNOS_FIELDS = {
  id: 'id',
  nome: 'nome',
};

function resolveSortField(sortableFields, sortBy, fallback) {
  return sortableFields[sortBy] || fallback;
}

router.get(
  '/alunos',
  [
    ...paginationValidators,
    query('salaId').optional().isInt({ min: 1 }).withMessage('salaId deve ser um inteiro maior que 0.'),
    query('search').optional().isString().isLength({ max: 60 }).withMessage('search deve ter no maximo 60 caracteres.'),
    sortByValidator(Object.keys(SORTABLE_ALUNOS_FIELDS)),
    validateRequest,
  ],
  async (req, res) => {
  try {
    const salaId = parsePositiveInt(req.query.salaId);
    const search = sanitizeSearchTerm(req.query.search, 60);
    const includeMeta = String(req.query.includeMeta || '').toLowerCase() === 'true';
    const pagination = parsePagination(req.query);
    const sortBy = String(req.query.sortBy || 'nome');
    const sortOrder = String(req.query.order || 'asc').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const sortField = resolveSortField(SORTABLE_ALUNOS_FIELDS, sortBy, SORTABLE_ALUNOS_FIELDS.nome);

    const where = [];
    const params = [];

    if (salaId) {
      where.push('sala_id = ?');
      params.push(salaId);
    }

    if (search) {
      where.push('nome LIKE ?');
      params.push(`%${search}%`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const paginationSql = pagination ? 'LIMIT ? OFFSET ?' : '';
    const listParams = pagination ? [...params, pagination.limit, pagination.offset] : params;

    let total = null;
    if (includeMeta || pagination) {
      const [totalRows] = await pool.query(
        `SELECT COUNT(*) AS total
         FROM alunos
         ${whereSql}`,
        params,
      );
      total = Number(totalRows[0]?.total || 0);
    }

    const [alunos] = await pool.query(
      `SELECT id, nome
       FROM alunos
       ${whereSql}
       ORDER BY ${sortField} ${sortOrder}
       ${paginationSql}`,
      listParams,
    );

    if (!includeMeta && !pagination) {
      return res.json(alunos);
    }

    return res.json({
      items: alunos,
      meta: {
        total,
        page: pagination?.page || 1,
        limit: pagination?.limit || alunos.length || 0,
        hasNextPage: pagination ? pagination.offset + alunos.length < total : false,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao carregar alunos.' });
  }
});

router.get('/aluno/:alunoId', [positiveIdParamValidator('alunoId', 'alunoId'), validateRequest], async (req, res) => {
  try {
    const alunoId = parsePositiveInt(req.params.alunoId);

    if (!alunoId) {
      return res.status(400).json({ message: 'Aluno invalido.' });
    }

    const [alunoRows] = await pool.query('SELECT id FROM alunos WHERE id = ? LIMIT 1', [alunoId]);
    if (alunoRows.length === 0) {
      return res.status(404).json({ message: 'Aluno nao encontrado.' });
    }

    const [responsaveis] = await pool.query(
      `SELECT id, nome, email, telefone, data_nascimento
       FROM responsaveis
       WHERE aluno_id = ?
       ORDER BY nome`,
      [alunoId],
    );

    return res.json(responsaveis);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao carregar responsaveis do aluno.' });
  }
});

router.post(
  '/',
  [
    body('alunoId').optional().isInt({ min: 1 }).withMessage('alunoId deve ser um inteiro maior que 0.'),
    body('nomeResponsavel').trim().notEmpty().withMessage('nomeResponsavel e obrigatorio.'),
    body('email').trim().notEmpty().withMessage('email e obrigatorio.'),
    body('telefone').trim().notEmpty().withMessage('telefone e obrigatorio.'),
    body('dataNascimento').trim().notEmpty().withMessage('dataNascimento e obrigatoria.'),
    body('nomeAluno').if(body('alunoId').not().exists()).trim().notEmpty().withMessage('nomeAluno e obrigatorio quando alunoId nao for informado.'),
    validateRequest,
  ],
  async (req, res) => {
  try {
    const alunoId = parsePositiveInt(req.body?.alunoId);
    const nomeResponsavel = normalizeText(req.body?.nomeResponsavel, 120);
    const email = normalizeEmail(req.body?.email);
    const nomeAluno = normalizeText(req.body?.nomeAluno, 120);
    const telefone = normalizePhone(req.body?.telefone);
    const dataNascimento = normalizeText(req.body?.dataNascimento, 10);

    if (!nomeResponsavel || !email || !telefone || !dataNascimento || (!alunoId && !nomeAluno)) {
      return res.status(400).json({ message: 'Preencha todos os campos do responsavel (nome, email, telefone, data de nascimento e alunoId ou nomeAluno).' });
    }

    if (!isSafeDisplayName(nomeResponsavel, { min: 2, max: 120 }) || !isValidEmail(email) || !isValidPhone(telefone) || !isValidDate(dataNascimento)) {
      return res.status(400).json({ message: 'Os dados do responsavel contem valores invalidos.' });
    }

    let alunoIdFinal = alunoId;

    if (!alunoIdFinal && nomeAluno) {
      const [alunoRows] = await pool.query(
        'SELECT id FROM alunos WHERE nome = ? LIMIT 1',
        [nomeAluno],
      );

      if (alunoRows.length === 0) {
        return res.status(404).json({ message: 'Aluno nao encontrado. Use o nome listado no sistema ou forneça o alunoId.' });
      }

      alunoIdFinal = alunoRows[0].id;
    }

    if (!alunoIdFinal) {
      return res.status(400).json({ message: 'Aluno invalido.' });
    }

    await pool.query(
      `INSERT INTO responsaveis (nome, email, telefone, data_nascimento, aluno_id)
       VALUES (?, ?, ?, ?, ?)`,
      [nomeResponsavel, email, telefone, dataNascimento, alunoIdFinal],
    );

    return res.status(201).json({ message: 'Responsavel cadastrado com sucesso.' });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ja existe responsavel com este e-mail para este aluno.' });
    }

    console.error(error);
    return res.status(500).json({ message: 'Erro ao cadastrar responsavel.' });
  }
});

export default router;
