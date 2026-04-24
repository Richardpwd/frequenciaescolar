function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasStandardShape(payload) {
  return isObject(payload)
    && Object.prototype.hasOwnProperty.call(payload, 'success')
    && Object.prototype.hasOwnProperty.call(payload, 'data')
    && Object.prototype.hasOwnProperty.call(payload, 'message')
    && Object.prototype.hasOwnProperty.call(payload, 'errors');
}

function normalizeSuccessPayload(payload) {
  if (payload === undefined) {
    return { data: null, message: null };
  }

  if (!isObject(payload)) {
    return { data: payload, message: null };
  }

  const message = typeof payload.message === 'string' ? payload.message : null;
  if (Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return { data: payload.data, message };
  }

  const data = { ...payload };
  delete data.message;
  delete data.errors;

  if (Object.keys(data).length === 0) {
    return { data: null, message };
  }

  return { data, message };
}

function normalizeErrorPayload(payload, fallbackMessage) {
  if (typeof payload === 'string') {
    return {
      message: payload,
      errors: null,
    };
  }

  if (!isObject(payload)) {
    return {
      message: fallbackMessage,
      errors: null,
    };
  }

  const message = typeof payload.message === 'string' ? payload.message : fallbackMessage;
  const errors = Array.isArray(payload.errors) ? payload.errors : null;

  return { message, errors };
}

export function applyApiResponseEnvelope(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (payload) => {
    if (hasStandardShape(payload) || res.locals.skipApiEnvelope) {
      return originalJson(payload);
    }

    if (res.statusCode === 204) {
      return res.send();
    }

    if (res.statusCode >= 400) {
      const normalized = normalizeErrorPayload(payload, 'Erro na requisicao.');
      return originalJson({
        success: false,
        data: null,
        message: normalized.message,
        errors: normalized.errors,
      });
    }

    const normalized = normalizeSuccessPayload(payload);

    return originalJson({
      success: true,
      data: normalized.data,
      message: normalized.message,
      errors: null,
    });
  };

  next();
}
