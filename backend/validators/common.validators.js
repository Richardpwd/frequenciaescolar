import { param, query } from 'express-validator';

export const paginationValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page deve ser um inteiro maior que 0.'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit deve ser um inteiro entre 1 e 100.'),
  query('includeMeta')
    .optional()
    .isBoolean()
    .withMessage('includeMeta deve ser true ou false.'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('order deve ser asc ou desc.'),
];

export function sortByValidator(allowedFields) {
  return query('sortBy')
    .optional()
    .isIn(allowedFields)
    .withMessage(`sortBy invalido. Valores aceitos: ${allowedFields.join(', ')}.`);
}

export function positiveIdParamValidator(paramName, label = 'ID') {
  return param(paramName)
    .isInt({ min: 1 })
    .withMessage(`${label} deve ser um inteiro maior que 0.`);
}
