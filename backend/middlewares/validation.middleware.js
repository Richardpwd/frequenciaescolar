import { validationResult } from 'express-validator';

export function validateRequest(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array({ onlyFirstError: true }).map((item) => ({
    field: item.path,
    location: item.location,
    message: item.msg,
    value: item.value ?? null,
  }));

  return res.status(422).json({
    message: 'Erro de validacao nos dados enviados.',
    errors,
  });
}
